import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { authApi } from "@/core/api/authApi"
import { resolveWsUrl } from "@/core/api/resolveBackendUrl"

const WS_URL = resolveWsUrl()

// Keeps the file-tree query cache in sync with other clients editing the same project.
export function useFileSyncSocket(projectId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!projectId) return

    let socket: WebSocket | undefined
    let cancelled = false

    authApi.getWsTicket().then(({ ticket }) => {
      if (cancelled) return
      socket = new WebSocket(`${WS_URL}/ws/files?ticket=${ticket}&projectId=${projectId}`)
      socket.onmessage = () => {
        queryClient.invalidateQueries({ queryKey: ["file-tree", projectId] })
      }
    })

    return () => {
      cancelled = true
      socket?.close()
    }
  }, [projectId, queryClient])
}
