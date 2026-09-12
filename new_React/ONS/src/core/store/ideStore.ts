import { create } from "zustand"

interface IdeState {
  isMenuOpen: boolean
  createNewProject: () => void
  openExistingProject: () => void
  closeProject: () => void
}

export const useIdeStore = create<IdeState>((set) => ({
  isMenuOpen: true,
  
  createNewProject: () => console.log("Creating new project..."),
  openExistingProject: () => console.log("Opening existing project..."),
  closeProject: () => {
    console.log("Closing current project...")
    set({ isMenuOpen: false })
  }
}))
