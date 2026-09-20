import { useAuthStore } from "@/core/store/authStore"
import { resolveApiUrl } from "./resolveBackendUrl"

const API_URL = resolveApiUrl()

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {}
  if (!isFormData) headers["Content-Type"] = "application/json"
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body),
  })

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => undefined)

  if (!response.ok) {
    throw new ApiError(response.status, data?.message ?? "Request failed", data?.details)
  }

  return data as T
}

export { API_URL }
