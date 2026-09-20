import type { Request, Response } from "express";
import { robotLibraryService, type CreateRobotLibraryEntryFiles } from "./robotLibrary.service.js";
import { createRobotLibraryEntrySchema } from "./robotLibrary.validators.js";
import { param } from "../../utils/params.js";
import { ValidationError } from "../../errors/AppError.js";

type MulterFile = Express.Multer.File;

function pickFiles(req: Request): CreateRobotLibraryEntryFiles {
  const files = (req.files as Record<string, MulterFile[]> | undefined) ?? {};
  return {
    ordFile: files.ord?.[0],
    urdfFile: files.urdf?.[0],
    meshFiles: files.meshes,
  };
}

export async function createRobotLibraryEntry(req: Request, res: Response) {
  const input = createRobotLibraryEntrySchema.parse({ name: req.body.name, description: req.body.description });
  const files = pickFiles(req);
  if (!files.ordFile && !files.urdfFile) {
    throw new ValidationError("Upload either an 'ord' file or a 'urdf' file (with 'meshes')");
  }
  const entry = await robotLibraryService.create(req.user!.id, input, files);
  res.status(201).json(entry);
}

export async function listRobotLibraryEntries(req: Request, res: Response) {
  const entries = await robotLibraryService.list(req.user!.id);
  res.json(entries);
}

export async function getRobotLibraryEntry(req: Request, res: Response) {
  const entry = await robotLibraryService.getById(param(req, "id"), req.user!.id);
  res.json(entry);
}

export async function deleteRobotLibraryEntry(req: Request, res: Response) {
  await robotLibraryService.remove(param(req, "id"), req.user!.id);
  res.status(204).send();
}
