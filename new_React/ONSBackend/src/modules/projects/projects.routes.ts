import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createProject, getProject, listProjects } from "./projects.controller.js";
import { createProjectSchema, projectIdParamsSchema } from "./projects.validators.js";

export const projectsRoutes = Router();

projectsRoutes.use(requireAuth);
projectsRoutes.post("/", validate({ body: createProjectSchema }), createProject);
projectsRoutes.get("/", listProjects);
projectsRoutes.get("/:id", validate({ params: projectIdParamsSchema }), getProject);
