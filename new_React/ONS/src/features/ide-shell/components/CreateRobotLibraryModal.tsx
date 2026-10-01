import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useIdeStore } from "@/core/store/ideStore"
import { robotLibraryApi } from "@/core/api/robotLibraryApi"

type RobotSource = "urdf" | "ord"

// Adds a reusable robot description to the library, independent of any
// project — the same upload (URDF+meshes, or a ready .ord) NewProjectModal/
// AddDeviceModal already do inline, but reachable up front from "Get Started".
export const CreateRobotLibraryModal = () => {
  const isOpen = useIdeStore((state) => state.isCreateRobotModalOpen)
  const close = useIdeStore((state) => state.closeCreateRobotModal)
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [source, setSource] = useState<RobotSource>("urdf")
  const [urdfFile, setUrdfFile] = useState<File | null>(null)
  const [meshFiles, setMeshFiles] = useState<File[]>([])
  const [collisionMeshFiles, setCollisionMeshFiles] = useState<File[]>([])
  const [ordFile, setOrdFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName("")
    setDescription("")
    setSource("urdf")
    setUrdfFile(null)
    setMeshFiles([])
    setCollisionMeshFiles([])
    setOrdFile(null)
    setError(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
      reset()
    }
  }

  const canSubmit =
    name.trim().length > 0 &&
    !isSubmitting &&
    (source === "ord" ? Boolean(ordFile) : Boolean(urdfFile))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await robotLibraryApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        ordFile: source === "ord" ? (ordFile ?? undefined) : undefined,
        urdfFile: source === "urdf" ? (urdfFile ?? undefined) : undefined,
        meshFiles: source === "urdf" ? meshFiles : undefined,
        collisionMeshFiles: source === "urdf" ? collisionMeshFiles : undefined,
      })

      await queryClient.invalidateQueries({ queryKey: ["robot-library"] })
      close()
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create robot library entry")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Robot Library Entry</DialogTitle>
          <DialogDescription>
            Upload a robot description once — pick it from the library when creating or adding devices to any project.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="robot-name">Robot name</Label>
            <Input id="robot-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="UR5" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="robot-description">Description (optional)</Label>
            <Input
              id="robot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="6-axis collaborative arm"
            />
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-3">
            <div className="flex gap-1.5">
              <Button type="button" size="sm" variant={source === "urdf" ? "default" : "outline"} onClick={() => setSource("urdf")}>
                Upload URDF
              </Button>
              <Button type="button" size="sm" variant={source === "ord" ? "default" : "outline"} onClick={() => setSource("ord")}>
                Upload .ord
              </Button>
            </div>

            {source === "urdf" ? (
              <div className="flex flex-col gap-2 text-xs">
                <label className="flex flex-col gap-1">
                  <span className="text-muted-foreground">URDF file</span>
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
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">.ord file</span>
                <input type="file" accept=".ord,application/json" onChange={(e) => setOrdFile(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

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
