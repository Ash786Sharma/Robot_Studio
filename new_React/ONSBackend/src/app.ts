import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { projectsRoutes } from "./modules/projects/projects.routes.js";
import { filesRoutes } from "./modules/files/files.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

// In dev, the frontend can be reached via localhost on any port (Vite falls back
// to another port if 5173 is taken) or via a forwarded Codespaces/devcontainer
// URL, neither of which is a single fixed origin — allow both in addition to the
// explicit configured origin. Production only ever gets the exact configured origin.
const devOriginPatterns =
  env.NODE_ENV === "production"
    ? []
    : [/^https?:\/\/localhost:\d+$/, /\.app\.github\.dev$/, /\.github\.dev$/];

function isAllowedOrigin(origin: string): boolean {
  return origin === env.CORS_ORIGIN || devOriginPatterns.some((pattern) => pattern.test(origin));
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "ONS backend is running" });
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/projects/:projectId/files", filesRoutes);
  app.use("/api/projects", projectsRoutes);

  const swaggerSpec = swaggerJsDoc({
    definition: {
      openapi: "3.0.0",
      info: { title: "ONS Backend API", version: "1.0.0" },
      servers: [{ url: `http://localhost:${env.PORT}` }],
    },
    apis: ["./src/modules/**/*.routes.ts"],
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(errorMiddleware);

  return app;
}
