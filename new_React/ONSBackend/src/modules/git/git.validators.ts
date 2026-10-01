import { z } from "zod";

export const projectIdParamsSchema = z.object({ projectId: z.string().uuid() });

export const branchNameBodySchema = z.object({
  name: z.string().min(1).max(120),
  force: z.boolean().optional(),
});

export const pathsBodySchema = z.object({
  paths: z.array(z.string().min(1)).min(1),
});

export const discardBodySchema = z.object({
  path: z.string().min(1),
});

export const commitBodySchema = z.object({
  message: z.string().min(1).max(1000),
});

export const createBranchBodySchema = z.object({
  name: z.string().min(1).max(120),
});
