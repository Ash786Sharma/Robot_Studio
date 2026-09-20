import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createProject, deleteProject, getProject, listProjects } from "./projects.controller.js";
import { createProjectSchema, projectIdParamsSchema } from "./projects.validators.js";

export const projectsRoutes = Router();

projectsRoutes.use(requireAuth);

/**
 * @openapi
 * /api/projects:
 *   post:
 *     summary: Create a project
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201: { description: Project created }
 *   get:
 *     summary: List projects owned by the current user
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of project summaries }
 */
projectsRoutes.post("/", validate({ body: createProjectSchema }), createProject);
projectsRoutes.get("/", listProjects);

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     summary: Get a project by id
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Project summary }
 *       404: { description: Project not found }
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Project deleted }
 *       404: { description: Project not found }
 */
projectsRoutes.get("/:id", validate({ params: projectIdParamsSchema }), getProject);
projectsRoutes.delete("/:id", validate({ params: projectIdParamsSchema }), deleteProject);
