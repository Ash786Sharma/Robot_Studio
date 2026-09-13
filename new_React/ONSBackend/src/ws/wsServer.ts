import type { Server as HttpServer } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { verifyWsTicket } from "../utils/jwt.js";
import { connectionRegistry } from "./connectionRegistry.js";
import type { FileSyncMessage } from "./fileSync.gateway.js";
import { logger } from "../config/logger.js";

// Single ws server multiplexed by upgrade-request path, since we're not using
// Socket.IO namespaces. Currently only "/ws/files" (project file-sync) is wired up.
export function attachWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "", "http://internal");

    if (url.pathname !== "/ws/files") {
      socket.destroy();
      return;
    }

    const ticket = url.searchParams.get("ticket");
    const projectId = url.searchParams.get("projectId");

    if (!ticket || !projectId) {
      socket.destroy();
      return;
    }

    try {
      verifyWsTicket(ticket);
    } catch {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, projectId);
    });
  });

  wss.on("connection", (ws: WebSocket, projectId: string) => {
    connectionRegistry.join(projectId, ws);
    logger.info({ projectId }, "ws client connected");

    ws.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as FileSyncMessage;
        connectionRegistry.broadcast(projectId, message, ws);
      } catch {
        // ignore malformed frames
      }
    });

    ws.on("close", () => {
      connectionRegistry.leave(projectId, ws);
      logger.info({ projectId }, "ws client disconnected");
    });
  });

  return wss;
}
