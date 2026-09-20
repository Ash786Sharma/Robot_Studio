import { apiRequest } from "./httpClient"

export type DeviceKind = "robot" | "plc" | "hmi"

export interface DeviceSummary {
  id: string
  projectId: string
  kind: DeviceKind
  name: string
  rootFileNodeId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateDeviceInput {
  kind: DeviceKind
  name: string
  /** Robot only: clone an existing robot-library entry instead of uploading files. */
  libraryEntryId?: string
  /** Robot only: a ready-made .ord file, uploaded as-is. */
  ordFile?: File
  /** Robot only: a URDF file to derive an .ord from (with its mesh files). */
  urdfFile?: File
  meshFiles?: File[]
}

function toFormData(input: CreateDeviceInput): FormData {
  const form = new FormData()
  form.append("kind", input.kind)
  form.append("name", input.name)
  if (input.libraryEntryId) form.append("libraryEntryId", input.libraryEntryId)
  if (input.ordFile) form.append("ord", input.ordFile)
  if (input.urdfFile) form.append("urdf", input.urdfFile)
  for (const mesh of input.meshFiles ?? []) form.append("meshes", mesh)
  return form
}

export const devicesApi = {
  list: (projectId: string) => apiRequest<DeviceSummary[]>(`/api/projects/${projectId}/devices`),

  create: (projectId: string, input: CreateDeviceInput) =>
    apiRequest<DeviceSummary>(`/api/projects/${projectId}/devices`, { method: "POST", body: toFormData(input) }),

  remove: (projectId: string, deviceId: string) =>
    apiRequest<void>(`/api/projects/${projectId}/devices/${deviceId}`, { method: "DELETE" }),
}
