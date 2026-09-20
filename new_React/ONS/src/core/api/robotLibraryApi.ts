import { apiRequest } from "./httpClient"

export interface RobotLibraryEntry {
  id: string
  ownerId: string
  name: string
  description: string | null
  ordStorageKey: string
  jointCount: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateRobotLibraryEntryInput {
  name: string
  description?: string
  /** A ready-made .ord file, uploaded as-is. */
  ordFile?: File
  /** A URDF file to derive an .ord from (with its mesh files). */
  urdfFile?: File
  meshFiles?: File[]
}

function toFormData(input: CreateRobotLibraryEntryInput): FormData {
  const form = new FormData()
  form.append("name", input.name)
  if (input.description) form.append("description", input.description)
  if (input.ordFile) form.append("ord", input.ordFile)
  if (input.urdfFile) form.append("urdf", input.urdfFile)
  for (const mesh of input.meshFiles ?? []) form.append("meshes", mesh)
  return form
}

export const robotLibraryApi = {
  list: () => apiRequest<RobotLibraryEntry[]>("/api/robot-library"),

  create: (input: CreateRobotLibraryEntryInput) =>
    apiRequest<RobotLibraryEntry>("/api/robot-library", { method: "POST", body: toFormData(input) }),

  get: (id: string) => apiRequest<RobotLibraryEntry>(`/api/robot-library/${id}`),

  remove: (id: string) => apiRequest<void>(`/api/robot-library/${id}`, { method: "DELETE" }),
}
