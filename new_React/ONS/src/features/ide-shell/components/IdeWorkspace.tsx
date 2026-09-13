import { useMemo, useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area" // ⚡ INTEGRATED: Standardised unstyled Base UI scroll wrapper
import { useQuery } from "@tanstack/react-query"
import { FileTreeItem } from "@/features/ide-shell/file-tree/FileTreeItem"
import { mapFileNodeToTreeNode } from "@/features/ide-shell/file-tree/fileNodeMapper"
import { filesApi } from "@/core/api/filesApi"
import { cn } from "@/lib/utils"
import { WorkspaceCanvas } from "./WorkspaceCanvas";
import { SourceControlPanel } from "./SourceControlPanel";
import { useLayoutStore } from "@/core/store/layoutStore";
import { useWorkspaceStore, type WorkspaceFile } from "@/core/store/workspaceStore";
import { useProjectStore } from "@/core/store/projectStore";
import { useFileSyncSocket } from "@/core/socket/useFileSyncSocket";

export const IdeWorkspace = () => {
  // Shared state controller to handle active selections across your IDE workbench canvas
  const [activeNodeId, setActiveNodeId] = useState<string | undefined>(undefined)
  const activeView = useLayoutStore((state) => state.activeView);
  const isExplorerOpen = useLayoutStore((state) => state.isExplorerOpen);
  const isTerminalOpen = useLayoutStore((state) => state.isTerminalOpen);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);

  useFileSyncSocket(activeProjectId);

  const { data: fileTree } = useQuery({
    queryKey: ["file-tree", activeProjectId],
    queryFn: () => filesApi.getTree(activeProjectId!),
    enabled: Boolean(activeProjectId),
  });

  const treeNodes = useMemo(() => (fileTree ?? []).map(mapFileNodeToTreeNode), [fileTree]);

  const isBottomPanelOpen = isTerminalOpen || activeView === "Problems";

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
                      onNodeSelect={(node) => setActiveNodeId(node.id)}
                      onFileOpen={(file: WorkspaceFile) => openFile(file)}
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
                className="rounded-sm border border-[var(--border)] bg-[var(--ide-panel-bg)] transition-colors duration-150"
              >
                <div className="flex h-full items-center justify-center p-6 text-[var(--ide-text-inactive)]">
                  {activeView === "Problems" ? (
                    /* Render Problems view if Nav items activated it */
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-semibold text-xs tracking-wide uppercase">Problems / Errors</span>
                      <span className="text-[11px] text-[var(--ide-text-inactive)]/70">No problems have been detected in the workspace.</span>
                    </div>
                  ) : (
                    /* Default Fallback: Standard Terminal Panel */
                    <span className="font-semibold text-xs tracking-wide">TERMINAL / CONSOLE</span>
                  )}
                </div>
              </ResizablePanel>
              </>}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  )
}
