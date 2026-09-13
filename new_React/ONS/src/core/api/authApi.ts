import { apiRequest } from "./httpClient"

export const authApi = {
  // Browsers can't set an Authorization header on a WebSocket handshake, so we
  // exchange the JWT for a short-lived, single-purpose ticket to open the socket with.
  getWsTicket: () => apiRequest<{ ticket: string }>("/api/auth/ws-ticket"),
}
