import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  robotModel: z.string().max(100).optional(),
});

export const projectIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
