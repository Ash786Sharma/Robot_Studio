import { create } from "zustand"

export type ViewType = "editor" | "flow" | "viewer" | "config"
export type SaveStatus = "saved" | "unsaved"

export interface WorkspaceTabStatus {
  saveStatus: SaveStatus
  gitStatus?: "M" | "U" | "A" | "D"
}

export interface WorkspaceFile {
  id: string
  name: string
  path: string[]
  icon: string
  type: string
  blockType?: string
  device: "robot" | "plc" | "hmi" | "unknown"
  safety: boolean
}

interface WorkspaceState {
  leftTab: ViewType
  rightTab: ViewType
  isSplitView: boolean
  hiddenTabs: ViewType[]
  tabStatuses: Record<string, WorkspaceTabStatus | undefined>
  showChanges: { left: boolean; right: boolean }
  activeFile: WorkspaceFile | null
  openFiles: WorkspaceFile[]
  activeFileByPane: { left: string | null; right: string | null }
  
  // State mutations
  setLeftTab: (view: ViewType) => void
  setRightTab: (view: ViewType) => void
  setIsSplitView: (split: boolean) => void
  openTab: (tabId: ViewType) => void
  setTabStatus: (tabId: string, status: WorkspaceTabStatus) => void
  setShowChanges: (pane: "left" | "right", show: boolean) => void
  openFile: (file: WorkspaceFile) => void
  activateFile: (fileId: string, pane: "left" | "right") => void
  closeFile: (fileId: string, pane: "left" | "right") => void
  closeAllFiles: () => void
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
    isSplitView: false,
    hiddenTabs: [],
    tabStatuses: {
      editor: { saveStatus: "unsaved", gitStatus: "M" },
      flow: { saveStatus: "saved", gitStatus: "U" },
    },
    showChanges: { left: false, right: false },
    activeFile: null,
    openFiles: [],
    activeFileByPane: { left: null, right: null },

    setLeftTab: (view) => set((state) => ({
      leftTab: view,
      activeFileByPane: view === "viewer" ? { ...state.activeFileByPane, left: null } : state.activeFileByPane,
    })),
    setRightTab: (view) => set((state) => ({
      rightTab: view,
      activeFileByPane: view === "viewer" ? { ...state.activeFileByPane, right: null } : state.activeFileByPane,
    })),
    setIsSplitView: (split) => set({ isSplitView: split }),
    openTab: (tabId) => set((state) => ({
      hiddenTabs: state.hiddenTabs.filter((hiddenTab) => hiddenTab !== tabId),
    })),
    setTabStatus: (tabId, status) => set((state) => ({
      tabStatuses: { ...state.tabStatuses, [tabId]: status },
    })),
    setShowChanges: (pane, show) => set((state) => ({
      showChanges: { ...state.showChanges, [pane]: show },
    })),
    openFile: (activeFile) => set((state) => {
      const editorFile = activeFile.type === "db" || ["rprg", "rsprg", "scl"].some((extension) => activeFile.name.toLowerCase().endsWith(`.${extension}`)) || activeFile.type === "hmi ui"
      const isConfigFile = activeFile.type === "hardware config" || activeFile.type === "software config"
      const targetTab: ViewType = isConfigFile ? "config" : editorFile ? "editor" : "flow"

      return {
        activeFile,
        openFiles: state.openFiles.some((file) => file.id === activeFile.id) ? state.openFiles : [...state.openFiles, activeFile],
        tabStatuses: state.tabStatuses[activeFile.id] ? state.tabStatuses : { ...state.tabStatuses, [activeFile.id]: { saveStatus: "saved", gitStatus: "U" } },
        activeFileByPane: { ...state.activeFileByPane, left: activeFile.id },
        hiddenTabs: state.hiddenTabs.filter((hiddenTab) => hiddenTab !== targetTab),
        leftTab: targetTab,
        isSplitView: false,
        showChanges: { left: false, right: false },
      }
    }),
    activateFile: (fileId, pane) => set((state) => {
      const file = state.openFiles.find((openFile) => openFile.id === fileId)
      if (!file) return state
      const editorFile = file.type === "db" || ["rprg", "rsprg", "scl"].some((extension) => file.name.toLowerCase().endsWith(`.${extension}`)) || file.type === "hmi ui"
      const isConfigFile = file.type === "hardware config" || file.type === "software config"
      return {
        activeFile: file,
        activeFileByPane: { ...state.activeFileByPane, [pane]: fileId },
        [pane === "left" ? "leftTab" : "rightTab"]: isConfigFile ? "config" : editorFile ? "editor" : "flow",
        isSplitView: pane === "left" ? state.isSplitView : true,
      }
    }),
    closeFile: (fileId, pane) => set((state) => {
      const openFiles = state.openFiles.filter((file) => file.id !== fileId)
      const closingActiveFile = state.activeFileByPane[pane] === fileId
      const viewerOpen = !state.hiddenTabs.includes("viewer") && (state.leftTab === "viewer" || state.rightTab === "viewer")
      const activeFileByPane = {
        ...state.activeFileByPane,
        [pane]: closingActiveFile ? null : state.activeFileByPane[pane],
      }
      return {
        openFiles,
        activeFileByPane,
        activeFile: state.activeFile?.id === fileId ? null : state.activeFile,
        [pane === "left" ? "leftTab" : "rightTab"]: closingActiveFile && viewerOpen ? "viewer" : state[pane === "left" ? "leftTab" : "rightTab"],
      }
    }),
    closeAllFiles: () => set({
      openFiles: [],
      activeFile: null,
      activeFileByPane: { left: null, right: null },
      isSplitView: false,
    }),

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
      isSplitView: false,
      hiddenTabs: [],
      showChanges: { left: false, right: false },
      activeFile: null,
      openFiles: [],
      activeFileByPane: { left: null, right: null },
    })
  }
})
