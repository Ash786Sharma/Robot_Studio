import type { Request, Response } from "express";
import { filesService } from "./files.service.js";
import { fileSyncGateway } from "../../ws/fileSync.gateway.js";
import { param } from "../../utils/params.js";

export async function getFileTree(req: Request, res: Response) {
  const tree = await filesService.getTree(param(req, "projectId"));
  res.json(tree);
}

export async function createFileNode(req: Request, res: Response) {
  const projectId = param(req, "projectId");
  const node = await filesService.createNode(projectId, req.body);
  fileSyncGateway.broadcast(projectId, { type: "file:create", payload: node });
  res.status(201).json(node);
}

export async function getFileContent(req: Request, res: Response) {
  const content = await filesService.readContent(param(req, "projectId"), param(req, "fileId"));
  res.json({ content });
}

export async function updateFileContent(req: Request, res: Response) {
  const projectId = param(req, "projectId");
  const fileId = param(req, "fileId");
  const node = await filesService.writeContent(projectId, fileId, req.body.content);
  fileSyncGateway.broadcast(projectId, { type: "file:update", payload: node });
  res.json(node);
}

export async function renameFileNode(req: Request, res: Response) {
  const projectId = param(req, "projectId");
  const fileId = param(req, "fileId");
  const node = await filesService.rename(projectId, fileId, req.body.name);
  fileSyncGateway.broadcast(projectId, { type: "file:rename", payload: node });
  res.json(node);
}

export async function deleteFileNode(req: Request, res: Response) {
  const projectId = param(req, "projectId");
  const fileId = param(req, "fileId");
  await filesService.remove(projectId, fileId);
  fileSyncGateway.broadcast(projectId, { type: "file:delete", payload: { id: fileId } });
  res.status(204).send();
}
