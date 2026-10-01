import { useMemo, useState, useEffect } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area" // ⚡ INTEGRATED: Standardised unstyled Base UI scroll wrapper
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { FolderX } from "lucide-react"
import { FileTreeItem, type DraftNode } from "@/features/ide-shell/file-tree/FileTreeItem"
import { mapFileNodeToTreeNode } from "@/features/ide-shell/file-tree/fileNodeMapper"
import { filesApi } from "@/core/api/filesApi"
import { projectsApi } from "@/core/api/projectsApi"
import { ApiError } from "@/core/api/httpClient"
import { cn } from "@/lib/utils"
import { WorkspaceCanvas } from "./WorkspaceCanvas";
import { SourceControlPanel } from "./SourceControlPanel";
import { useLayoutStore } from "@/core/store/layoutStore";
import { useWorkspaceStore, type WorkspaceFile } from "@/core/store/workspaceStore";
import { useProjectStore } from "@/core/store/projectStore";
import { useIdeStore } from "@/core/store/ideStore";
import { useFileSyncSocket } from "@/core/socket/useFileSyncSocket";
import { TerminalView } from "@/features/console/components/TerminalView";
import type { MenuItemData } from "@/features/ide-shell/components/IdeMenuItem";
import type { TreeNode } from "@/features/ide-shell/file-tree/fileTree.types";
import { useRobotSimulationStore } from "@/core/store/robotSimulationStore";

const KINEMATIC_LINK_TYPES = new Set(["kinematic link", "kinematic root link", "kinematic tcp link"]);

