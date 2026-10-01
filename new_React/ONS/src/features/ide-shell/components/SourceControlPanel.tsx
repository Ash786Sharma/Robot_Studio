import * as LucideIcons from "lucide-react"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IdeBarItem } from "./IdeBarItem"
import { IdeMenuItem, type MenuItemData } from "./IdeMenuItem"
import { useLayoutStore } from "@/core/store/layoutStore"
import { useSourceControlStore } from "@/core/store/sourceControlStore"
import { useWorkspaceStore } from "@/core/store/workspaceStore"
import { useProjectStore } from "@/core/store/projectStore"
import { gitApi, type GitChangeDto } from "@/core/api/gitApi"
import { ApiError } from "@/core/api/httpClient"

const statusColors = {
  M: "text-amber-400",
  A: "text-emerald-400",
  D: "text-destructive",
  U: "text-sky-400",
}

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

const ChangeRow = ({ change, projectId, onError }: { change: GitChangeDto; projectId: string; onError: (message: string | null) => void }) => {
  const setLeftTab = useWorkspaceStore((state) => state.setLeftTab)
  const setIsSplitView = useWorkspaceStore((state) => state.setIsSplitView)
  const queryClient = useQueryClient()

  const invalidateStatus = () => queryClient.invalidateQueries({ queryKey: ["git-status", projectId] })

  const stageMutation = useMutation({
    mutationFn: () => gitApi.stage(projectId, [change.path]),
    onSuccess: invalidateStatus,
    onError: (error) => onError(errorMessageOf(error, "Failed to stage changes")),
  })
  const unstageMutation = useMutation({
    mutationFn: () => gitApi.unstage(projectId, [change.path]),
    onSuccess: invalidateStatus,
    onError: (error) => onError(errorMessageOf(error, "Failed to unstage changes")),
  })
  const discardMutation = useMutation({
    mutationFn: () => gitApi.discard(projectId, change.path),
    onSuccess: () => {
      invalidateStatus()
      queryClient.invalidateQueries({ queryKey: ["file-tree", projectId] })
    },
    onError: (error) => onError(errorMessageOf(error, "Failed to discard changes")),
  })

  const isBusy = stageMutation.isPending || unstageMutation.isPending || discardMutation.isPending

  const openFile = () => {
    setLeftTab("editor")
    setIsSplitView(false)
  }

  return (
    <div className="group flex min-w-0 items-center gap-1.5 px-2 py-1.5 text-[11px] hover:bg-[var(--ide-item-hover)]">
      <LucideIcons.FileCode2 className="h-3.5 w-3.5 shrink-0 text-[var(--ide-text-inactive)]" />
      <button
        type="button"
        title={`Open ${change.path}`}
        onClick={openFile}
        className="min-w-0 flex-1 truncate text-left text-[var(--foreground)] hover:text-[var(--primary)]"
      >
        {change.fileName}
        <span className="ml-1.5 text-[10px] text-[var(--ide-text-inactive)]">{change.path.split("/").slice(0, -1).join("/")}</span>
      </button>
      <span className="hidden shrink-0 text-[9px] text-[var(--ide-text-inactive)] group-hover:inline">+{change.additions} -{change.deletions}</span>
      <span className={`w-3 shrink-0 text-center text-[11px] font-bold ${statusColors[change.status]}`}>{change.status}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        title={change.staged ? "Unstage changes" : "Stage changes"}
        aria-label={change.staged ? `Unstage ${change.fileName}` : `Stage ${change.fileName}`}
        disabled={isBusy}
        onClick={() => {
          onError(null)
          change.staged ? unstageMutation.mutate() : stageMutation.mutate()
        }}
        className="h-5 w-5 text-[var(--ide-text-inactive)] hover:text-[var(--foreground)]"
      >
        {change.staged ? <LucideIcons.Minus className="h-3 w-3" /> : <LucideIcons.Plus className="h-3 w-3" />}
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        title="Discard changes"
        aria-label={`Discard changes in ${change.fileName}`}
        disabled={isBusy}
        onClick={() => {
          onError(null)
          discardMutation.mutate()
        }}
        className="h-5 w-5 text-[var(--ide-text-inactive)] opacity-0 hover:text-destructive group-hover:opacity-100"
      >
        <LucideIcons.RotateCcw className="h-3 w-3" />
      </Button>
    </div>
  )
}

