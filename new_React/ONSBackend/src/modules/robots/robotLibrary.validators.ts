import { z } from "zod";

export const robotLibraryIdParamsSchema = z.object({ id: z.string().uuid() });

export const createRobotLibraryEntrySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export type CreateRobotLibraryEntryInput = z.infer<typeof createRobotLibraryEntrySchema>;
