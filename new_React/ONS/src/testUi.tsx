import React from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import Editor from '@monaco-editor/react'
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from "@xyflow/react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, Stage } from "@react-three/drei"
import "@xyflow/react/dist/style.css" 

import { IdeBarItem } from "./ideBarItem"
import { IdeMenuItem } from "./ideMenuItem"
import editorOptions from "@/assets/editorOptionConfig.json"
import { useWorkspaceStore, type ViewType } from "@/core/store/workSpaceStore"

// 1. FLUSH MONACO EDITOR CONTAINER
const MonacoEditorPlaceholder = () => {
  const initialCode = `// Industrial Robot Arm Control Script
function runRobotCycle() {
  const armSpeed = 120;
  const safetyLoopActive = true;
  
  if (safetyLoopActive) {
    ur5.executeTrajectory({ id: 892, acceleration: 1.5 });
    console.log("Trajectory execution normal at speed: " + armSpeed);
  }
}`
  return (
    <div className="w-full h-full overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={initialCode}
        options={{
          fontSize: 12,
          minimap: { enabled: true },
          automaticLayout: true,
          fontFamily: "var(--font-mono), monospace",
        }}
      />
    </div>
  )
}

// 2. FLUSH REACT FLOW CANVAS PIPELINE
const RealReactFlowCanvas = () => {
  const initialNodes = [
    { id: "plc", type: "input", data: { label: "PLC_Main_Logic" }, position: { x: 50, y: 100 } },
    { id: "safety", data: { label: "Safety_Relay_Monitor" }, position: { x: 250, y: 100 } },
    { id: "ur5", type: "output", data: { label: "UR5_Kinematics" }, position: { x: 450, y: 100 } },
  ]
  const initialEdges = [
    { id: "e1-2", source: "plc", target: "safety", animated: true },
    { id: "e2-3", source: "safety", target: "ur5", animated: true },
  ]
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)
  return (
    <div className="w-full h-full bg-zinc-950/20 relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView>
        <Background color="var(--border)" gap={16} size={1} />
        <Controls className="bg-[var(--ide-panel-bg)] border border-[var(--border)] text-[var(--foreground)] fill-current [&_button]:border-[var(--border)]" />
        <MiniMap className="bg-[var(--ide-panel-bg)] border border-[var(--border)]" maskColor="rgba(0,0,0,0.3)" />
      </ReactFlow>
    </div>
  )
}

// 3. FLUSH THREE.JS 3D ROBOT VIEWPORT SIMULATOR
const RealThreeJsViewer = () => {
  return (
    <div className="w-full h-full bg-black/30 relative overflow-hidden">
      <Canvas camera={{ position:, fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Stage environment="city" intensity={0.5} adjustCamera={false}>
          <group position={[0, 0.25, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1, 0.5, 1]} />
              <meshStandardMaterial color="#0078d4" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.2, 0.8, 32]} />
              <meshStandardMaterial color="#cccccc" metalness={0.9} />
            </mesh>
          </group>
        </Stage>
        <Grid 
          renderOrder={-1} 
          position={[0, -0.01, 0]} 
          args={[10, 10]} 
          cellSize={0.5} 
          cellThickness={0.5} 
          cellColor="#444444" 
          sectionSize={2} 
          sectionThickness={1} 
          sectionColor="#0078d4" 
          fadeDistance={20}
          infiniteGrid
        />
        <OrbitControls 
          makeDefault 
          maxPolarAngle={Math.PI} 
          minDistance={2} 
          maxDistance={15} 
        />
      </Canvas>
    </div>
  )
}

interface TabConfig {
  id: ViewType;
  label: string;
  icon: keyof typeof LucideIcons;
}

