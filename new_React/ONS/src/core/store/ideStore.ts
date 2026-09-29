import { create } from "zustand"
import { useProjectStore } from "./projectStore"

interface IdeState {
  isMenuOpen: boolean
  isNewProjectModalOpen: boolean
  isAddDeviceModalOpen: boolean
  isCreateRobotModalOpen: boolean
  isOpenProjectModalOpen: boolean
  createNewProject: () => void
  closeNewProjectModal: () => void
  openAddDeviceModal: () => void
  closeAddDeviceModal: () => void
  openCreateRobotModal: () => void
  closeCreateRobotModal: () => void
  openExistingProject: () => void
  closeOpenProjectModal: () => void
  closeProject: () => void
}

export const useIdeStore = create<IdeState>((set) => ({
  isMenuOpen: true,
  isNewProjectModalOpen: false,
  isAddDeviceModalOpen: false,
  isCreateRobotModalOpen: false,
  isOpenProjectModalOpen: false,

  createNewProject: () => set({ isNewProjectModalOpen: true }),
  closeNewProjectModal: () => set({ isNewProjectModalOpen: false }),
  openAddDeviceModal: () => set({ isAddDeviceModalOpen: true }),
  closeAddDeviceModal: () => set({ isAddDeviceModalOpen: false }),
  openCreateRobotModal: () => set({ isCreateRobotModalOpen: true }),
  closeCreateRobotModal: () => set({ isCreateRobotModalOpen: false }),
  openExistingProject: () => set({ isOpenProjectModalOpen: true }),
  closeOpenProjectModal: () => set({ isOpenProjectModalOpen: false }),
  closeProject: () => useProjectStore.getState().closeActiveProject(),
}))
