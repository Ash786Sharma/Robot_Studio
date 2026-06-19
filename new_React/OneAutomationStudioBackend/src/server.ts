import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import pino from "pino";
import pinoHttp from "pino-http";
import { Server } from "socket.io";

// Swagger
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

dotenv.config();

// Logger
const logger = pino({ level: "info" });

const app = express();
const server = http.createServer(app);

// ---------------- SOCKET.IO ----------------
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// ---------------- SWAGGER CONFIG ----------------

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IDE Backend API",
      version: "1.0.0",
      description: "API documentation for One Automation Studio IDE backend",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/server.ts"], // we document inside this file
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------------- MIDDLEWARE ----------------

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  pinoHttp({
    logger,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ---------------- ROUTES ----------------

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns backend status
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "IDE Backend is running 🚀",
  });
});

/**
 * @openapi
 * /api/session:
 *   get:
 *     summary: Session test endpoint
 *     description: Checks session persistence
 *     responses:
 *       200:
 *         description: Session data returned
 */
app.get("/api/session", (req: any, res) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }

  res.json({
    views: req.session.views,
  });
});

// ---------------- SOCKET EVENTS ----------------

io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on("project:join", (projectId: string) => {
    socket.join(projectId);
  });

  socket.on("file:create", (data) => {
    io.to(data.projectId).emit("file:create", data);
  });

  socket.on("file:update", (data) => {
    io.to(data.projectId).emit("file:update", data);
  });

  socket.on("file:delete", (data) => {
    io.to(data.projectId).emit("file:delete", data);
  });

  socket.on("file:rename", (data) => {
    io.to(data.projectId).emit("file:rename", data);
  });

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// ---------------- START SERVER ----------------

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  logger.info(`API Docs available at http://localhost:${PORT}/api-docs`);
});