import { addEdge, ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, type Connection, type Edge, type Node, type ReactFlowInstance } from "@xyflow/react"
import { useEffect, useRef, type DragEvent } from "react"
import { useQuery } from "@tanstack/react-query"
import { useThemeStore } from "@/core/store/themeStore"
import { useWorkspaceStore } from "@/core/store/workspaceStore"
import { useProjectStore } from "@/core/store/projectStore"
import { filesApi } from "@/core/api/filesApi"
import { GitCompare, X } from "lucide-react"
import "@xyflow/react/dist/style.css" 

const getIdeColor = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim()

const AUTOSAVE_DELAY_MS = 800

/** What actually gets saved to the .rgprg/.rsgprg file — just the portable graph shape, no baked-in theme colors. */
interface StoredGraphNode {
  id: string
  type?: string
  position: { x: number; y: number }
  data: { label: string }
}
interface StoredGraphEdge {
  id: string
  source: string
  target: string
}
interface StoredGraphDocument {
  format: "ons-logic-v1"
  nodes: StoredGraphNode[]
  edges: StoredGraphEdge[]
}

// 2. FLUSH REACT FLOW CANVAS PIPELINE
interface RealReactFlowCanvasProps {
  showChanges?: boolean
  onCloseChanges?: () => void
  device?: "robot" | "plc" | "hmi" | "unknown"
  safetyProgram?: boolean
  fileName?: string
  fileId?: string
  statusId?: string
}

export const RealReactFlowCanvas = ({ showChanges = false, onCloseChanges, device = "plc", safetyProgram = false, fileName, fileId, statusId = "flow" }: RealReactFlowCanvasProps) => {
  const currentTheme = useThemeStore((state) => state.currentTheme)
  const projectId = useProjectStore((state) => state.activeProjectId)
  const setTabStatus = useWorkspaceStore((state) => state.setTabStatus)
  const surfaceColor = getIdeColor("--ide-surface-bg")
  const panelColor = getIdeColor("--ide-panel-bg")
  const foregroundColor = getIdeColor("--foreground")
  const inactiveColor = getIdeColor("--ide-text-inactive")
  const borderColor = getIdeColor("--border")
  const primaryColor = getIdeColor("--primary")
  const styleFor = (isIo: boolean) => ({
    background: panelColor,
    color: foregroundColor,
    border: `1px solid ${isIo ? primaryColor : borderColor}`,
  })
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const flowRef = useRef<ReactFlowInstance<any, any> | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Which fileId's saved content has already been loaded into `nodes`/`edges` — also
  // gates persistence, so loading a file doesn't immediately re-save it as "changed".
  const loadedFileIdRef = useRef<string | undefined>(undefined)
  const skipNextPersistRef = useRef(false)
  const blocks = device === "robot"
    ? ["MoveJ", "MoveL", "SetIO", "Wait", "Gripper"]
    : ["Contact", "Coil", "Timer", "Counter", "Compare"]

  const contentQuery = useQuery({
    queryKey: ["file-content", projectId, fileId],
    queryFn: () => filesApi.getContent(projectId!, fileId!),
    enabled: Boolean(projectId && fileId),
  })

  // Load this file's saved graph once its content arrives — a brand-new/empty
  // .rgprg starts as a blank canvas instead of the old hardcoded demo graph.
  useEffect(() => {
    if (!fileId || !contentQuery.isSuccess || loadedFileIdRef.current === fileId) return
    loadedFileIdRef.current = fileId
    skipNextPersistRef.current = true

    const raw = contentQuery.data.content?.trim()
    let doc: StoredGraphDocument | null = null
    if (raw) {
      try {
        doc = JSON.parse(raw) as StoredGraphDocument
      } catch {
        doc = null // not valid JSON yet (e.g. a freshly-created empty file)
      }
    }

    setNodes((doc?.nodes ?? []).map((node) => ({ ...node, style: styleFor(node.type === "input" || node.type === "output") })))
    setEdges((doc?.edges ?? []).map((edge) => ({ ...edge, animated: true })))
  }, [fileId, contentQuery.isSuccess, contentQuery.data])

  // Debounced autosave of the graph as JSON, mirroring MonacoEditor's autosave.
  useEffect(() => {
    if (!projectId || !fileId || loadedFileIdRef.current !== fileId) return
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false
      return
    }

    setTabStatus(statusId, { saveStatus: "unsaved", gitStatus: "M" })
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const doc: StoredGraphDocument = {
        format: "ons-logic-v1",
        nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data: { label: data.label as string } })),
        edges: edges.map(({ id, source, target }) => ({ id, source, target })),
      }
      filesApi.saveContent(projectId, fileId, JSON.stringify(doc, null, 2)).then(() => {
        setTabStatus(statusId, { saveStatus: "saved", gitStatus: "M" })
      })
    }, AUTOSAVE_DELAY_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges])

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
      style: styleFor(false),
    }])
  }
  const handleConnect = (connection: Connection) => {
    setEdges((currentEdges) => addEdge({ ...connection, animated: true }, currentEdges))
  }
  return (
    <div data-theme={currentTheme} className={`w-full h-full relative overflow-hidden ${safetyProgram ? "ring-1 ring-inset ring-destructive/60" : ""}`} style={{ backgroundColor: surfaceColor }} onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
      <div className="absolute left-3 top-3 z-20 flex max-h-[calc(100%-24px)] w-36 flex-col gap-1 overflow-auto rounded-xl border border-ide-glass-border bg-ide-glass p-2 shadow-xl shadow-ide backdrop-blur-md">
        <div className={`px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide ${safetyProgram ? "text-destructive" : "text-[var(--ide-text-inactive)]"}`}>{safetyProgram ? "Safety Logic" : device === "robot" ? "Robot Blocks" : "PLC Blocks"}</div>
        {blocks.map((block) => (
          <div key={block} draggable onDragStart={(event) => event.dataTransfer.setData("application/x-ons-block", block)} className="cursor-grab rounded-md border border-ide-glass-border bg-ide-glass-surface px-2 py-1.5 text-[11px] text-[var(--foreground)] hover:bg-ide-glass-hover active:cursor-grabbing">{block}</div>
        ))}
        {fileName && <div className="border-t border-ide-glass-border pt-1 text-[9px] text-[var(--ide-text-inactive)]">{fileName}</div>}
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
          maskColor={`color-mix(in srgb, ${surfaceColor} 35%, transparent)`}
        />
      </ReactFlow>
    </div>
  )
}
