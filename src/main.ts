import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, MainTabCommandsSettings, MainTabCommandsSettingTab } from './settings';

export default class MainTabCommands extends Plugin {
	settings!: MainTabCommandsSettings;

	// The most recently focused tab in the main area, and the one focused before it.
	private focusedTab: WorkspaceLeaf | null = null;
	private previouslyFocusedTab: WorkspaceLeaf | null = null;

	async onload() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MainTabCommandsSettings>,
		);
		this.addSettingTab(new MainTabCommandsSettingTab(this.app, this));

		// Track previously focused tab
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (!leaf || leaf === this.focusedTab || !this.isMainAreaTab(leaf)) return;
				this.previouslyFocusedTab = this.focusedTab;
				this.focusedTab = leaf;
			}),
		);

		this.addCommand({
			id: 'close',
			name: 'Close current tab in the main area',
			checkCallback: (checking: boolean) => {
				if (this.getNumberOfTabsInCurrentTabGroup() < 1) return false;
				if (!checking) this.closeCurrentTab();
				return true;
			},
		});
		this.addCommand({
			id: 'next-tab',
			name: 'Go to next tab in the main area',
			checkCallback: (checking: boolean) => {
				if (this.getNumberOfTabsInCurrentTabGroup() < 2) return false;
				if (!checking) this.goToTabOffset(1);
				return true;
			},
			repeatable: true,
		});
		this.addCommand({
			id: 'previous-tab',
			name: 'Go to previous tab in the main area',
			checkCallback: (checking: boolean) => {
				if (this.getNumberOfTabsInCurrentTabGroup() < 2) return false;
				if (!checking) this.goToTabOffset(-1);
				return true;
			},
			repeatable: true,
		});

		for (let i = 1; i <= 8; i++) {
			this.addCommand({
				id: `goto-tab-${i}`,
				name: `Go to tab #${i} in the main area`,
				checkCallback: (checking: boolean) => {
					if (this.getNumberOfTabsInCurrentTabGroup() < i) return false;
					if (!checking) this.goToTab(i - 1);
					return true;
				},
			});
		}

		this.addCommand({
			id: 'goto-last-tab',
			name: 'Go to last tab in the main area',
			checkCallback: (checking: boolean) => {
				if (this.getNumberOfTabsInCurrentTabGroup() < 1) return false;
				if (!checking) this.goToLastTab();
				return true;
			},
		});
	}

	private getCurrentTab(): WorkspaceLeaf | null {
		return this.app.workspace.getMostRecentLeaf();
	}

	private getTabsInCurrentTabGroup(): WorkspaceLeaf[] | null {
		const currentTab = this.getCurrentTab();
		if (!currentTab) return null;

		const tabsInSameTabGroup: WorkspaceLeaf[] = [];
		this.app.workspace.iterateRootLeaves((leaf) => {
			if (leaf.parent === currentTab.parent) tabsInSameTabGroup.push(leaf);
		});

		if (tabsInSameTabGroup.length === 0) return null;
		return tabsInSameTabGroup;
	}

	private getNumberOfTabsInCurrentTabGroup(): number {
		const tabsInCurrentTabGroup = this.getTabsInCurrentTabGroup();
		if (!tabsInCurrentTabGroup) return 0;
		return tabsInCurrentTabGroup.length;
	}

	private goToTabOffset(offset: number) {
		const currentTab = this.getCurrentTab();
		const tabsInCurrentTabGroup = this.getTabsInCurrentTabGroup();
		if (!currentTab || !tabsInCurrentTabGroup) return;

		const currentTabIndex = tabsInCurrentTabGroup.indexOf(currentTab);
		if (currentTabIndex === -1) return;

		const targetTab =
			tabsInCurrentTabGroup[
				(currentTabIndex + offset + tabsInCurrentTabGroup.length) % tabsInCurrentTabGroup.length
			];
		if (targetTab) this.app.workspace.setActiveLeaf(targetTab, { focus: true });
	}

	private goToTab(index: number) {
		const tabsInCurrentTabGroup = this.getTabsInCurrentTabGroup();
		if (!tabsInCurrentTabGroup) return;

		if (index < 0 || index >= tabsInCurrentTabGroup.length) return;

		const targetTab = tabsInCurrentTabGroup[index];
		if (targetTab) this.app.workspace.setActiveLeaf(targetTab, { focus: true });
	}

	private goToLastTab() {
		const tabsInCurrentTabGroup = this.getTabsInCurrentTabGroup();
		if (!tabsInCurrentTabGroup) return;

		const targetTab = tabsInCurrentTabGroup.last();
		if (targetTab) this.app.workspace.setActiveLeaf(targetTab, { focus: true });
	}

	private isMainAreaTab(tab: WorkspaceLeaf): boolean {
		const root = tab.getRoot();
		return root !== this.app.workspace.leftSplit && root !== this.app.workspace.rightSplit;
	}

	private closeCurrentTab() {
		const currentTab = this.app.workspace.getMostRecentLeaf();
		if (!currentTab) return;

		if (this.settings.preventClosingPinnedTabs && currentTab.getViewState().pinned) {
			new Notice('Cannot close pinned tab');
			return;
		}

		const tabToFocus = this.getTabToFocusAfterClose(currentTab);
		currentTab.detach();
		if (tabToFocus) this.app.workspace.setActiveLeaf(tabToFocus, { focus: true });
	}

	private getTabToFocusAfterClose(closingTab: WorkspaceLeaf): WorkspaceLeaf | null {
		const setting = this.settings.focusAfterCloseTab;

		// Fallback to stock Obsidian behavior
		if (setting === 'right') return null;

		if (setting === 'left') {
			const tabsInCurrentTabGroup = this.getTabsInCurrentTabGroup();
			if (!tabsInCurrentTabGroup) return null;
			const closingTabIndex = tabsInCurrentTabGroup.indexOf(closingTab);
			return tabsInCurrentTabGroup[closingTabIndex - 1] ?? null;
		}

		if (setting === 'previous_tab') {
			const previousTab = this.previouslyFocusedTab;
			if (!previousTab || previousTab === closingTab) return null;
			return previousTab;
		}

		return null;
	}
}
