import { useEffect, useRef } from "react"

export const useTerminal = (socketUrl: string) => {
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const socket = new WebSocket(socketUrl)
    socket.onmessage = (event) => {
      if (terminalRef.current) terminalRef.current.textContent += `${event.data}\n`
    }
    return () => socket.close()
  }, [socketUrl])

  return { terminalRef }
}