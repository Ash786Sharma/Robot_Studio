import { connectionRegistry } from "./connectionRegistry.js";

export interface FileSyncMessage {
  type: "file:create" | "file:update" | "file:delete" | "file:rename";
  payload: unknown;
}

export const fileSyncGateway = {
  broadcast(projectId: string, message: FileSyncMessage) {
    connectionRegistry.broadcast(projectId, message);
  },
};
