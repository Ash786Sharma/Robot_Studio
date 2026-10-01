import { useQuery, useQueryClient } from "@tanstack/react-query"
import { FolderOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useIdeStore } from "@/core/store/ideStore"
import { useProjectStore } from "@/core/store/projectStore"
import { projectsApi } from "@/core/api/projectsApi"

// Reachable from the nav menu's "Open Workspace" item — the app has no real
// filesystem to browse, so "opening a workspace" means picking one of the
// user's existing projects to switch the active one to.
export const OpenProjectModal = () => {
  const isOpen = useIdeStore((state) => state.isOpenProjectModalOpen)
  const close = useIdeStore((state) => state.closeOpenProjectModal)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId)
  const queryClient = useQueryClient()

  const { data: projects } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: projectsApi.list,
    enabled: isOpen,
  })

  const handleOpen = async (projectId: string) => {
    setActiveProjectId(projectId)
    await queryClient.invalidateQueries({ queryKey: ["file-tree", projectId] })
    await queryClient.invalidateQueries({ queryKey: ["project", projectId] })
    close()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Open Workspace</DialogTitle>
          <DialogDescription>Switch the active project to one of your existing workspaces.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
          {(projects ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-2">No projects yet — create one first.</p>
          )}
          {(projects ?? []).map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => handleOpen(project.id)}
              disabled={project.id === activeProjectId}
              className="flex items-center gap-2 rounded-md border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-3 py-2 text-left text-xs hover:bg-[var(--foreground)]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{project.name}</span>
              {project.id === activeProjectId && <span className="text-[10px] uppercase tracking-wide opacity-70">Open</span>}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
