import { apiRequest } from "./httpClient"

export interface ProjectSummary {
  id: string
  name: string
  robotModel: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
}

export const projectsApi = {
  list: () => apiRequest<ProjectSummary[]>("/api/projects"),

  create: (input: { name: string; robotModel?: string }) =>
    apiRequest<ProjectSummary>("/api/projects", { method: "POST", body: input }),

  get: (id: string) => apiRequest<ProjectSummary>(`/api/projects/${id}`),
}
