import { create } from "zustand"
import { useWorkspaceStore } from "./workspaceStore"

interface ProjectState {
  activeProjectId: string | null
  setActiveProjectId: (id: string | null) => void
  closeActiveProject: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  // Only clears the active project + open editor tabs — does NOT touch auth
  // or trigger the bootstrap flow, so the IDE shell stays up and shows the
  // "no project open" placeholder instead of tearing down the whole layout.
  closeActiveProject: () => {
    useWorkspaceStore.getState().closeAllFiles()
    set({ activeProjectId: null })
  },
}))
