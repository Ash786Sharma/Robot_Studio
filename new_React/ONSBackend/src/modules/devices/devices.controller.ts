import type { Request, Response } from "express";
import { devicesService } from "./devices.service.js";
import { createDeviceSchema } from "./devices.validators.js";
import { param } from "../../utils/params.js";

type MulterFile = Express.Multer.File;

function pickFiles(req: Request) {
  const files = (req.files as Record<string, MulterFile[]> | undefined) ?? {};
  return {
    ordFile: files.ord?.[0],
    urdfFile: files.urdf?.[0],
    meshFiles: files.meshes,
  };
}

export async function createDevice(req: Request, res: Response) {
  const projectId = param(req, "projectId");
  const input = createDeviceSchema.parse({
    kind: req.body.kind,
    name: req.body.name,
    libraryEntryId: req.body.libraryEntryId || undefined,
  });
  const device = await devicesService.create(projectId, req.user!.id, input, pickFiles(req));
  res.status(201).json(device);
}

export async function listDevices(req: Request, res: Response) {
  const devices = await devicesService.list(param(req, "projectId"));
  res.json(devices);
}

export async function deleteDevice(req: Request, res: Response) {
  await devicesService.remove(param(req, "projectId"), param(req, "deviceId"));
  res.status(204).send();
}
