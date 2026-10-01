import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  STORAGE_ROOT: z.string().default("./storage"),
  GIT_WORKDIR_ROOT: z.string().default("./git-workdir"),
});

export const env = envSchema.parse(process.env);
