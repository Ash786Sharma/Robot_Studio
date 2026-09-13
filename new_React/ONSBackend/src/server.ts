import http from "http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { attachWebSocketServer } from "./ws/wsServer.js";

const app = createApp();
const server = http.createServer(app);

attachWebSocketServer(server);

server.listen(env.PORT, () => {
  logger.info(`Server running at http://localhost:${env.PORT}`);
  logger.info(`API docs at http://localhost:${env.PORT}/api-docs`);
});
