import { useEffect, useRef } from "react"
import { useXTerm } from "react-xtermjs"
import { FitAddon } from "@xterm/addon-fit"
import { authApi } from "@/core/api/authApi"
import { resolveWsUrl } from "@/core/api/resolveBackendUrl"

const WS_URL = resolveWsUrl()

type TerminalServerMessage = { type: "output"; data: string } | { type: "exit"; code: number | null }

/** Wires an xterm.js instance to a real PTY-backed shell over `/ws/terminal`. */
export function useTerminal(projectId: string | null) {
  const fitAddonRef = useRef(new FitAddon())
  const { ref, instance } = useXTerm({
    addons: [fitAddonRef.current],
    options: {
      cursorBlink: true,
      convertEol: true,
      fontSize: 13,
      theme: { background: "#09090b" },
    },
  })
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!instance || !projectId) return

    let cancelled = false

    authApi.getWsTicket().then(({ ticket }) => {
      if (cancelled) return
      const socket = new WebSocket(`${WS_URL}/ws/terminal?ticket=${ticket}&projectId=${projectId}`)
      socketRef.current = socket

      socket.onmessage = (event) => {
        const message: TerminalServerMessage = JSON.parse(event.data)
        if (message.type === "output") instance.write(message.data)
        else if (message.type === "exit") instance.write(`\r\n[process exited${message.code !== null ? ` with code ${message.code}` : ""}]\r\n`)
      }

      const dataDisposable = instance.onData((data) => {
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: "input", data }))
      })

      socket.onopen = () => {
        fitAddonRef.current.fit()
        socket.send(JSON.stringify({ type: "resize", cols: instance.cols, rows: instance.rows }))
      }

      socket.onclose = () => dataDisposable.dispose()
    })

    return () => {
      cancelled = true
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [instance, projectId])

  useEffect(() => {
    if (!instance) return
    const observer = new ResizeObserver(() => {
      fitAddonRef.current.fit()
      const socket = socketRef.current
      if (socket && socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: "resize", cols: instance.cols, rows: instance.rows }))
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [instance, ref])

  return { ref }
}
