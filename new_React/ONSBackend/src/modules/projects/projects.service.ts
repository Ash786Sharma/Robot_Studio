import { projectsRepository } from "./projects.repository.js";
import { NotFoundError } from "../../errors/AppError.js";
import type { CreateProjectInput } from "./projects.validators.js";
import { filesRepository } from "../files/files.repository.js";
import { localStorage } from "../../storage/localStorage.provider.js";

export const projectsService = {
  create(ownerId: string, input: CreateProjectInput) {
    return projectsRepository.create({
      ownerId,
      name: input.name,
      robotModel: input.robotModel,
    });
  },

  list(ownerId: string) {
    return projectsRepository.listByOwner(ownerId);
  },

  async getById(id: string, ownerId: string) {
    const project = await projectsRepository.findById(id);
    if (!project || project.ownerId !== ownerId) throw new NotFoundError("Project not found");
    return project;
  },

  async remove(id: string, ownerId: string) {
    const project = await projectsService.getById(id, ownerId);
    const nodes = await filesRepository.listByProject(project.id);
    await Promise.all(nodes.filter((node) => node.storageKey).map((node) => localStorage.delete(node.storageKey!)));
    await projectsRepository.remove(project.id);
  },
};
