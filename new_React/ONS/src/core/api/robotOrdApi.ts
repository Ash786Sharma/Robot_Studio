import { apiRequest } from "./httpClient"
import { useAuthStore } from "@/core/store/authStore"
import { resolveApiUrl } from "./resolveBackendUrl"

const API_URL = resolveApiUrl()

export type OrdMeshFileType = "stl" | "dae" | "obj" | "gltf" | "glb"

export interface OrdMeshRef {
  link: string
  storageKey: string
  fileType: OrdMeshFileType
}

export interface OrdJointLimits {
  lower?: number
  upper?: number
  velocity?: number
  effort?: number
}

export interface OrdJointDynamics {
  friction: number
  damping: number
}

export interface OrdDhParams {
  a: number
  alpha: number
  d: number
  thetaOffset: number
}

export interface OrdScrewAxis {
  omega: [number, number, number]
  v: [number, number, number]
}

export interface OrdJoint {
  name: string
  parent: string
  child: string
  type: "revolute" | "continuous" | "prismatic" | "fixed"
  origin: { xyz: [number, number, number]; rpy: [number, number, number] }
  axis: [number, number, number]
  limits?: OrdJointLimits
  dynamics?: OrdJointDynamics
  dh?: OrdDhParams
  screwAxis?: OrdScrewAxis
}

export interface OrdLink {
  name: string
  parent: string | null
  mass: number
  centerOfMass: [number, number, number]
  inertia: [number, number, number, number, number, number]
}

export interface OrdDocument {
  ordVersion: 1
  name: string
  source: { format: "urdf" | "sdf" | "ord"; storageKey: string }
  links: OrdLink[]
  joints: OrdJoint[]
  meshes: { visual: OrdMeshRef[]; collision: OrdMeshRef[] }
  sensors: { name: string; kind: string; mountLink: string; origin: { xyz: [number, number, number]; rpy: [number, number, number] } }[]
  basePose: { dualQuaternion: { real: [number, number, number, number]; dual: [number, number, number, number] } }
}

export const robotOrdApi = {
  getOrd: (projectId: string, deviceId: string) =>
    apiRequest<OrdDocument>(`/api/projects/${projectId}/devices/${deviceId}/ord`),

  updateOrd: (projectId: string, deviceId: string, ord: OrdDocument) =>
    apiRequest<OrdDocument>(`/api/projects/${projectId}/devices/${deviceId}/ord`, { method: "PUT", body: ord }),

  /** Mesh bytes are fetched (not apiRequest'd) so they can be fed straight into a three.js loader's `.parse()`. */
  async getMeshArrayBuffer(projectId: string, deviceId: string, storageKey: string): Promise<ArrayBuffer> {
    const token = useAuthStore.getState().token
    const response = await fetch(
      `${API_URL}/api/projects/${projectId}/devices/${deviceId}/ord/mesh?key=${encodeURIComponent(storageKey)}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    )
    if (!response.ok) throw new Error(`Failed to fetch mesh ${storageKey}: ${response.status}`)
    return response.arrayBuffer()
  },
}
