"use client"

import React, { useState } from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs" 
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from "@xyflow/react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, Stage } from "@react-three/drei"

import "@xyflow/react/dist/style.css" 
import { IdeBarItem } from "./ideBarItem";
import { IdeMenuItem } from "./ideMenuItem";
import editorOptions from "@/assets/editorOptionConfig.json"

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
    // ⚡ REMOVED: border and rounded corners for an edge-to-edge fit
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
    // ⚡ REMOVED: border and rounded corners for an edge-to-edge fit
    <div className="w-full h-full bg-zinc-950/20 relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
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
      <Canvas camera={{ position:[10,10,10], fov: 45 }}>
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

        {/* 📐 Spatial Environment Grid Helper:
            Setting infiniteGrid={true} or removing limits lets the grid remain visible 
            from both sides, though it will naturally fade away based on distance parameters. */}
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
        
        {/* 🎥 CAMERA ROTATION ENGINE UNLOCKED:
            Setting maxPolarAngle={Math.PI} removes the horizon ceiling lock.
            You can now drag the camera straight down to view your model from underneath. */}
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


type ViewType = "editor" | "flow" | "viewer"

interface TabConfig {
  id: ViewType;
  label: string;
  icon: keyof typeof LucideIcons;
}

export const WorkspaceCanvas = () => {
  const [leftTab, setLeftTab] = useState<ViewType>("editor")
  const [rightTab, setRightTab] = useState<ViewType>("flow")
  const [isSplitView, setIsSplitView] = useState<boolean>(true)

  const tabList: TabConfig[] = [
    { id: "editor", label: "Logic Script (Monaco)", icon: "Code2" },
    { id: "flow", label: "System Graph (React Flow)", icon: "Network" },
    { id: "viewer", label: "3D Digital Twin (Three.js)", icon: "Box" },
  ]

  const resolveContentNode = (view: ViewType) => {
    switch (view) {
      case "editor": return <MonacoEditorPlaceholder />
      case "flow": return <RealReactFlowCanvas />
      case "viewer": return <RealThreeJsViewer />
    }
  }

  const renderTabWindowPane = (activeTab: ViewType, onTabChange: (v: ViewType) => void, contextBadge: string) => {
    return (
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => onTabChange(val as ViewType)} 
        className="w-full h-full flex flex-col gap-0.5 bg-[var(--ide-surface-bg)]"
      >
        <div className="w-full h-9 bg-[var(--ide-panel-bg)] border-b border-[var(--border)] flex items-center justify-between px-2 shrink-0 select-none">
          <TabsList variant="line" className="h-full bg-transparent p-0 gap-1 border-b-0">
            {tabList.map((tab) => {
              const TabIcon = (LucideIcons[tab.icon] || LucideIcons.File) as React.ComponentType<{ className?: string }>
              const isSelected = activeTab === tab.id
              
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "h-full px-3 text-[11px] font-medium tracking-wide gap-1.5 transition-all duration-150 shadow-none outline-none border-b-2 rounded-none",
                    isSelected 
                      ? "text-[var(--foreground)] border-b-[var(--primary)] font-semibold bg-transparent" 
                      : "text-[var(--ide-text-inactive)] border-b-transparent hover:text-[var(--foreground)] bg-transparent"
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5 shrink-0 text-current" />
                  <span>{tab.label}</span>
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
        <IdeMenuItem config={editorOptions} menuButton={<IdeBarItem
          tooltip={isSplitView ? "Collapse split-screen layout" : "Split editor workspace canvas view"}
          icon={<LucideIcons.Ellipsis className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
          side="bottom"
          className="px-1"
        />} />
          </div>
        </div>

        {/* ⚡ UPDATED: Changed padding from p-3 to p-0 for a completely flush edge layout */}
        <div className="flex-1 w-full min-h-0 p-0 overflow-hidden bg-[var(--ide-surface-bg)]">
          {resolveContentNode(activeTab)}
        </div>
      </Tabs>
    )
  }

  return (
    <div className="w-full h-full bg-[var(--ide-surface-bg)] flex flex-col overflow-hidden">
      {isSplitView ? (
        <ResizablePanelGroup orientation="horizontal" className="h-full w-full border-none">
          <ResizablePanel defaultSize={50} minSize={25}>
            {renderTabWindowPane(leftTab, setLeftTab, "PANE ALPHA")}
          </ResizablePanel>
          
          <ResizableHandle 
            withHandle 
            className="bg-transparent border-none w-1.5 z-40"
            dotsClassName="bg-[var(--ide-text-inactive)]/40 group-hover:bg-[var(--primary)]"
          />

          <ResizablePanel defaultSize={50} minSize={25}>
            {renderTabWindowPane(rightTab, setRightTab, "PANE BETA")}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        renderTabWindowPane(leftTab, setLeftTab, "PRIMARY CANVAS")
      )}
    </div>
  )
}
