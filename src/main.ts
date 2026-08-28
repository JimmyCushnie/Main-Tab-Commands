import { Plugin, WorkspaceLeaf } from 'obsidian';

export default class MainTabCommands extends Plugin {
	async onload() {
		this.addCommand({
			id: 'close',
			name: 'Close current tab in the main area',
			callback: () => this.getCurrentTab()?.detach(),
		});
		this.addCommand({
			id: 'next-tab',
			name: 'Go to next tab in the main area',
			callback: () => this.goToTabOffset(1),
		});
		this.addCommand({
			id: 'previous-tab',
			name: 'Go to previous tab in the main area',
			callback: () => this.goToTabOffset(-1),
		});
		this.addCommand({
			id: 'goto-tab-1',
			name: 'Go to tab #1 in the main area',
			callback: () => this.goToTab(0),
		});
		this.addCommand({
			id: 'goto-last-tab',
			name: 'Go to last tab in the main area',
			callback: () => this.goToLastTab(),
		});

		for (let i = 2; i <= 8; i++) {
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
	}

	private getCurrentTab(): WorkspaceLeaf | null {
		const ws = this.app.workspace;
		return ws.getMostRecentLeaf(ws.rootSplit);
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
}
