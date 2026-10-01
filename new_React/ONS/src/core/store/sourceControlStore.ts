import { create } from "zustand"

interface SourceControlState {
  commitMessage: string
  setCommitMessage: (message: string) => void
}

/** Real git status/log/branches now live in React Query (see SourceControlPanel) — this
 *  store only holds the commit message draft, which is local UI state. */
export const useSourceControlStore = create<SourceControlState>((set) => ({
  commitMessage: "",
  setCommitMessage: (commitMessage) => set({ commitMessage }),
}))
