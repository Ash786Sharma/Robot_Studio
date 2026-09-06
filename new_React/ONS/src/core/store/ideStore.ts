import { create } from "zustand"

export type ActiveView = "Explorer" | "3D Viewer" | "Terminal" | "Problems" | "Settings" | null

interface IdeState {
  isMenuOpen: boolean
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  createNewProject: () => void
  openExistingProject: () => void
  closeProject: () => void
}

export const useIdeStore = create<IdeState>((set) => ({
  isMenuOpen: true,
  activeView: "Explorer",
  
  setActiveView: (view) => set(() => ({
    activeView: view,
    isMenuOpen: view !== null, 
  })),

  createNewProject: () => console.log("Creating new project..."),
  openExistingProject: () => console.log("Opening existing project..."),
  closeProject: () => {
    console.log("Closing current project...")
    set({ activeView: null, isMenuOpen: false })
  }
}))
