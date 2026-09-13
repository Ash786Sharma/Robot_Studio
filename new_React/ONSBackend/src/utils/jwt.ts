import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthTokenPayload {
  id: string;
  email: string;
}

export function generateToken(user: AuthTokenPayload): string {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}

// Short-lived, single-purpose ticket used to authenticate the WebSocket upgrade
// (browsers can't attach an Authorization header to a `new WebSocket(...)` handshake).
export function generateWsTicket(user: AuthTokenPayload): string {
  return jwt.sign({ ...user, scope: "ws" }, env.JWT_SECRET, { expiresIn: "30s" });
}

export function verifyWsTicket(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload & { scope?: string };
  if (payload.scope !== "ws") throw new Error("Invalid ticket scope");
  return payload;
}