import type { Request, Response } from "express";
import { projectsService } from "./projects.service.js";
import { param } from "../../utils/params.js";

export async function createProject(req: Request, res: Response) {
  const project = await projectsService.create(req.user!.id, req.body);
  res.status(201).json(project);
}

export async function listProjects(req: Request, res: Response) {
  const projectsList = await projectsService.list(req.user!.id);
  res.json(projectsList);
}

export async function getProject(req: Request, res: Response) {
  const project = await projectsService.getById(param(req, "id"), req.user!.id);
  res.json(project);
}