export const IdeWorkspace = () => {
  // Shared state controller to handle active selections across your IDE workbench canvas
  const [activeNodeId, setActiveNodeId] = useState<string | undefined>(undefined)
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null)
  const [draftNode, setDraftNode] = useState<DraftNode | null>(null)
  const activeView = useLayoutStore((state) => state.activeView);
  const isExplorerOpen = useLayoutStore((state) => state.isExplorerOpen);
  const isTerminalOpen = useLayoutStore((state) => state.isTerminalOpen);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const setSelectedKinematicNode = useRobotSimulationStore((state) => state.setSelectedKinematicNode);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId);
  const closeActiveProject = useProjectStore((state) => state.closeActiveProject);
  const openAddDeviceModal = useIdeStore((state) => state.openAddDeviceModal);
  const createNewProject = useIdeStore((state) => state.createNewProject);
  const openCreateRobotModal = useIdeStore((state) => state.openCreateRobotModal);
  const queryClient = useQueryClient();

  const { data: allProjects } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: projectsApi.list,
    enabled: !activeProjectId,
  });

  useFileSyncSocket(activeProjectId);

  const { data: fileTree } = useQuery({
    queryKey: ["file-tree", activeProjectId],
    queryFn: () => filesApi.getTree(activeProjectId!),
    enabled: Boolean(activeProjectId),
    retry: false,
  });

  const { data: activeProject, error: activeProjectError } = useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => projectsApi.get(activeProjectId!),
    enabled: Boolean(activeProjectId),
    retry: false,
  });

  // Project was deleted (e.g. directly in the DB, or from another tab) —
  // fall back to the "no project open" placeholder instead of showing a
  // stale/broken tree forever.
  useEffect(() => {
    if (activeProjectError instanceof ApiError && activeProjectError.status === 404) {
      closeActiveProject();
    }
  }, [activeProjectError, closeActiveProject]);

  const treeNodes = useMemo(() => {
    if (!activeProjectId) return [];

    return [{
      id: activeProjectId,
      name: activeProject?.name ?? "Project Workspace",
      type: "Project workspace",
      icon: "FolderOpen",
      kind: "folder",
      children: (fileTree ?? []).map(mapFileNodeToTreeNode),
    } satisfies TreeNode];
  }, [activeProjectId, activeProject, fileTree]);

  const refreshFileTree = async () => {
    await queryClient.invalidateQueries({ queryKey: ["file-tree", activeProjectId] });
  };

  const parentIdFor = (nodeId: string) => (nodeId === activeProjectId ? undefined : nodeId);

  const handleFileTreeAction = async (item: MenuItemData, node: TreeNode) => {
    if (!activeProjectId) return;

    if (item.id === "add-device") {
      openAddDeviceModal();
      return;
    }

    if (item.id === "close-project") {
      closeActiveProject();
      return;
    }

    if (["new-folder", "add-config"].includes(item.id)) {
      const placeholder = item.id === "add-config" ? "New Configuration" : "New Folder";
      // Propagate the parent's special folder type so a subfolder created inside
      // Programs/Safety Programs or Screens keeps the same menu as its parent, at any depth.
      const propagatedTypes = ["program folder", "Screen folder"];
      const fileType = item.id === "new-folder" && propagatedTypes.includes(node.fileType ?? "") ? node.fileType ?? undefined : undefined;
      setDraftNode({ parentId: node.id, kind: "folder", fileType, icon: "FolderPlus", placeholder });
      return;
    }

    if (item.id === "new-file") {
      // "__generic__" is a sentinel the commit handler infers a real fileType from,
      // distinct from the actual "scl" PLC block type below.
      setDraftNode({ parentId: node.id, kind: "file", fileType: "__generic__", icon: "FilePlus", placeholder: "New.scl" });
      return;
    }

    const fileTypeByAction: Record<string, string> = {
      "new-rprg": "rprg",
      "new-rgprg": "rgprg",
      "new-rsprg": "rsprg",
      "new-rsgprg": "rsgprg",
      "add-screen": "hmi ui",
      "new-plc-ob": "ld",
      "new-plc-fc": "graph",
      "new-plc-fb": "scl",
      "new-plc-db": "db",
    };

    if (fileTypeByAction[item.id]) {
      const fileType = fileTypeByAction[item.id];
      const placeholderByFileType: Record<string, string> = {
        "hmi ui": "New Screen",
        ld: "New OB Block",
        graph: "New FC Block",
        scl: "New FB Block",
        db: "New DB Block",
      };
      const placeholder = placeholderByFileType[fileType] ?? `New.${fileType}`;
      setDraftNode({ parentId: node.id, kind: "file", fileType, icon: "FilePlus", placeholder });
      return;
    }

    if (["rename-item", "rename-device"].includes(item.id)) {
      setRenamingNodeId(node.id);
      return;
    }

    if (item.id === "delete-project") {
      // Deferred: window.confirm() is a blocking native dialog — firing it
      // synchronously inside the menu item's click handler races the
      // dropdown's own close/unmount, which can crash the whole React tree.
      setTimeout(async () => {
        if (!window.confirm(`Delete project "${node.name}" and all its files?`)) return;
        await projectsApi.remove(activeProjectId);
        closeActiveProject();
        await queryClient.invalidateQueries({ queryKey: ["projects", "all"] });
      }, 0);
      return;
    }

    if (["delete-item", "remove-device"].includes(item.id)) {
      setTimeout(async () => {
        if (!window.confirm(`Delete "${node.name}"?`)) return;
        await filesApi.remove(activeProjectId, node.id);
        await refreshFileTree();
      }, 0);
    }
  };

  const FIXED_EXTENSION_TYPES = new Set(["rprg", "rgprg", "rsprg", "rsgprg"]);

  const handleDraftCommit = async (name: string) => {
    const pending = draftNode;
    setDraftNode(null);
    const trimmed = name.trim();
    if (!activeProjectId || !pending || !trimmed) return;

    let finalName = trimmed;
    let fileType = pending.fileType;

    if (pending.kind === "file") {
      if (pending.fileType && FIXED_EXTENSION_TYPES.has(pending.fileType) && !trimmed.includes(".")) {
        // Fixed-extension actions (new-rprg, ...) only ask for the base name.
        finalName = `${trimmed}.${pending.fileType}`;
      } else if (pending.fileType === "__generic__") {
        // Generic "new-file" action: infer the type from whatever the user typed.
        fileType = trimmed.includes(".") ? trimmed.split(".").pop()!.toLowerCase() : "scl";
      }
    }

    await filesApi.create(activeProjectId, {
      name: finalName,
      kind: pending.kind,
      fileType,
      parentId: parentIdFor(pending.parentId),
    });
    await refreshFileTree();
  };

  const handleRenameCommit = async (node: TreeNode, name: string) => {
    setRenamingNodeId(null);
    const trimmed = name.trim();
    if (!activeProjectId || !trimmed || trimmed === node.name) return;
    await filesApi.rename(activeProjectId, node.id, trimmed);
    await refreshFileTree();
  };

  const isBottomPanelOpen = isTerminalOpen || activeView === "Problems";

  if (!activeProjectId) {
    return (
      <main className="flex-1 h-full min-w-0 bg-[var(--background)] text-[var(--foreground)] select-none">
        <div className="h-full w-full overflow-hidden p-0.5 bg-[var(--ide-panel-bg)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--ide-surface-bg)] px-10 py-12 text-center max-w-sm">
            <FolderX className="h-8 w-8 text-[var(--ide-text-inactive)]" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">No project open</p>
              <p className="text-xs text-[var(--ide-text-inactive)]">Create a new project or open an existing one to get started.</p>
            </div>
            <button
              onClick={createNewProject}
              className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              New Project
            </button>
            <button
              onClick={openCreateRobotModal}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--ide-item-hover)] transition-colors"
            >
              Create Robot Library
            </button>
            {allProjects && allProjects.length > 0 && (
              <div className="flex flex-col gap-1 w-full mt-2">
                <span className="text-[10px] uppercase tracking-widest text-[var(--ide-text-inactive)]">Open existing</span>
                {allProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setActiveProjectId(project.id)}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-left hover:bg-[var(--ide-item-hover)] transition-colors truncate"
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-full min-w-0 bg-[var(--background)] text-[var(--foreground)] select-none">
      <div className="h-full w-full overflow-hidden p-0.5 bg-[var(--ide-panel-bg)]">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full w-full border-none"
        >
          {/* Panel One: Sidebar File Explorer Workspace */}
          {isExplorerOpen && <>
          <ResizablePanel 
            defaultSize={15} 
            className="rounded-sm border border-[var(--border)] bg-[var(--ide-panel-bg)] transition-colors duration-150 flex flex-col"
          >
            {activeView === "Source Control" ? <SourceControlPanel /> : <>
              <div className="px-3 py-3 text-[10px] font-bold tracking-widest text-[var(--ide-text-inactive)] uppercase select-none shrink-0">
                Workspace Explorer
              </div>
              <ScrollArea 
                className={cn(
                  "w-full flex-1 min-h-0 transition-all duration-150",
                  "[&_[data-slot=scroll-area-scrollbar]]:opacity-0 hover:[&_[data-slot=scroll-area-scrollbar]]:opacity-100",
                  "[&_[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:!w-3 p-0 ",
                  "[&_[data-slot=scroll-area-thumb]]:!bg-[var(--ide-item-hover)]",
                  "[&_[data-slot=scroll-area-thumb]]:opacity-60 hover:[&_[data-slot=scroll-area-thumb]]:opacity-100"
                )}
              >
                <div className="pl-1.5 pr-3 pb-4 flex flex-col w-full gap-0.5">
                  {treeNodes.map((rootNode) => (
                    <FileTreeItem 
                      key={rootNode.id} 
                      node={rootNode} 
                      activeNodeId={activeNodeId}
                      onNodeSelect={(node) => {
                        setActiveNodeId(node.id)
                        if (KINEMATIC_LINK_TYPES.has(node.type)) setSelectedKinematicNode({ kind: "link", name: node.name })
                        else if (node.type === "kinematic joint") setSelectedKinematicNode({ kind: "joint", name: node.name })
                        else setSelectedKinematicNode(null)
                      }}
                      onFileOpen={(file: WorkspaceFile) => openFile(file)}
                      onAction={handleFileTreeAction}
                      renamingNodeId={renamingNodeId}
                      onRenameCommit={handleRenameCommit}
                      onRenameCancel={() => setRenamingNodeId(null)}
                      draftNode={draftNode}
                      onDraftCommit={handleDraftCommit}
                      onDraftCancel={() => setDraftNode(null)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>}
          </ResizablePanel>

          <ResizableHandle 
            withHandle 
            className="bg-transparent border-none w-1.5"
            dotsClassName="bg-[var(--ide-text-inactive)]/40 group-hover:bg-[var(--primary)]"
          />
          </>}
          {/* Core Code Split Stack Workspace */}
          <ResizablePanel defaultSize={80}>
            <ResizablePanelGroup orientation="vertical" className="border-none">
              
              {/* Panel Two: Primary Code Workspace Surface Canvas */}
              <ResizablePanel 
                defaultSize={70} 
                className="rounded-sm border border-[var(--border)] bg-[var(--ide-surface-bg)] transition-colors duration-150"
              >
                <WorkspaceCanvas/>
              </ResizablePanel>
              {isBottomPanelOpen && <>
              <ResizableHandle 
                withHandle 
                className="bg-transparent border-none h-1.5"
                dotsClassName="bg-[var(--ide-text-inactive)]/40 group-hover:bg-[var(--primary)]"
              />

              {/* Panel Three: Diagnostic Console/Terminal Window Pane */}
              <ResizablePanel 
                defaultSize={30} 
                className="rounded-sm border border-[var(--border)] bg-[var(--ide-panel-bg)] transition-colors duration-150 overflow-hidden"
              >
                {activeView === "Problems" ? (
                  /* Render Problems view if Nav items activated it */
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-[var(--ide-text-inactive)]">
                    <span className="font-semibold text-xs tracking-wide uppercase">Problems / Errors</span>
                    <span className="text-[11px] text-[var(--ide-text-inactive)]/70">No problems have been detected in the workspace.</span>
                  </div>
                ) : (
                  <TerminalView />
                )}
              </ResizablePanel>
              </>}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  )
}
