
import { addEdge, ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, type Connection, type ReactFlowInstance } from "@xyflow/react"
import { useRef, type DragEvent } from "react"
import { useThemeStore } from "@/core/store/themeStore"
import { GitCompare, X } from "lucide-react"
import "@xyflow/react/dist/style.css" 

const getIdeColor = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim()

// 2. FLUSH REACT FLOW CANVAS PIPELINE
interface RealReactFlowCanvasProps {
  showChanges?: boolean
  onCloseChanges?: () => void
  device?: "robot" | "plc" | "hmi" | "unknown"
  safetyProgram?: boolean
  fileName?: string
}

export const RealReactFlowCanvas = ({ showChanges = false, onCloseChanges, device = "plc", safetyProgram = false, fileName }: RealReactFlowCanvasProps) => {
  const currentTheme = useThemeStore((state) => state.currentTheme)
  const surfaceColor = getIdeColor("--ide-surface-bg")
  const panelColor = getIdeColor("--ide-panel-bg")
  const foregroundColor = getIdeColor("--foreground")
  const inactiveColor = getIdeColor("--ide-text-inactive")
  const borderColor = getIdeColor("--border")
  const primaryColor = getIdeColor("--primary")
  const initialNodes = [
    { id: "plc", type: "input", data: { label: "PLC_Main_Logic" }, position: { x: 50, y: 100 }, style: { background: panelColor, color: foregroundColor, border: `1px solid ${primaryColor}` } },
    { id: "safety", data: { label: "Safety_Relay_Monitor" }, position: { x: 250, y: 100 }, style: { background: panelColor, color: foregroundColor, border: `1px solid ${borderColor}` } },
    { id: "ur5", type: "output", data: { label: "UR5_Kinematics" }, position: { x: 450, y: 100 }, style: { background: panelColor, color: foregroundColor, border: `1px solid ${primaryColor}` } },
  ]
  const initialEdges = [
    { id: "e1-2", source: "plc", target: "safety", animated: true },
    { id: "e2-3", source: "safety", target: "ur5", animated: true },
  ]
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const flowRef = useRef<ReactFlowInstance<any, any> | null>(null)
  const blocks = device === "robot"
    ? ["MoveJ", "MoveL", "SetIO", "Wait", "Gripper"]
    : ["Contact", "Coil", "Timer", "Counter", "Compare"]

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    const block = event.dataTransfer.getData("application/x-ons-block")
    const position = flowRef.current?.screenToFlowPosition({ x: event.clientX, y: event.clientY })
    if (!block || !position) return
    setNodes((currentNodes) => [...currentNodes, {
      id: `${block}-${Date.now()}`,
      type: "default",
      position,
      data: { label: block },
      style: {
        background: panelColor,
        color: foregroundColor,
        border: `1px solid ${primaryColor}`,
        borderRadius: 6,
        padding: 8,
      },
    }])
  }
  const handleConnect = (connection: Connection) => {
    setEdges((currentEdges) => addEdge({ ...connection, animated: true }, currentEdges))
  }
  const logicDocument = JSON.stringify({
    format: "ons-logic-v1",
    device,
    safety: safetyProgram,
    nodes,
    edges,
  })
  return (
    <div data-theme={currentTheme} className={`w-full h-full relative overflow-hidden ${safetyProgram ? "ring-1 ring-inset ring-red-500/60" : ""}`} style={{ backgroundColor: surfaceColor }} onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
      <div className="absolute left-3 top-3 z-20 flex max-h-[calc(100%-24px)] w-36 flex-col gap-1 overflow-auto rounded-xl border border-white/10 bg-black/25 p-2 shadow-xl backdrop-blur-md">
        <div className={`px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide ${safetyProgram ? "text-red-300" : "text-[var(--ide-text-inactive)]"}`}>{safetyProgram ? "Safety Logic" : device === "robot" ? "Robot Blocks" : "PLC Blocks"}</div>
        {blocks.map((block) => (
          <div key={block} draggable onDragStart={(event) => event.dataTransfer.setData("application/x-ons-block", block)} className="cursor-grab rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-[var(--foreground)] hover:bg-white/10 active:cursor-grabbing">{block}</div>
        ))}
        {fileName && <div className="border-t border-white/10 pt-1 text-[9px] text-[var(--ide-text-inactive)]">{fileName}</div>}
      </div>
      {showChanges && (
        <div className="absolute left-3 top-3 z-10 flex items-start gap-2 rounded-md border border-[var(--border)] bg-[var(--ide-panel-bg)]/95 px-3 py-2 text-[11px] shadow-lg">
          <GitCompare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
          <div>
            <p className="font-semibold text-[var(--foreground)]">Graph changes</p>
            <p className="text-[10px] text-[var(--ide-text-inactive)]">2 nodes and 1 connection changed</p>
          </div>
          <button type="button" aria-label="Close graph changes" title="Close graph changes" onClick={onCloseChanges} className="text-[var(--ide-text-inactive)] hover:text-[var(--foreground)]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onInit={(instance) => { flowRef.current = instance }}
        data-logic-document={logicDocument}
        defaultEdgeOptions={{ style: { stroke: primaryColor, strokeWidth: 1.5 } }}
        fitView>
        <Background color={borderColor} gap={16} size={1} />
        <Controls
          showInteractive
          style={{ backgroundColor: panelColor, borderColor }}
          className="border text-[var(--foreground)] fill-current [&>button]:!border-[var(--border)] [&>button]:!bg-transparent [&>button]:!text-[var(--foreground)] [&>button:hover]:!bg-[var(--ide-item-hover)]"
        />
        <MiniMap
          nodeColor={primaryColor}
          nodeStrokeColor={inactiveColor}
          nodeBorderRadius={2}
          pannable
          zoomable
          style={{ width: 150, height: 100, backgroundColor: panelColor, border: `1px solid ${borderColor}` }}
          maskColor="rgba(0, 0, 0, 0.25)"
        />
      </ReactFlow>
    </div>
  )
}
