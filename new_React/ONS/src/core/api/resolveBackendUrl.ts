// GitHub Codespaces forwards each port to its own subdomain following the pattern
// `<codespace-name>-<port>.app.github.dev`. When the app is opened through that
// forwarded URL, "http://localhost:3000" is wrong on two counts: it points at the
// *user's own machine* (not the container), and it's mixed-content-blocked by the
// browser on an https page anyway. Detect that case and swap in the matching port.
const BACKEND_PORT = 3000

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1"
}

function forwardedHost(hostname: string): string | undefined {
  const match = hostname.match(/^(.*)-(\d+)(\..+)$/)
  if (!match) return undefined
  const [, prefix, , suffix] = match
  return `${prefix}-${BACKEND_PORT}${suffix}`
}

export function resolveApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (import.meta.env.DEV) return ""
  if (typeof window === "undefined" || isLocalHostname(window.location.hostname)) {
    return `http://localhost:${BACKEND_PORT}`
  }
  const host = forwardedHost(window.location.hostname)
  return host ? `${window.location.protocol}//${host}` : `http://localhost:${BACKEND_PORT}`
}

export function resolveWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  if (typeof window === "undefined" || isLocalHostname(window.location.hostname)) {
    return `ws://localhost:${BACKEND_PORT}`
  }
  const host = forwardedHost(window.location.hostname)
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return host ? `${wsProtocol}//${host}` : `ws://localhost:${BACKEND_PORT}`
}
