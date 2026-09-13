import { create } from "zustand"

export interface SourceChange {
  id: string
  path: string
  fileName: string
  status: "M" | "A" | "D" | "U"
  staged: boolean
  additions: number
  deletions: number
}

export interface SourceCommit {
  id: string
  message: string
  author: string
  time: string
  current?: boolean
}

interface SourceControlState {
  branch: string
  commitMessage: string
  changes: SourceChange[]
  commits: SourceCommit[]
  setCommitMessage: (message: string) => void
  setBranch: (branch: string) => void
  stageChange: (changeId: string) => void
  stageAll: () => void
  undoChange: (changeId: string) => void
  commitStaged: () => void
}

const initialChanges: SourceChange[] = [
  { id: "workspace-canvas", path: "src/features/ide-shell/components/WorkspaceCanvas.tsx", fileName: "WorkspaceCanvas.tsx", status: "M", staged: false, additions: 18, deletions: 4 },
  { id: "source-control", path: "src/features/ide-shell/components/SourceControlPanel.tsx", fileName: "SourceControlPanel.tsx", status: "A", staged: false, additions: 126, deletions: 0 },
  { id: "robot-model", path: "models/ur5/ur5.urdf", fileName: "ur5.urdf", status: "U", staged: false, additions: 6, deletions: 2 },
]

const initialCommits: SourceCommit[] = [
  { id: "head", message: "Open Robot Studio workspace", author: "You", time: "now", current: true },
  { id: "previous", message: "Add robot project explorer", author: "You", time: "2h ago" },
  { id: "initial", message: "Initial project setup", author: "You", time: "Yesterday" },
]

export const useSourceControlStore = create<SourceControlState>((set) => ({
  branch: "main",
  commitMessage: "",
  changes: initialChanges,
  commits: initialCommits,

  setCommitMessage: (commitMessage) => set({ commitMessage }),
  setBranch: (branch) => set({ branch }),
  stageChange: (changeId) => set((state) => ({
    changes: state.changes.map((change) =>
      change.id === changeId ? { ...change, staged: !change.staged } : change
    ),
  })),
  stageAll: () => set((state) => ({
    changes: state.changes.map((change) => ({ ...change, staged: true })),
  })),
  undoChange: (changeId) => set((state) => ({
    changes: state.changes.filter((change) => change.id !== changeId),
  })),
  commitStaged: () => set((state) => {
    const message = state.commitMessage.trim()
    const stagedChanges = state.changes.filter((change) => change.staged)

    if (!message || stagedChanges.length === 0) return state

    return {
      commitMessage: "",
      changes: state.changes.filter((change) => !change.staged),
      commits: [
        {
          id: `commit-${Date.now()}`,
          message,
          author: "You",
          time: "now",
          current: true,
        },
        ...state.commits.map((commit) => ({ ...commit, current: false })),
      ],
    }
  }),
}))