export const SourceControlPanel = () => {
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const setActiveView = useLayoutStore((state) => state.setActiveView)
  const projectId = useProjectStore((state) => state.activeProjectId)
  const commitMessage = useSourceControlStore((state) => state.commitMessage)
  const setCommitMessage = useSourceControlStore((state) => state.setCommitMessage)
  const queryClient = useQueryClient()

  const statusQuery = useQuery({
    queryKey: ["git-status", projectId],
    queryFn: () => gitApi.getStatus(projectId!),
    enabled: Boolean(projectId),
    retry: false,
  })
  const logQuery = useQuery({
    queryKey: ["git-log", projectId],
    queryFn: () => gitApi.getLog(projectId!),
    enabled: Boolean(projectId),
    retry: false,
  })
  const branchesQuery = useQuery({
    queryKey: ["git-branches", projectId],
    queryFn: () => gitApi.listBranches(projectId!),
    enabled: Boolean(projectId),
    retry: false,
  })

  const changes = statusQuery.data?.changes ?? []
  const branch = statusQuery.data?.branch ?? "main"
  const commits = logQuery.data ?? []
  const branches = branchesQuery.data ?? []
  const stagedChanges = changes.filter((change) => change.staged)
  const unstagedChanges = changes.filter((change) => !change.staged)

  const invalidateAllGit = () => {
    queryClient.invalidateQueries({ queryKey: ["git-status", projectId] })
    queryClient.invalidateQueries({ queryKey: ["git-log", projectId] })
    queryClient.invalidateQueries({ queryKey: ["git-branches", projectId] })
  }

  const stageAllMutation = useMutation({
    mutationFn: () => gitApi.stage(projectId!, unstagedChanges.map((change) => change.path)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["git-status", projectId] }),
    onError: (error) => setErrorMessage(errorMessageOf(error, "Failed to stage changes")),
  })

  const commitMutation = useMutation({
    mutationFn: () => gitApi.commit(projectId!, commitMessage.trim()),
    onSuccess: () => {
      setCommitMessage("")
      queryClient.invalidateQueries({ queryKey: ["git-status", projectId] })
      queryClient.invalidateQueries({ queryKey: ["git-log", projectId] })
    },
    onError: (error) => setErrorMessage(errorMessageOf(error, "Failed to commit")),
  })

  const switchBranchMutation = useMutation({
    mutationFn: (name: string) => gitApi.switchBranch(projectId!, name),
    onSuccess: () => {
      invalidateAllGit()
      queryClient.invalidateQueries({ queryKey: ["file-tree", projectId] })
    },
    onError: (error) => setErrorMessage(errorMessageOf(error, "Failed to switch branch")),
  })

  const createBranchMutation = useMutation({
    mutationFn: (name: string) => gitApi.createBranch(projectId!, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["git-branches", projectId] }),
    onError: (error) => setErrorMessage(errorMessageOf(error, "Failed to create branch")),
  })

  const deleteBranchMutation = useMutation({
    mutationFn: (name: string) => gitApi.deleteBranch(projectId!, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["git-branches", projectId] }),
    onError: (error) => setErrorMessage(errorMessageOf(error, "Failed to delete branch")),
  })

  const resetHardMutation = useMutation({
    mutationFn: () => gitApi.resetHard(projectId!),
    onSuccess: () => {
      invalidateAllGit()
      queryClient.invalidateQueries({ queryKey: ["file-tree", projectId] })
    },
    onError: (error) => setErrorMessage(errorMessageOf(error, "Failed to reset")),
  })

  const handleMenuAction = (item: MenuItemData) => {
    setErrorMessage(null)

    if (item.id === "branch-new") {
      const name = window.prompt("New branch name:")?.trim()
      if (name) createBranchMutation.mutate(name)
      return
    }
    if (item.id.startsWith("branch-switch:")) {
      switchBranchMutation.mutate(item.id.slice("branch-switch:".length))
      return
    }
    if (item.id === "source-delete-branch") {
      const deletable = branches.filter((entry) => !entry.current).map((entry) => entry.name)
      if (deletable.length === 0) {
        setErrorMessage("No other branches to delete")
        return
      }
      const name = window.prompt(`Delete which branch?\n${deletable.join(", ")}`)?.trim()
      if (name && deletable.includes(name)) deleteBranchMutation.mutate(name)
      return
    }
    if (item.id === "source-hard-reset") {
      if (window.confirm("Discard ALL uncommitted changes and reset to the last commit?")) resetHardMutation.mutate()
    }
  }

  const branchMenu: MenuItemData[] = [
    { id: "branch-new", text: "New Branch...", iconName: "GitBranchPlus" },
    ...branches.map((entry) => ({
      id: `branch-switch:${entry.name}`,
      text: entry.current ? `${entry.name} (current)` : entry.name,
      iconName: "GitBranch",
    })),
  ]

  const moreMenu: MenuItemData[] = [
    { id: "source-delete-branch", text: "Delete Branch...", iconName: "GitBranchMinus" },
    { id: "source-hard-reset", text: "Discard All Changes (Hard Reset)", iconName: "History", variant: "danger", hasSeparatorBefore: true },
  ]

  if (!projectId) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 bg-[var(--ide-panel-bg)] px-4 text-center text-[var(--foreground)]">
        <LucideIcons.GitBranch className="h-6 w-6 text-[var(--ide-text-inactive)]" />
        <p className="text-xs text-[var(--ide-text-inactive)]">Open a project to use source control</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--ide-panel-bg)] text-[var(--foreground)]">
      <div className="flex shrink-0 items-center justify-between px-3 py-3">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--ide-text-inactive)]">Source Control</h2>
        <div className="flex items-center gap-0.5">
          <IdeBarItem
            tooltip="Refresh changes"
            icon={<LucideIcons.RefreshCw className={statusQuery.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />}
            side="bottom"
            className="h-6 w-6 px-0"
            onClick={() => { setErrorMessage(null); invalidateAllGit() }}
          />
          <IdeMenuItem
            config={moreMenu}
            onAction={handleMenuAction}
            open={moreMenuOpen}
            onOpenChange={setMoreMenuOpen}
            menuButton={
              <IdeBarItem
                tooltip="More source control actions"
                icon={<LucideIcons.MoreHorizontal className="h-3.5 w-3.5" />}
                side="bottom"
                className="h-6 w-6 px-0"
              />
            }
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 pb-4">
          <div className="px-2">
            <IdeMenuItem
              config={branchMenu}
              onAction={handleMenuAction}
              open={branchMenuOpen}
              onOpenChange={setBranchMenuOpen}
              menuButton={
                <IdeBarItem
                  tooltip="Switch branch"
                  text={branch}
                  disabled={switchBranchMutation.isPending}
                  icon={<LucideIcons.GitBranch className="h-3.5 w-3.5 text-[var(--primary)]" />}
                  side="bottom"
                  className="h-8 w-full justify-start rounded-md border border-[var(--border)] bg-[var(--ide-surface-bg)] px-2 text-[11px] hover:bg-[var(--ide-item-hover)]"
                />
              }
            />
          </div>

          {errorMessage && (
            <p className="mx-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-[10px] text-destructive">{errorMessage}</p>
          )}
          {statusQuery.isError && (
            <p className="mx-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-[10px] text-destructive">{errorMessageOf(statusQuery.error, "Failed to load git status")}</p>
          )}

          <div className="flex flex-col gap-2 px-2">
            <Input
              value={commitMessage}
              onChange={(event) => setCommitMessage(event.target.value)}
              placeholder="Message (Ctrl+Enter to commit)"
              aria-label="Commit message"
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) commitMutation.mutate()
              }}
              className="h-8 rounded-md border-[var(--border)] bg-[var(--ide-surface-bg)] text-[11px] placeholder:text-[var(--ide-text-inactive)]"
            />
            <Button
              size="sm"
              disabled={!commitMessage.trim() || stagedChanges.length === 0 || commitMutation.isPending}
              onClick={() => commitMutation.mutate()}
              className="h-7 justify-start gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-40"
            >
              <LucideIcons.Check className="h-3.5 w-3.5" />
              Commit {stagedChanges.length > 0 ? `${stagedChanges.length} staged` : ""}
            </Button>
          </div>

          <section>
            <div className="flex items-center gap-1 border-y border-[var(--border)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ide-text-inactive)]">
              <LucideIcons.ChevronDown className="h-3 w-3" />
              Staged Changes
              <span className="ml-auto">{stagedChanges.length}</span>
            </div>
            {stagedChanges.length > 0 ? stagedChanges.map((change) => <ChangeRow key={change.id} change={change} projectId={projectId} onError={setErrorMessage} />) : <p className="px-3 py-2 text-[10px] text-[var(--ide-text-inactive)]">No staged changes</p>}
          </section>

          <section>
            <div className="flex items-center gap-1 border-y border-[var(--border)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ide-text-inactive)]">
              <LucideIcons.ChevronDown className="h-3 w-3" />
              Changes
              <span className="ml-auto">{unstagedChanges.length}</span>
              {unstagedChanges.length > 0 && <Button variant="ghost" size="icon-xs" title="Stage all changes" aria-label="Stage all changes" disabled={stageAllMutation.isPending} onClick={() => { setErrorMessage(null); stageAllMutation.mutate() }} className="ml-1 h-5 w-5 text-[var(--ide-text-inactive)] hover:text-[var(--primary)]"><LucideIcons.Plus className="h-3 w-3" /></Button>}
            </div>
            {unstagedChanges.length > 0 ? unstagedChanges.map((change) => <ChangeRow key={change.id} change={change} projectId={projectId} onError={setErrorMessage} />) : <p className="px-3 py-2 text-[10px] text-[var(--ide-text-inactive)]">Working tree clean</p>}
          </section>

          <section>
            <div className="flex items-center gap-1 border-y border-[var(--border)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ide-text-inactive)]">
              <LucideIcons.GitCommit className="h-3 w-3" />
              History
            </div>
            <div className="px-3 py-2">
              {commits.map((commit, index) => (
                <div key={commit.id} className="relative flex gap-2 pb-3 last:pb-0">
                  {index < commits.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-[var(--border)]" />}
                  <span className={`z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 ${commit.current ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--ide-text-inactive)] bg-[var(--ide-panel-bg)]"}`} />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-[var(--foreground)]">{commit.message}</p>
                    <p className="text-[10px] text-[var(--ide-text-inactive)]">{commit.author} · {commit.time}</p>
                  </div>
                </div>
              ))}
              {commits.length === 0 && <p className="text-[10px] text-[var(--ide-text-inactive)]">No commits yet</p>}
            </div>
          </section>

          <Button variant="ghost" size="sm" onClick={() => setActiveView("Explorer")} className="mx-2 justify-start gap-2 text-[10px] text-[var(--ide-text-inactive)] hover:text-[var(--foreground)]">
            <LucideIcons.FolderTree className="h-3.5 w-3.5" />
            Back to Explorer
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}