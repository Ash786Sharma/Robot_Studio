import { create } from "zustand"

export type ViewType = "editor" | "flow" | "viewer"

interface WorkspaceState {
  leftTab: ViewType
  rightTab: ViewType
  isSplitView: boolean
  hiddenTabs: ViewType[]
  
  // State mutations
  setLeftTab: (view: ViewType) => void
  setRightTab: (view: ViewType) => void
  setIsSplitView: (split: boolean) => void
  closeTab: (tabId: ViewType, pane: "left" | "right") => void
  restoreWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
  const allTabs: ViewType[] = ["editor", "flow", "viewer"]

  const findFallbackTab = (closedTab: ViewType, currentHidden: ViewType[]) => {
    const nextHiddenSet = [...currentHidden, closedTab]
    const available = allTabs.filter((t) => !nextHiddenSet.includes(t))
    return available.length > 0 ? available[0] : null
  }

  return {
    leftTab: "editor",
    rightTab: "flow",
    isSplitView: true,
    hiddenTabs: [],

    setLeftTab: (view) => set({ leftTab: view }),
    setRightTab: (view) => set({ rightTab: view }),
    setIsSplitView: (split) => set({ isSplitView: split }),

    closeTab: (tabId, pane) => {
      const { hiddenTabs, leftTab, rightTab } = get()
      const nextHidden = [...hiddenTabs, tabId]
      const nextState: Partial<WorkspaceState> = { hiddenTabs: nextHidden }

      // Route layout focus tracking safely if active view viewport shuts down
      if (pane === "left" && leftTab === tabId) {
        const fallback = findFallbackTab(tabId, hiddenTabs)
        if (fallback) nextState.leftTab = fallback
      } else if (pane === "right" && rightTab === tabId) {
        const fallback = findFallbackTab(tabId, hiddenTabs)
        if (fallback) nextState.rightTab = fallback
      }

      set(nextState)
    },

    restoreWorkspace: () => set({
      leftTab: "editor",
      rightTab: "flow",
      isSplitView: true,
      hiddenTabs: []
    })
  }
})
