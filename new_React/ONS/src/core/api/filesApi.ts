import { apiRequest } from "./httpClient"

export interface FileNodeDto {
  id: string
  projectId: string
  parentId: string | null
  name: string
  kind: "folder" | "file"
  fileType: string | null
  storageKey: string | null
  children: FileNodeDto[]
}

export interface CreateFileNodeInput {
  name: string
  kind: "folder" | "file"
  fileType?: string
  parentId?: string
}

export const filesApi = {
  getTree: (projectId: string) => apiRequest<FileNodeDto[]>(`/api/projects/${projectId}/files`),

  create: (projectId: string, input: CreateFileNodeInput) =>
    apiRequest<FileNodeDto>(`/api/projects/${projectId}/files`, { method: "POST", body: input }),

  getContent: (projectId: string, fileId: string) =>
    apiRequest<{ content: string }>(`/api/projects/${projectId}/files/${fileId}/content`),

  saveContent: (projectId: string, fileId: string, content: string) =>
    apiRequest<FileNodeDto>(`/api/projects/${projectId}/files/${fileId}/content`, {
      method: "PUT",
      body: { content },
    }),

  rename: (projectId: string, fileId: string, name: string) =>
    apiRequest<FileNodeDto>(`/api/projects/${projectId}/files/${fileId}`, { method: "PATCH", body: { name } }),

  remove: (projectId: string, fileId: string) =>
    apiRequest<void>(`/api/projects/${projectId}/files/${fileId}`, { method: "DELETE" }),
}
