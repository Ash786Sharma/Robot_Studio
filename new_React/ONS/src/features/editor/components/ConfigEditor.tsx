import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface ConfigEditorProps {
  fileName?: string
  fileId?: string
  deviceKind?: "robot" | "plc" | "hmi" | "unknown"
}

// TIA Portal-style device configuration shell: General/Network/IO tabs.
// Field content is intentionally a placeholder — the concrete hardware/
// software config schema per device kind is still being designed (see
// docs/ARCHITECTURE.md).
export const ConfigEditor = ({ fileName }: ConfigEditorProps) => {
  return (
    <div className="flex h-full w-full flex-col bg-[var(--ide-surface-bg)] text-[var(--foreground)]">
      <div className="border-b border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ide-text-inactive)]">
        {fileName ?? "Device Configuration"}
      </div>
      <Tabs defaultValue="general" className="flex-1 min-h-0 px-4 py-3">
        <TabsList variant="line">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="io">I/O</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="flex-1 min-h-0 overflow-auto pt-3 text-sm text-[var(--ide-text-inactive)]">
          General device properties will appear here.
        </TabsContent>
        <TabsContent value="network" className="flex-1 min-h-0 overflow-auto pt-3 text-sm text-[var(--ide-text-inactive)]">
          Network/connection topology settings will appear here.
        </TabsContent>
        <TabsContent value="io" className="flex-1 min-h-0 overflow-auto pt-3 text-sm text-[var(--ide-text-inactive)]">
          I/O address mapping will appear here.
        </TabsContent>
      </Tabs>
    </div>
  )
}
