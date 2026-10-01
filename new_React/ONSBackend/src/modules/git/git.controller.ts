import type { Request, Response } from "express";
import { param } from "../../utils/params.js";
import { gitService } from "./git.service.js";

export async function getStatus(req: Request, res: Response) {
  const result = await gitService.getStatus(param(req, "projectId"), req.user!.id);
  res.json(result);
}

export async function stagePaths(req: Request, res: Response) {
  await gitService.stage(param(req, "projectId"), req.user!.id, req.body.paths);
  res.status(204).send();
}

export async function unstagePaths(req: Request, res: Response) {
  await gitService.unstage(param(req, "projectId"), req.user!.id, req.body.paths);
  res.status(204).send();
}

export async function discardPath(req: Request, res: Response) {
  await gitService.discardPath(param(req, "projectId"), req.user!.id, req.body.path);
  res.status(204).send();
}

export async function commit(req: Request, res: Response) {
  await gitService.commit(param(req, "projectId"), req.user!.id, req.body.message);
  res.status(204).send();
}

export async function getLog(req: Request, res: Response) {
  const commits = await gitService.getLog(param(req, "projectId"), req.user!.id);
  res.json(commits);
}

export async function listBranches(req: Request, res: Response) {
  const branches = await gitService.listBranches(param(req, "projectId"), req.user!.id);
  res.json(branches);
}

export async function createBranch(req: Request, res: Response) {
  await gitService.createBranch(param(req, "projectId"), req.user!.id, req.body.name);
  res.status(201).send();
}

export async function switchBranch(req: Request, res: Response) {
  await gitService.switchBranch(param(req, "projectId"), req.user!.id, req.body.name);
  res.status(204).send();
}

export async function deleteBranch(req: Request, res: Response) {
  await gitService.deleteBranch(param(req, "projectId"), req.user!.id, req.body.name, Boolean(req.body.force));
  res.status(204).send();
}

export async function resetHard(req: Request, res: Response) {
  await gitService.resetHard(param(req, "projectId"), req.user!.id);
  res.status(204).send();
}
