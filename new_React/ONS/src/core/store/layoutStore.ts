import { create } from "zustand"

export type ActiveView = "Explorer" | "3D Viewer" | "Terminal" | "Problems" | "Settings" | null

interface LayoutState {
  activeView: ActiveView
  isExplorerOpen: boolean
  isTerminalOpen: boolean
  setActiveView: (view: ActiveView) => void
  toggleExplorer: () => void
  toggleTerminal: () => void
  minimizeAllPanels: () => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  activeView: "Explorer",
  isExplorerOpen: true,
  isTerminalOpen: true,
  
  setActiveView: (view) => set(() => {
    const nextState: Partial<LayoutState> = { activeView: view }
    if (view === "Explorer") nextState.isExplorerOpen = true
    if (view === "Terminal") nextState.isTerminalOpen = true
    return nextState
  }),

  toggleExplorer: () => set((state) => ({ isExplorerOpen: !state.isExplorerOpen })),
  toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
  
  minimizeAllPanels: () => set({ isExplorerOpen: false, isTerminalOpen: false, activeView: null })
}))
