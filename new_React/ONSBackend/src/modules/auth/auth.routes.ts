import { Router } from "express";
import { createWsTicket, login, signup } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { loginSchema, signupSchema } from "./auth.validators.js";

export const authRoutes = Router();

authRoutes.post("/signup", validate({ body: signupSchema }), signup);
authRoutes.post("/login", validate({ body: loginSchema }), login);
authRoutes.get("/ws-ticket", requireAuth, createWsTicket);