export const WorkspaceCanvas = () => {
  // Bind components directly to Zustand reactive selectors
  const leftTab = useWorkspaceStore((state) => state.leftTab)
  const rightTab = useWorkspaceStore((state) => state.rightTab)
  const isSplitView = useWorkspaceStore((state) => state.isSplitView)
  const hiddenTabs = useWorkspaceStore((state) => state.hiddenTabs)
  
  const setLeftTab = useWorkspaceStore((state) => state.setLeftTab)
  const setRightTab = useWorkspaceStore((state) => state.setRightTab)
  const setIsSplitView = useWorkspaceStore((state) => state.setIsSplitView)
  const closeTab = useWorkspaceStore((state) => state.closeTab)
  const restoreWorkspace = useWorkspaceStore((state) => state.restoreWorkspace)

  const tabList: TabConfig[] = [
    { id: "editor", label: "Logic Script (Monaco)", icon: "Code2" },
    { id: "flow", label: "System Graph (React Flow)", icon: "Network" },
    { id: "viewer", label: "3D Digital Twin (Three.js)", icon: "Box" },
  ]

  const visibleTabs = tabList.filter(tab => !hiddenTabs.includes(tab.id))

  const resolveContentNode = (view: ViewType) => {
    switch (view) {
      case "editor": return <MonacoEditorPlaceholder />
      case "flow": return <RealReactFlowCanvas />
      case "viewer": return <RealThreeJsViewer />
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
          <LucideIcons.LayoutDashboard className="h-8 w-8 opacity-25 animate-pulse" />
          <p className="text-xs tracking-wide">All environment layout views closed.</p>
          <button 
            onClick={restoreWorkspace}
            className="px-3 py-1.5 text-[11px] font-semibold bg-[var(--primary)] text-white rounded hover:opacity-90 transition-all shadow-sm"
          >
            Restore Workspace
          </button>
        </div>
      )
    }

    return (
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => onTabChange(val as ViewType)} 
        className="w-full h-full flex flex-col gap-0.5 bg-[var(--ide-surface-bg)]"
      >
        <div className="w-full h-9 bg-[var(--ide-panel-bg)] border-b border-[var(--border)] flex items-center justify-between px-2 shrink-0 select-none">
          <TabsList variant="line" className="h-full bg-transparent p-0 gap-1 border-b-0">
            {visibleTabs.map((tab) => {
              const TabIcon = (LucideIcons[tab.icon] || LucideIcons.File) as React.ComponentType<{ className?: string }>
              const isSelected = activeTab === tab.id
              
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "group h-full px-3 text-[11px] font-medium tracking-wide gap-2 transition-all duration-150 shadow-none outline-none border-b-2 rounded-none relative",
                    isSelected 
                      ? "text-[var(--foreground)] border-b-[var(--primary)] font-semibold bg-transparent" 
                      : "text-[var(--ide-text-inactive)] border-b-transparent hover:text-[var(--foreground)] bg-transparent"
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5 shrink-0 text-current" />
                  <span>{tab.label}</span>
                  
                  {/* Integrated dynamic custom interaction button logic */}
                  <IdeBarItem
                    tooltip={"Close Tab"}
                    icon={<LucideIcons.X className="h-3 w-3 text-ide-inactive transition-colors group-hover:text-foreground" />}
                    side="bottom"
                    className="px-1 rounded opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                    onClick={(e) => {
                      e.stopPropagation() // Block standard parent trigger event pipeline shifts
                      closeTab(tab.id, pane)
                    }}
                  />
                </TabsTrigger>
              )
            })}
          </TabsList>

          <div className="flex items-center gap-1.5 text-[var(--ide-text-inactive)]">
            <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-[var(--ide-item-hover)] text-zinc-400 border border-[var(--border)]">
              {contextBadge}
            </span>
            <IdeBarItem
              tooltip={isSplitView ? "Collapse split-screen layout" : "Split editor workspace canvas view"}
              icon={<LucideIcons.Columns2 className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
              side="bottom"
              onClick={() => setIsSplitView(!isSplitView)}
              className="px-1"
            />
            <IdeMenuItem 
              config={editorOptions} 
              menuButton={
                <IdeBarItem
                  tooltip={isSplitView ? "Collapse split-screen layout" : "Split editor workspace canvas view"}
                  icon={<LucideIcons.Ellipsis className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
                  side="bottom"
                  className="px-1"
                />
              } 
            />
          </div>
        </div>
        <div className="flex-1 w-full min-h-0 p-0 overflow-hidden bg-[var(--ide-surface-bg)]">
          {resolveContentNode(activeTab)}        </div>
      </Tabs>
    )
  }
  return (
    <div className="w-full h-full bg-[var(--ide-surface-bg)] overflow-hidden">
      {isSplitView ? (
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
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
