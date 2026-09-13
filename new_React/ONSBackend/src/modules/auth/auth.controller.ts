import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { generateWsTicket } from "../../utils/jwt.js";

export async function signup(req: Request, res: Response) {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.status(200).json(result);
}

export function createWsTicket(req: Request, res: Response) {
  const ticket = generateWsTicket({ id: req.user!.id, email: req.user!.email });
  res.json({ ticket });
}
