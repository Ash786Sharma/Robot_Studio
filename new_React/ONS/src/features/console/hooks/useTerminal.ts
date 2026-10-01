import { useEffect, useMemo, useRef } from "react"
import { useXTerm } from "react-xtermjs"
import { FitAddon } from "@xterm/addon-fit"
import { authApi } from "@/core/api/authApi"
import { resolveWsUrl } from "@/core/api/resolveBackendUrl"
import { useThemeStore } from "@/core/store/themeStore"

const WS_URL = resolveWsUrl()

type TerminalServerMessage = { type: "output"; data: string } | { type: "exit"; code: number | null }

/** Reads the active IDE theme's CSS tokens so xterm's colors match it, same approach as Monaco's applyIdeTheme. */
const getTerminalTheme = () => {
  const styles = getComputedStyle(document.documentElement)
  const get = (token: string) => styles.getPropertyValue(token).trim()
  return {
    background: get("--ide-surface-bg"),
    foreground: get("--foreground"),
    cursor: get("--primary"),
    cursorAccent: get("--ide-surface-bg"),
    selectionBackground: get("--ide-item-active"),
  }
}

/** Wires an xterm.js instance to a real PTY-backed shell over `/ws/terminal`. */
export function useTerminal(projectId: string | null) {
  const currentTheme = useThemeStore((state) => state.currentTheme)
  const fitAddonRef = useRef(new FitAddon())
  // react-xtermjs recreates the whole Terminal instance whenever `options`/`addons`
  // change identity — new literals every render would tear it down in a loop.
  const addons = useMemo(() => [fitAddonRef.current], [])
  const options = useMemo(() => ({
    cursorBlink: true,
    convertEol: true,
    fontSize: 13,
    theme: getTerminalTheme(),
  }), [])
  const { ref, instance } = useXTerm({
    addons,
    options,
  })
  const socketRef = useRef<WebSocket | null>(null)

  // Live-update xterm's colors on theme switch without tearing down the instance/session.
  useEffect(() => {
    if (!instance) return
    instance.options.theme = getTerminalTheme()
  }, [instance, currentTheme])

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
    }).catch((err) => {
      if (!cancelled) console.warn("Terminal socket unavailable:", err)
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
