import { Router } from "express";
import { createWsTicket, login, signup } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { loginSchema, signupSchema } from "./auth.validators.js";

export const authRoutes = Router();

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: User created, returns a JWT and the public user record }
 *       409: { description: Email already in use }
 */
authRoutes.post("/signup", validate({ body: signupSchema }), signup);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Returns a JWT and the public user record }
 *       401: { description: Invalid email or password }
 */
authRoutes.post("/login", validate({ body: loginSchema }), login);

/**
 * @openapi
 * /api/auth/ws-ticket:
 *   get:
 *     summary: Exchange the current JWT for a short-lived WebSocket ticket
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Returns a single-use ticket for the /ws/files upgrade }
 *       401: { description: Missing or invalid bearer token }
 */
authRoutes.get("/ws-ticket", requireAuth, createWsTicket);
