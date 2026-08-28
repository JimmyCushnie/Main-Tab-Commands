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
			callback: () => this.cycleMainTab(1),
		});
		this.addCommand({
			id: 'prev-tab',
			name: 'Go to previous tab in the main area',
			callback: () => this.cycleMainTab(-1),
		});
	}

	private getCurrentTab(): WorkspaceLeaf | null {
		const ws = this.app.workspace;
		return ws.getMostRecentLeaf(ws.rootSplit);
	}

	private cycleMainTab(offset: number) {
		const currentTab = this.getCurrentTab();
		if (!currentTab) return;

		const tabsInSameTabGroup: WorkspaceLeaf[] = [];
		this.app.workspace.iterateRootLeaves((leaf) => {
			if (leaf.parent === currentTab.parent) tabsInSameTabGroup.push(leaf);
		});

		const currentTabIndex = tabsInSameTabGroup.indexOf(currentTab);
		if (currentTabIndex === -1) return;

		const targetTab =
			tabsInSameTabGroup[(currentTabIndex + offset + tabsInSameTabGroup.length) % tabsInSameTabGroup.length];
		if (targetTab) this.app.workspace.setActiveLeaf(targetTab, { focus: true });
	}
}
