import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Bot, CircuitBoard, MonitorSmartphone, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useIdeStore } from "@/core/store/ideStore"
import { useProjectStore } from "@/core/store/projectStore"
import { devicesApi, type DeviceKind } from "@/core/api/devicesApi"
import { robotLibraryApi } from "@/core/api/robotLibraryApi"

type RobotSource = "upload" | "library"

const DEVICE_OPTIONS: { kind: DeviceKind; label: string; icon: typeof Bot; defaultName: string }[] = [
  { kind: "robot", label: "Robot", icon: Bot, defaultName: "Robot 1" },
  { kind: "plc", label: "PLC", icon: CircuitBoard, defaultName: "PLC 1" },
  { kind: "hmi", label: "HMI", icon: MonitorSmartphone, defaultName: "HMI 1" },
]

// Adds a single device to the already-active project (unlike NewProjectModal,
// which creates a project + devices together). The backend rejects a second
// device of a kind the project already has, so kinds already present are
// disabled here rather than left to fail after submit.
export const AddDeviceModal = () => {
  const isOpen = useIdeStore((state) => state.isAddDeviceModalOpen)
  const close = useIdeStore((state) => state.closeAddDeviceModal)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const queryClient = useQueryClient()

  const [kind, setKind] = useState<DeviceKind | null>(null)
  const [deviceName, setDeviceName] = useState("")
  const [robotSource, setRobotSource] = useState<RobotSource>("upload")
  const [urdfFile, setUrdfFile] = useState<File | null>(null)
  const [meshFiles, setMeshFiles] = useState<File[]>([])
  const [collisionMeshFiles, setCollisionMeshFiles] = useState<File[]>([])
  const [ordFile, setOrdFile] = useState<File | null>(null)
  const [libraryEntryId, setLibraryEntryId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: existingDevices } = useQuery({
    queryKey: ["devices", activeProjectId],
    queryFn: () => devicesApi.list(activeProjectId!),
    enabled: isOpen && Boolean(activeProjectId),
  })
  const takenKinds = new Set((existingDevices ?? []).map((d) => d.kind))

  const { data: libraryEntries } = useQuery({
    queryKey: ["robot-library"],
    queryFn: robotLibraryApi.list,
    enabled: isOpen && kind === "robot" && robotSource === "library",
  })

  const reset = () => {
    setKind(null)
    setDeviceName("")
    setRobotSource("upload")
    setUrdfFile(null)
    setMeshFiles([])
    setCollisionMeshFiles([])
    setOrdFile(null)
    setLibraryEntryId("")
    setError(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
      reset()
    }
  }

  const canSubmit =
    Boolean(kind) &&
    deviceName.trim().length > 0 &&
    !isSubmitting &&
    (kind !== "robot" ||
      (robotSource === "library" ? libraryEntryId.length > 0 : Boolean(ordFile) || Boolean(urdfFile)))

  const handleSubmit = async () => {
    if (!activeProjectId || !kind) return
    setIsSubmitting(true)
    setError(null)
    try {
      await devicesApi.create(activeProjectId, {
        kind,
        name: deviceName.trim(),
        libraryEntryId: kind === "robot" && robotSource === "library" ? libraryEntryId : undefined,
        ordFile: kind === "robot" && robotSource === "upload" ? (ordFile ?? undefined) : undefined,
        urdfFile: kind === "robot" && robotSource === "upload" ? (urdfFile ?? undefined) : undefined,
        meshFiles: kind === "robot" && robotSource === "upload" ? meshFiles : undefined,
        collisionMeshFiles: kind === "robot" && robotSource === "upload" ? collisionMeshFiles : undefined,
      })

      await queryClient.invalidateQueries({ queryKey: ["file-tree", activeProjectId] })
      await queryClient.invalidateQueries({ queryKey: ["devices", activeProjectId] })
      close()
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add device")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Device</DialogTitle>
          <DialogDescription>Add a robot, PLC, or HMI device to this project.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Device type</Label>
            <div className="grid grid-cols-3 gap-2">
              {DEVICE_OPTIONS.map(({ kind: optionKind, label, icon: Icon, defaultName }) => {
                const selected = kind === optionKind
                const disabled = takenKinds.has(optionKind)
                return (
                  <button
                    key={optionKind}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setKind(optionKind)
                      if (!deviceName) setDeviceName(defaultName)
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors",
                      disabled
                        ? "cursor-not-allowed border-white/5 bg-white/5 text-muted-foreground/40"
                        : selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                    {disabled && <span className="text-[10px] opacity-70">Already added</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {kind && (
            <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-device-name">{DEVICE_OPTIONS.find((o) => o.kind === kind)!.label} name</Label>
                <Input
                  id="add-device-name"
                  value={deviceName}
                  readOnly={kind === "robot" && robotSource === "library"}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>

              {kind === "robot" && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={robotSource === "upload" ? "default" : "outline"}
                      onClick={() => setRobotSource("upload")}
                    >
                      Upload URDF/.ord
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={robotSource === "library" ? "default" : "outline"}
                      onClick={() => setRobotSource("library")}
                    >
                      Pick from library
                    </Button>
                  </div>

                  {robotSource === "upload" ? (
                    <div className="flex flex-col gap-2 text-xs">
                      <label className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Either an .ord file…</span>
                        <input
                          type="file"
                          accept=".ord,application/json"
                          onChange={(e) => setOrdFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-muted-foreground">…or a URDF file</span>
                        <input type="file" accept=".urdf,.xml" onChange={(e) => setUrdfFile(e.target.files?.[0] ?? null)} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Visual mesh files referenced by the URDF (.stl, .dae, .obj, .gltf, .glb)</span>
                        <input
                          type="file"
                          multiple
                          accept=".stl,.dae,.obj,.gltf,.glb"
                          onChange={(e) => setMeshFiles(Array.from(e.target.files ?? []))}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-muted-foreground">Collision mesh files (optional, can differ from visual)</span>
                        <input
                          type="file"
                          multiple
                          accept=".stl,.dae,.obj,.gltf,.glb"
                          onChange={(e) => setCollisionMeshFiles(Array.from(e.target.files ?? []))}
                        />
                      </label>
                    </div>
                  ) : (
                    <select
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                      value={libraryEntryId}
                      onChange={(e) => {
                        const entryId = e.target.value
                        setLibraryEntryId(entryId)
                        const entry = libraryEntries?.find((candidate) => candidate.id === entryId)
                        if (entry) setDeviceName(entry.name)
                      }}
                    >
                      <option value="">Select a robot…</option>
                      {(libraryEntries ?? []).map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name} ({entry.jointCount ?? "?"} joints)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
