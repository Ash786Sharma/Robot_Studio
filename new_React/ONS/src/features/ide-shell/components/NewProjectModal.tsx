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
import { projectsApi } from "@/core/api/projectsApi"
import { devicesApi, type DeviceKind } from "@/core/api/devicesApi"
import { robotLibraryApi } from "@/core/api/robotLibraryApi"

type RobotSource = "upload" | "library"

const DEVICE_OPTIONS: { kind: DeviceKind; label: string; icon: typeof Bot; defaultName: string }[] = [
  { kind: "robot", label: "Robot", icon: Bot, defaultName: "Robot 1" },
  { kind: "plc", label: "PLC", icon: CircuitBoard, defaultName: "PLC 1" },
  { kind: "hmi", label: "HMI", icon: MonitorSmartphone, defaultName: "HMI 1" },
]

export const NewProjectModal = () => {
  const isOpen = useIdeStore((state) => state.isNewProjectModalOpen)
  const close = useIdeStore((state) => state.closeNewProjectModal)
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId)
  const queryClient = useQueryClient()

  const [projectName, setProjectName] = useState("")
  const [selectedKinds, setSelectedKinds] = useState<Set<DeviceKind>>(new Set())
  const [deviceNames, setDeviceNames] = useState<Record<DeviceKind, string>>({ robot: "", plc: "", hmi: "" })
  const [robotSource, setRobotSource] = useState<RobotSource>("upload")
  const [urdfFile, setUrdfFile] = useState<File | null>(null)
  const [meshFiles, setMeshFiles] = useState<File[]>([])
  const [ordFile, setOrdFile] = useState<File | null>(null)
  const [libraryEntryId, setLibraryEntryId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: libraryEntries } = useQuery({
    queryKey: ["robot-library"],
    queryFn: robotLibraryApi.list,
    enabled: isOpen && selectedKinds.has("robot") && robotSource === "library",
  })

  const toggleKind = (kind: DeviceKind) => {
    setSelectedKinds((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const reset = () => {
    setProjectName("")
    setSelectedKinds(new Set())
    setDeviceNames({ robot: "", plc: "", hmi: "" })
    setRobotSource("upload")
    setUrdfFile(null)
    setMeshFiles([])
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
    projectName.trim().length > 0 &&
    selectedKinds.size > 0 &&
    !isSubmitting &&
    [...selectedKinds].every((kind) => deviceNames[kind].trim().length > 0) &&
    (!selectedKinds.has("robot") ||
      (robotSource === "library" ? libraryEntryId.length > 0 : Boolean(ordFile) || Boolean(urdfFile)))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const project = await projectsApi.create({ name: projectName.trim() })

      for (const kind of selectedKinds) {
        if (kind === "robot") {
          await devicesApi.create(project.id, {
            kind,
            name: deviceNames.robot.trim(),
            libraryEntryId: robotSource === "library" ? libraryEntryId : undefined,
            ordFile: robotSource === "upload" ? (ordFile ?? undefined) : undefined,
            urdfFile: robotSource === "upload" ? (urdfFile ?? undefined) : undefined,
            meshFiles: robotSource === "upload" ? meshFiles : undefined,
          })
        } else {
          await devicesApi.create(project.id, { kind, name: deviceNames[kind].trim() })
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["projects", "bootstrap"] })
      setActiveProjectId(project.id)
      close()
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Name your project and add the devices you want to work with.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-project-name">Project name</Label>
            <Input
              id="new-project-name"
              autoFocus
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Robot Cell"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Devices</Label>
            <div className="grid grid-cols-3 gap-2">
              {DEVICE_OPTIONS.map(({ kind, label, icon: Icon, defaultName }) => {
                const selected = selectedKinds.has(kind)
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      toggleKind(kind)
                      if (!selected && !deviceNames[kind]) {
                        setDeviceNames((prev) => ({ ...prev, [kind]: defaultName }))
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {[...selectedKinds].map((kind) => (
            <div key={kind} className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`device-name-${kind}`}>{DEVICE_OPTIONS.find((o) => o.kind === kind)!.label} name</Label>
                <Input
                  id={`device-name-${kind}`}
                  value={deviceNames[kind]}
                  onChange={(e) => setDeviceNames((prev) => ({ ...prev, [kind]: e.target.value }))}
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
                        <span className="text-muted-foreground">Mesh files referenced by the URDF (.stl, .dae, .obj, .gltf, .glb)</span>
                        <input
                          type="file"
                          multiple
                          accept=".stl,.dae,.obj,.gltf,.glb"
                          onChange={(e) => setMeshFiles(Array.from(e.target.files ?? []))}
                        />
                      </label>
                    </div>
                  ) : (
                    <select
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                      value={libraryEntryId}
                      onChange={(e) => setLibraryEntryId(e.target.value)}
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
          ))}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
