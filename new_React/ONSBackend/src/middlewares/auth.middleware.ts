import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../errors/AppError.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    next(new UnauthorizedError("Missing authentication token"));
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}
