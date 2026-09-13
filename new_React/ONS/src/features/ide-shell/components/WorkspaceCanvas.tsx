import React from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import "@xyflow/react/dist/style.css" 

import { IdeBarItem } from "./IdeBarItem"
import { IdeMenuItem, type MenuGroupData, type MenuItemData } from "./IdeMenuItem"
import editorOptions from "@/config/editorOptionConfig.json"
import { useWorkspaceStore, type ViewType } from "@/core/store/workspaceStore"
import { MonacoEditorPlaceholder } from "@/features/editor/components/MonacoEditor"
import { RealReactFlowCanvas } from "@/features/editor/components/GraphEditor"
import { RealThreeJsViewer } from "@/features/simulation/components/Viewer3D"
import { DataBlockEditor } from "@/features/editor/components/DataBlockEditor"
import { HmiEditor } from "@/features/editor/components/HmiEditor"

interface TabConfig {
  id: string;
  label: string;
  icon: keyof typeof LucideIcons;
  view: ViewType;
  fileId?: string;
}

export const WorkspaceCanvas = () => {
  // Bind components directly to Zustand reactive selectors
  const leftTab = useWorkspaceStore((state) => state.leftTab)
  const rightTab = useWorkspaceStore((state) => state.rightTab)
  const isSplitView = useWorkspaceStore((state) => state.isSplitView)
  const hiddenTabs = useWorkspaceStore((state) => state.hiddenTabs)
  const tabStatuses = useWorkspaceStore((state) => state.tabStatuses)
  const showChanges = useWorkspaceStore((state) => state.showChanges)
  const activeFile = useWorkspaceStore((state) => state.activeFile)
  const openFiles = useWorkspaceStore((state) => state.openFiles)
  const activeFileByPane = useWorkspaceStore((state) => state.activeFileByPane)
  
  const setLeftTab = useWorkspaceStore((state) => state.setLeftTab)
  const setRightTab = useWorkspaceStore((state) => state.setRightTab)
  const setIsSplitView = useWorkspaceStore((state) => state.setIsSplitView)
  const setShowChanges = useWorkspaceStore((state) => state.setShowChanges)
  const closeTab = useWorkspaceStore((state) => state.closeTab)
  const activateFile = useWorkspaceStore((state) => state.activateFile)
  const closeFile = useWorkspaceStore((state) => state.closeFile)
  const closeAllFiles = useWorkspaceStore((state) => state.closeAllFiles)
  const fileTabs: TabConfig[] = openFiles.map((file) => ({
    id: file.id,
    fileId: file.id,
    label: file.name,
    icon: file.icon as keyof typeof LucideIcons,
    view: file.type === "db" || ["rprg", "rsprg", "scl"].some((extension) => file.name.toLowerCase().endsWith(`.${extension}`)) || file.type === "hmi ui" ? "editor" : "flow",
  }))
  const viewerIsOpen = (leftTab === "viewer" || rightTab === "viewer") && !hiddenTabs.includes("viewer")
  const visibleTabs = viewerIsOpen
    ? [...fileTabs, { id: "viewer", label: "3D Digital Twin (Three.js)", icon: "Box" as keyof typeof LucideIcons, view: "viewer" as ViewType }]
    : fileTabs

  const resolveContentNode = (view: ViewType, pane: "left" | "right", file = activeFile) => {
    let editorContent: React.ReactNode
    switch (view) {
      case "editor":
        if (file?.type === "db") editorContent = <DataBlockEditor fileName={file.name} showChanges={showChanges[pane]} onShowChangesChange={(show) => setShowChanges(pane, show)} />
        else if (file?.type === "hmi ui") editorContent = <HmiEditor fileName={file.name} />
        else editorContent = <MonacoEditorPlaceholder showChanges={showChanges[pane]} safetyProgram={file?.safety ?? false} fileName={file?.name} fileId={file?.id} statusId={file?.id ?? "editor"} />
        break
      case "flow":
        editorContent = <RealReactFlowCanvas showChanges={showChanges[pane]} onCloseChanges={() => setShowChanges(pane, false)} device={file?.device} safetyProgram={file?.safety ?? false} fileName={file?.name} />
        break
      case "viewer":
        editorContent = null
        break
    }

    return (
      <div className="relative h-full w-full">
        <div className={view === "viewer" ? "hidden" : "h-full w-full"}>{editorContent}</div>
        <div className={view === "viewer" ? "h-full w-full" : "pointer-events-none invisible absolute inset-0 h-full w-full"} aria-hidden={view !== "viewer"}>
          <RealThreeJsViewer />
        </div>
      </div>
    )
  }

  const handleEditorOption = (item: MenuItemData, pane: "left" | "right", tabId: string) => {
    if (item.id === "show-changes") {
      setShowChanges(pane, true)
    } else if (item.id === "save-file") {
      const currentStatus = tabStatuses[tabId]
      if (currentStatus) {
        useWorkspaceStore.getState().setTabStatus(tabId, { ...currentStatus, saveStatus: "saved" })
      }
    } else if (item.id === "close-saved") {
      const fileId = activeFileByPane[pane]
      if (fileId && tabStatuses[fileId]?.saveStatus !== "unsaved") {
        closeFile(fileId, pane)
      }
    } else if (item.id === "close-all") {
      closeAllFiles()
    }
  }

  const renderTabWindowPane = (
    activeTab: ViewType, 
    onTabChange: (v: ViewType) => void, 
    pane: "left" | "right", 
    contextBadge: string
  ) => {
    // Elegant fallback view when everything gets closed down inside the viewport panel
    if (visibleTabs.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--ide-text-inactive)] gap-3 bg-[var(--ide-panel-bg)] select-none">
          <h1 className="text-9xl font-bold opacity-20 ">ONS</h1>
          <p className="text-xl tracking-wide opacity-18">Workspace</p>
          
        </div>
      )
    }

    const activeFileId = activeFileByPane[pane]
    const paneFile = openFiles.find((file) => file.id === activeFileId) ?? (pane === "left" ? activeFile : null)
    const activeTabId = activeFileId ?? activeTab
    const activeTabConfig = visibleTabs.find((tab) => tab.id === activeTabId)
    const activeView = activeTabConfig?.view ?? activeTab

    return (
      <Tabs 
        value={activeTabId} 
        onValueChange={(val) => {
          const selectedTab = visibleTabs.find((tab) => tab.id === val)
          if (selectedTab?.fileId) activateFile(selectedTab.fileId, pane)
          else onTabChange((selectedTab?.view ?? val) as ViewType)
        }} 
        className="w-full h-full flex flex-col gap-0.5 bg-[var(--ide-surface-bg)]"
      >
        <div className="w-full h-9 min-w-0 bg-[var(--ide-panel-bg)] border-b border-[var(--border)] flex items-center justify-between px-2 shrink-0 select-none">
          <TabsList variant="line" className="h-full min-w-0 flex-1 justify-start overflow-x-auto bg-transparent p-0 gap-1 border-b-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleTabs.map((tab) => {
              const TabIcon = (LucideIcons[tab.icon] || LucideIcons.File) as React.ComponentType<{ className?: string }>
              const isSelected = activeTabId === tab.id
              
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "group h-full flex-none px-3 text-[11px] font-medium tracking-wide gap-2 transition-all duration-150 shadow-none outline-none border-b-2 rounded-none relative",
                    isSelected 
                      ? "text-[var(--foreground)] border-b-[var(--primary)] font-semibold bg-transparent" 
                      : "text-[var(--ide-text-inactive)] border-b-transparent hover:text-[var(--foreground)] bg-transparent"
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5 shrink-0 text-current" />
                  <span>{tab.label}</span>
                  {tabStatuses[tab.id] && tab.id !== "viewer" && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold" title={`${tabStatuses[tab.id]?.saveStatus === "unsaved" ? "Unsaved" : "Saved"}${tabStatuses[tab.id]?.gitStatus ? `, Git ${tabStatuses[tab.id]?.gitStatus}` : ""}`}>
                      <span className={tabStatuses[tab.id]?.saveStatus === "unsaved" ? "text-amber-400" : "text-emerald-400"}>
                        {tabStatuses[tab.id]?.saveStatus === "unsaved" ? "●" : "✓"}
                      </span>
                      {tabStatuses[tab.id]?.gitStatus && <span className="text-sky-400">{tabStatuses[tab.id]?.gitStatus}</span>}
                    </span>
                  )}
                  
                  {/* Integrated dynamic custom interaction button logic */}
                  <IdeBarItem
                    tooltip="Close Tab"
                    side="bottom"
                    render={
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Close Tab"
                        className="flex h-5 w-5 items-center justify-center rounded opacity-60 transition-opacity hover:bg-ide-hover hover:opacity-100"
                        onClick={(event) => {
                          event.stopPropagation()
                          tab.fileId ? closeFile(tab.fileId, pane) : closeTab(tab.view, pane)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            event.stopPropagation()
                            tab.fileId ? closeFile(tab.fileId, pane) : closeTab(tab.view, pane)
                          }
                        }}
                      >
                        <LucideIcons.X className="h-3 w-3 text-ide-inactive group-hover:text-foreground" />
                      </span>
                    }
                  />
                </TabsTrigger>
              )
            })}
          </TabsList>

          {pane === (isSplitView ? "right" : "left") && (
            <div className="flex shrink-0 items-center gap-1.5 pl-2 text-[var(--ide-text-inactive)]">
              {activeView !== "viewer" && (
                <>
                  <IdeBarItem
                    tooltip="Show Changes"
                    icon={<LucideIcons.GitCompare className="h-4 w-4" />}
                    side="bottom"
                    onClick={() => setShowChanges(pane, !showChanges[pane])}
                    isActive={showChanges[pane]}
                    className="px-1"
                  />
                  <IdeMenuItem
                    config={editorOptions as MenuGroupData[]}
                    onAction={(item) => handleEditorOption(item, pane, activeFileId ?? activeView)}
                    menuButton={
                      <IdeBarItem
                        tooltip="Editor options"
                        icon={<LucideIcons.MoreHorizontal className="h-4 w-4" />}
                        side="bottom"
                        className="px-1"
                      />
                    }
                  />
                </>
              )}
              <IdeBarItem
                tooltip={isSplitView ? "Collapse split-screen layout" : "Split editor workspace canvas view"}
                icon={<LucideIcons.Columns2 className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
                side="bottom"
                onClick={() => setIsSplitView(!isSplitView)}
                className="px-1"
              />
            </div>
          )}
        </div>
        {activeView !== "viewer" && (
          <Breadcrumb className="flex h-5 shrink-0 items-center px-3">
            <BreadcrumbList className="gap-1 text-[10px]">
              {(paneFile?.path ?? ["Workspace", contextBadge, activeTabConfig?.label ?? activeView]).map((segment, index, segments) => (
                <React.Fragment key={`${segment}-${index}`}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === segments.length - 1 ? <BreadcrumbPage>{segment}</BreadcrumbPage> : segment}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <div className="flex-1 w-full min-h-0 p-0 overflow-hidden bg-[var(--ide-surface-bg)]">
          {resolveContentNode(activeView, pane, paneFile)}        </div>
      </Tabs>
    )
  }
  return (
    <div className="w-full h-full bg-[var(--ide-surface-bg)] overflow-hidden">
      {isSplitView ? (
        <ResizablePanelGroup orientation="horizontal" className="w-full h-full">
          <ResizablePanel defaultSize={50} minSize={20}>
            {renderTabWindowPane(leftTab, setLeftTab, "left", "Primary")}
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-[var(--border)]" />
          <ResizablePanel defaultSize={50} minSize={20}>
            {renderTabWindowPane(rightTab, setRightTab, "right", "Secondary")}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        renderTabWindowPane(leftTab, setLeftTab, "left", "Primary")
      )}
    </div>
  )
}
