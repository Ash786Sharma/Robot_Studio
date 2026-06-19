import express from "express";
import { login, signup } from "../controllers/auth.controller";

const router = express.Router();

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     summary: Register new user
 */
router.post("/signup", signup);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 */
router.post("/login", login);

export default router;