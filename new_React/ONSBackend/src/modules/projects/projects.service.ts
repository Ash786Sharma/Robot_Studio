import { projectsRepository } from "./projects.repository.js";
import { NotFoundError } from "../../errors/AppError.js";
import type { CreateProjectInput } from "./projects.validators.js";
import { localStorage } from "../../storageLib/localStorage.provider.js";

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
    // Every storage key any file_node/device ever wrote is prefixed with the
    // project id, so deleting that whole prefix cleans up everything in one
    // shot — including anything an incomplete per-row cleanup missed.
    await localStorage.delete(project.id);
    await projectsRepository.remove(project.id);
  },
};
