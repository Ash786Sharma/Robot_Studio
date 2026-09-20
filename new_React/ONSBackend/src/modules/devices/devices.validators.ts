import { z } from "zod";

export const deviceKindSchema = z.enum(["robot", "plc", "hmi"]);

export const deviceIdParamsSchema = z.object({
  projectId: z.string().uuid(),
  deviceId: z.string().uuid(),
});

export const createDeviceSchema = z.object({
  kind: deviceKindSchema,
  name: z.string().min(1).max(200),
  // Robot devices only: clone an existing robot-library entry instead of
  // uploading files directly.
  libraryEntryId: z.string().uuid().optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type DeviceKind = z.infer<typeof deviceKindSchema>;
