import React, { useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area" // ⚡ INTEGRATED: Standardised unstyled Base UI scroll wrapper
import { FileTreeItem, type TreeNode } from "@/features/ideUi/fileTreeItem"
import mockTreeData from "@/assets/mockTreeData.json"
import { cn } from "@/lib/utils"
import { WorkspaceCanvas } from "./workspaceCanvas";
import { useLayoutStore } from "@/core/store/layoutStore";

export const IdeWorkspace = () => {
  // Shared state controller to handle active selections across your IDE workbench canvas
  const [activeNodeId, setActiveNodeId] = useState<string | undefined>(undefined)
  const activeView = useLayoutStore((state) => state.activeView);
  const isExplorerOpen = useLayoutStore((state) => state.isExplorerOpen);
  const isTerminalOpen = useLayoutStore((state) => state.isTerminalOpen);

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
            <div className="px-3 py-3 text-[10px] font-bold tracking-widest text-[var(--ide-text-inactive)] uppercase select-none shrink-0">
              Workspace Explorer
            </div>
            {/* ⚡ THE SINGLE HIGH-FIDELITY SCROLL ENGINE */}
            <ScrollArea 
              className={cn(
                "w-full flex-1 min-h-0 transition-all duration-150",
                // 🎬 VISIBILITY HOVER FILTER: Scroll track drops away fully until active mouse movement
                "[&_[data-slot=scroll-area-scrollbar]]:opacity-0 hover:[&_[data-slot=scroll-area-scrollbar]]:opacity-100",
                // 📏 COMPACT SIDEBAR SCROLL SIZE: Restricts vertical scroll tracks cleanly to a thin 4px width
                "[&_[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:!w-3 p-0 ",
                // 🎨 THEME SYNC LOOKUPS: Forces inner elements to follow .theme-vsc-dark design tokens
                "[&_[data-slot=scroll-area-thumb]]:!bg-[var(--ide-item-hover)]",
                "[&_[data-slot=scroll-area-thumb]]:opacity-60 hover:[&_[data-slot=scroll-area-thumb]]:opacity-100"
              )}
            >
              <div className="pl-1.5 pr-3 pb-4 flex flex-col w-full gap-0.5">
                {(mockTreeData as TreeNode[]).map((rootNode) => (
                  <FileTreeItem 
                    key={rootNode.id} 
                    node={rootNode} 
                    activeNodeId={activeNodeId}
                    onNodeSelect={(node) => setActiveNodeId(node.id)}
                  />
                ))}
              </div>
            </ScrollArea>
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
