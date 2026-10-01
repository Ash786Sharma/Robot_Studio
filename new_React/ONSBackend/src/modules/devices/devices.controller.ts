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
    collisionMeshFiles: files.collisionMeshes,
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

export async function getOrd(req: Request, res: Response) {
  const ord = await devicesService.getOrdDocument(param(req, "projectId"), param(req, "deviceId"));
  res.json(ord);
}

export async function updateOrd(req: Request, res: Response) {
  const ord = await devicesService.updateOrdDocument(param(req, "projectId"), param(req, "deviceId"), req.body);
  res.json(ord);
}

export async function getOrdMesh(req: Request, res: Response) {
  const buffer = await devicesService.readMeshBuffer(param(req, "projectId"), String(req.query.key));
  res.set("Content-Type", "application/octet-stream");
  res.send(buffer);
}
