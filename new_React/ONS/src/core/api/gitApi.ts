import { apiRequest } from "./httpClient"

export interface GitChangeDto {
  id: string
  path: string
  fileName: string
  status: "M" | "A" | "D" | "U"
  staged: boolean
  additions: number
  deletions: number
}

export interface GitStatusDto {
  branch: string
  changes: GitChangeDto[]
}

export interface GitCommitDto {
  id: string
  message: string
  author: string
  time: string
  current: boolean
}

export interface GitBranchDto {
  name: string
  current: boolean
}

export const gitApi = {
  getStatus: (projectId: string) => apiRequest<GitStatusDto>(`/api/projects/${projectId}/git/status`),

  stage: (projectId: string, paths: string[]) =>
    apiRequest<void>(`/api/projects/${projectId}/git/stage`, { method: "POST", body: { paths } }),

  unstage: (projectId: string, paths: string[]) =>
    apiRequest<void>(`/api/projects/${projectId}/git/unstage`, { method: "POST", body: { paths } }),

  discard: (projectId: string, path: string) =>
    apiRequest<void>(`/api/projects/${projectId}/git/discard`, { method: "POST", body: { path } }),

  commit: (projectId: string, message: string) =>
    apiRequest<void>(`/api/projects/${projectId}/git/commit`, { method: "POST", body: { message } }),

  getLog: (projectId: string) => apiRequest<GitCommitDto[]>(`/api/projects/${projectId}/git/log`),

  listBranches: (projectId: string) => apiRequest<GitBranchDto[]>(`/api/projects/${projectId}/git/branches`),

  createBranch: (projectId: string, name: string) =>
    apiRequest<void>(`/api/projects/${projectId}/git/branches`, { method: "POST", body: { name } }),

  switchBranch: (projectId: string, name: string) =>
    apiRequest<void>(`/api/projects/${projectId}/git/branches/switch`, { method: "POST", body: { name } }),

  deleteBranch: (projectId: string, name: string, force = false) =>
    apiRequest<void>(`/api/projects/${projectId}/git/branches/delete`, { method: "POST", body: { name, force } }),

  resetHard: (projectId: string) =>
    apiRequest<void>(`/api/projects/${projectId}/git/reset-hard`, { method: "POST" }),
}
