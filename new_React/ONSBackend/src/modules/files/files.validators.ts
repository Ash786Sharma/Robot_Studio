import { z } from "zod";

export const projectIdParamsSchema = z.object({ projectId: z.string().uuid() });

export const fileIdParamsSchema = z.object({
  projectId: z.string().uuid(),
  fileId: z.string().uuid(),
});

export const createFileNodeSchema = z.object({
  name: z.string().min(1).max(255),
  kind: z.enum(["folder", "file"]),
  fileType: z.string().max(50).optional(),
  parentId: z.string().uuid().optional(),
});

export const updateFileContentSchema = z.object({
  content: z.string(),
});

export const renameFileNodeSchema = z.object({
  name: z.string().min(1).max(255),
});

export type CreateFileNodeInput = z.infer<typeof createFileNodeSchema>;
