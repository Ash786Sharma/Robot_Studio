import os from "os";
import { promises as fs } from "fs";
import path from "path";
import pty from "node-pty";
import type { WebSocket } from "ws";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export type TerminalClientMessage =
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number };

export type TerminalServerMessage = { type: "output"; data: string } | { type: "exit"; code: number | null };

const DEFAULT_SHELL = os.platform() === "win32" ? "powershell.exe" : process.env.SHELL || "bash";

function send(socket: WebSocket, message: TerminalServerMessage) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

/**
 * Spawns a real PTY-backed shell for a WebSocket connection, cwd'd into the
 * project's storage directory. One shell per socket; killed on disconnect.
 */
export async function attachTerminalSocket(socket: WebSocket, projectId: string) {
  const cwd = path.resolve(env.STORAGE_ROOT, projectId);
  await fs.mkdir(cwd, { recursive: true });

  const shell = pty.spawn(DEFAULT_SHELL, [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd,
    env: process.env as Record<string, string>,
  });

  shell.onData((data) => send(socket, { type: "output", data }));
  shell.onExit(({ exitCode }) => {
    send(socket, { type: "exit", code: exitCode });
    if (socket.readyState === socket.OPEN) socket.close();
  });

  socket.on("message", (raw) => {
    let message: TerminalClientMessage;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (message.type === "input") shell.write(message.data);
    else if (message.type === "resize") shell.resize(Math.max(1, message.cols), Math.max(1, message.rows));
  });

  socket.on("close", () => {
    shell.kill();
    logger.info({ projectId }, "terminal session closed");
  });

  logger.info({ projectId, pid: shell.pid }, "terminal session started");
}
