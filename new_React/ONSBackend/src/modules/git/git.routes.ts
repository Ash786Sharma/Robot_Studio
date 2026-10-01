import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  commit,
  createBranch,
  deleteBranch,
  discardPath,
  getLog,
  getStatus,
  listBranches,
  resetHard,
  stagePaths,
  switchBranch,
  unstagePaths,
} from "./git.controller.js";
import {
  branchNameBodySchema,
  commitBodySchema,
  createBranchBodySchema,
  discardBodySchema,
  pathsBodySchema,
  projectIdParamsSchema,
} from "./git.validators.js";

export const gitRoutes = Router({ mergeParams: true });

gitRoutes.use(requireAuth);
gitRoutes.use(validate({ params: projectIdParamsSchema }));

/**
 * @openapi
 * /api/projects/{projectId}/git/status:
 *   get:
 *     summary: Real git status (staged + unstaged changes) for a project
 *     tags: [Git]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Current branch and changes }
 */
gitRoutes.get("/status", getStatus);

gitRoutes.post("/stage", validate({ body: pathsBodySchema }), stagePaths);
gitRoutes.post("/unstage", validate({ body: pathsBodySchema }), unstagePaths);
gitRoutes.post("/discard", validate({ body: discardBodySchema }), discardPath);

/**
 * @openapi
 * /api/projects/{projectId}/git/commit:
 *   post:
 *     summary: Commit currently staged changes
 *     tags: [Git]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Committed }
 */
gitRoutes.post("/commit", validate({ body: commitBodySchema }), commit);

gitRoutes.get("/log", getLog);

gitRoutes.get("/branches", listBranches);
gitRoutes.post("/branches", validate({ body: createBranchBodySchema }), createBranch);
gitRoutes.post("/branches/switch", validate({ body: branchNameBodySchema }), switchBranch);
gitRoutes.post("/branches/delete", validate({ body: branchNameBodySchema }), deleteBranch);

gitRoutes.post("/reset-hard", resetHard);
