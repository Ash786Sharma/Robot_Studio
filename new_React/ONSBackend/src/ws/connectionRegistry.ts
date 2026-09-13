import type { WebSocket } from "ws";

const rooms = new Map<string, Set<WebSocket>>();

export const connectionRegistry = {
  join(projectId: string, socket: WebSocket) {
    if (!rooms.has(projectId)) rooms.set(projectId, new Set());
    rooms.get(projectId)!.add(socket);
  },

  leave(projectId: string, socket: WebSocket) {
    const sockets = rooms.get(projectId);
    sockets?.delete(socket);
    if (sockets && sockets.size === 0) rooms.delete(projectId);
  },

  broadcast(projectId: string, message: unknown, exclude?: WebSocket) {
    const sockets = rooms.get(projectId);
    if (!sockets) return;
    const data = JSON.stringify(message);
    for (const socket of sockets) {
      if (socket !== exclude && socket.readyState === socket.OPEN) socket.send(data);
    }
  },
};
