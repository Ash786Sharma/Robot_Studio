import * as LucideIcons from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { IdeBarItem } from "./ideBarItem"
import { IdeMenuItem, type MenuItemData } from "./ideMenuItem"
import { useLayoutStore } from "@/core/store/layoutStore"
import { useSourceControlStore, type SourceChange } from "@/core/store/sourceControlStore"
import { useWorkspaceStore } from "@/core/store/workSpaceStore"

const statusColors = {
  M: "text-amber-400",
  A: "text-emerald-400",
  D: "text-red-400",
  U: "text-sky-400",
}

const ChangeRow = ({ change }: { change: SourceChange }) => {
  const setLeftTab = useWorkspaceStore((state) => state.setLeftTab)
  const setIsSplitView = useWorkspaceStore((state) => state.setIsSplitView)
  const stageChange = useSourceControlStore((state) => state.stageChange)
  const undoChange = useSourceControlStore((state) => state.undoChange)

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
        onClick={() => stageChange(change.id)}
        className="h-5 w-5 text-[var(--ide-text-inactive)] hover:text-[var(--foreground)]"
      >
        {change.staged ? <LucideIcons.Minus className="h-3 w-3" /> : <LucideIcons.Plus className="h-3 w-3" />}
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        title="Discard changes"
        aria-label={`Discard changes in ${change.fileName}`}
        onClick={() => undoChange(change.id)}
        className="h-5 w-5 text-[var(--ide-text-inactive)] opacity-0 hover:text-red-400 group-hover:opacity-100"
      >
        <LucideIcons.RotateCcw className="h-3 w-3" />
      </Button>
    </div>
  )
}

export const SourceControlPanel = () => {
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const setActiveView = useLayoutStore((state) => state.setActiveView)
  const branch = useSourceControlStore((state) => state.branch)
  const commitMessage = useSourceControlStore((state) => state.commitMessage)
  const changes = useSourceControlStore((state) => state.changes)
  const commits = useSourceControlStore((state) => state.commits)
  const setCommitMessage = useSourceControlStore((state) => state.setCommitMessage)
  const setBranch = useSourceControlStore((state) => state.setBranch)
  const stageAll = useSourceControlStore((state) => state.stageAll)
  const commitStaged = useSourceControlStore((state) => state.commitStaged)

  const stagedChanges = changes.filter((change) => change.staged)
  const unstagedChanges = changes.filter((change) => !change.staged)

  const handleMenuAction = (item: MenuItemData) => {
    if (item.id.startsWith("branch-")) {
      setBranch(item.text)
    }
  }

  const branchMenu: MenuItemData[] = [
    { id: "branch-main", text: "main", iconName: "GitBranch" },
    { id: "branch-feature", text: "feature/robot-workflow", iconName: "GitBranch" },
    { id: "branch-develop", text: "develop", iconName: "GitBranch" },
  ]

  const moreMenu: MenuItemData[] = [
    { id: "source-history", text: "View History", iconName: "GitCommit" },
    { id: "source-sync", text: "Sync Changes", iconName: "RefreshCw" },
    { id: "source-fetch", text: "Fetch", iconName: "Download" },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--ide-panel-bg)] text-[var(--foreground)]">
      <div className="flex shrink-0 items-center justify-between px-3 py-3">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--ide-text-inactive)]">Source Control</h2>
        <div className="flex items-center gap-0.5">
          <IdeBarItem
            tooltip="Refresh changes"
            icon={<LucideIcons.RefreshCw className="h-3.5 w-3.5" />}
            side="bottom"
            className="h-6 w-6 px-0"
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
                  icon={<LucideIcons.GitBranch className="h-3.5 w-3.5 text-[var(--primary)]" />}
                  side="bottom"
                  className="h-8 w-full justify-start rounded-md border border-[var(--border)] bg-[var(--ide-surface-bg)] px-2 text-[11px] hover:bg-[var(--ide-item-hover)]"
                />
              }
            />
          </div>

          <div className="flex flex-col gap-2 px-2">
            <Input
              value={commitMessage}
              onChange={(event) => setCommitMessage(event.target.value)}
              placeholder="Message (Ctrl+Enter to commit)"
              aria-label="Commit message"
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) commitStaged()
              }}
              className="h-8 rounded-md border-[var(--border)] bg-[var(--ide-surface-bg)] text-[11px] placeholder:text-[var(--ide-text-inactive)]"
            />
            <Button
              size="sm"
              disabled={!commitMessage.trim() || stagedChanges.length === 0}
              onClick={commitStaged}
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
            {stagedChanges.length > 0 ? stagedChanges.map((change) => <ChangeRow key={change.id} change={change} />) : <p className="px-3 py-2 text-[10px] text-[var(--ide-text-inactive)]">No staged changes</p>}
          </section>

          <section>
            <div className="flex items-center gap-1 border-y border-[var(--border)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ide-text-inactive)]">
              <LucideIcons.ChevronDown className="h-3 w-3" />
              Changes
              <span className="ml-auto">{unstagedChanges.length}</span>
              {unstagedChanges.length > 0 && <Button variant="ghost" size="icon-xs" title="Stage all changes" aria-label="Stage all changes" onClick={stageAll} className="ml-1 h-5 w-5 text-[var(--ide-text-inactive)] hover:text-[var(--primary)]"><LucideIcons.Plus className="h-3 w-3" /></Button>}
            </div>
            {unstagedChanges.length > 0 ? unstagedChanges.map((change) => <ChangeRow key={change.id} change={change} />) : <p className="px-3 py-2 text-[10px] text-[var(--ide-text-inactive)]">Working tree clean</p>}
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