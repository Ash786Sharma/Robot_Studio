import { create } from "zustand"

interface IdeState {
  isMenuOpen: boolean
  isNewProjectModalOpen: boolean
  createNewProject: () => void
  closeNewProjectModal: () => void
  openExistingProject: () => void
  closeProject: () => void
}

export const useIdeStore = create<IdeState>((set) => ({
  isMenuOpen: true,
  isNewProjectModalOpen: false,

  createNewProject: () => set({ isNewProjectModalOpen: true }),
  closeNewProjectModal: () => set({ isNewProjectModalOpen: false }),
  openExistingProject: () => console.log("Opening existing project..."),
  closeProject: () => {
    console.log("Closing current project...")
    set({ isMenuOpen: false })
  }
}))
