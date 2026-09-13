import { projectsRepository } from "./projects.repository.js";
import { NotFoundError } from "../../errors/AppError.js";
import type { CreateProjectInput } from "./projects.validators.js";

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
};
