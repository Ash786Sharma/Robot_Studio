import { useState } from "react"
import { Stage, Layer, Group, Rect, Text } from "react-konva"
import * as LucideIcons from "lucide-react"
import { IdeBarItem } from "@/features/ide-shell/components/IdeBarItem"

const widgets = ["Button", "Label", "Numeric Input", "Indicator", "Trend"]

interface HmiWidget {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  text: string
}

const initialWidgets: HmiWidget[] = [
  { id: "status", type: "Indicator", x: 28, y: 28, width: 160, height: 58, text: "Robot status" },
  { id: "cycle", type: "Label", x: 210, y: 28, width: 160, height: 58, text: "Cycle time" },
  { id: "start", type: "Button", x: 28, y: 108, width: 342, height: 58, text: "Start cycle" },
]

export const HmiEditor = ({ fileName }: { fileName?: string }) => {
  const [hmiWidgets, setHmiWidgets] = useState(initialWidgets)
  const getColor = (token: string) => getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const surfaceColor = getColor("--ide-surface-bg")
  const foregroundColor = getColor("--foreground")
  const borderColor = getColor("--border")
  const primaryColor = getColor("--primary")
  const activeColor = getColor("--ide-item-active")

  const addWidget = (type: string) => setHmiWidgets((currentWidgets) => [...currentWidgets, {
    id: `${type}-${Date.now()}`,
    type,
    x: 28,
    y: 190,
    width: 160,
    height: 48,
    text: type,
  }])

  return (
  <div className="flex h-full min-h-0 flex-col bg-[var(--ide-surface-bg)] text-[var(--foreground)]">
    <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--ide-panel-bg)] px-3 py-2">
      <div>
        <p className="text-xs font-semibold">HMI Screen</p>
        <p className="text-[10px] text-[var(--ide-text-inactive)]">{fileName ?? "Screen"} · ComfortPanel</p>
      </div>
      <LucideIcons.Monitor className="h-4 w-4 text-[var(--primary)]" />
    </div>
    <div className="flex min-h-0 flex-1 gap-3 p-3">
      <div className="flex w-36 shrink-0 flex-col gap-1 rounded-lg border border-white/10 bg-black/20 p-2 backdrop-blur-md">
        <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ide-text-inactive)]">Widgets</p>
        {widgets.map((widget) => <IdeBarItem key={widget} tooltip={`Add ${widget}`} text={widget} icon={<LucideIcons.Plus className="h-3 w-3" />} side="right" onClick={() => addWidget(widget)} className="w-full justify-start border-white/10 bg-white/5 text-left text-[11px] hover:bg-white/10" />)}
      </div>
      <div className="relative flex min-w-0 flex-1 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--ide-panel-bg)]/50">
        <div className="flex flex-col rounded border border-[var(--border)] bg-[var(--ide-surface-bg)] shadow-2xl">
          <div className="border-b border-[var(--border)] px-3 py-2 text-[10px] font-semibold">Main Operator Screen</div>
          <Stage width={420} height={280} className="max-w-full">
            <Layer>
              <Rect width={420} height={280} fill={surfaceColor} />
              {hmiWidgets.map((widget) => <Group key={widget.id} x={widget.x} y={widget.y} draggable onDragEnd={(event) => setHmiWidgets((currentWidgets) => currentWidgets.map((currentWidget) => currentWidget.id === widget.id ? { ...currentWidget, x: event.target.x(), y: event.target.y() } : currentWidget))}>
                <Rect width={widget.width} height={widget.height} cornerRadius={6} fill={widget.type === "Button" ? primaryColor : activeColor} stroke={borderColor} />
                <Text width={widget.width} height={widget.height} align="center" verticalAlign="middle" fill={foregroundColor} fontSize={14} text={widget.text} />
              </Group>)}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  </div>
  )
}