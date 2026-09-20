import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createFileNode,
  deleteFileNode,
  getFileContent,
  getFileTree,
  renameFileNode,
  updateFileContent,
} from "./files.controller.js";
import {
  createFileNodeSchema,
  fileIdParamsSchema,
  projectIdParamsSchema,
  renameFileNodeSchema,
  updateFileContentSchema,
} from "./files.validators.js";

export const filesRoutes = Router({ mergeParams: true });

filesRoutes.use(requireAuth);

/**
 * @openapi
 * /api/projects/{projectId}/files:
 *   get:
 *     summary: Get the file tree for a project
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Array of file nodes }
 *   post:
 *     summary: Create a file or folder node
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: File node created }
 */
filesRoutes.get("/", validate({ params: projectIdParamsSchema }), getFileTree);
filesRoutes.post("/", validate({ params: projectIdParamsSchema, body: createFileNodeSchema }), createFileNode);

/**
 * @openapi
 * /api/projects/{projectId}/files/{fileId}/content:
 *   get:
 *     summary: Get file content
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *       - { name: fileId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: File content }
 *   put:
 *     summary: Replace file content
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *       - { name: fileId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: File updated }
 */
filesRoutes.get("/:fileId/content", validate({ params: fileIdParamsSchema }), getFileContent);
filesRoutes.put(
  "/:fileId/content",
  validate({ params: fileIdParamsSchema, body: updateFileContentSchema }),
  updateFileContent,
);

/**
 * @openapi
 * /api/projects/{projectId}/files/{fileId}:
 *   patch:
 *     summary: Rename a file or folder node
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *       - { name: fileId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: File node renamed }
 *   delete:
 *     summary: Delete a file or folder node
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *       - { name: fileId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: File node deleted }
 */
filesRoutes.patch("/:fileId", validate({ params: fileIdParamsSchema, body: renameFileNodeSchema }), renameFileNode);
filesRoutes.delete("/:fileId", validate({ params: fileIdParamsSchema }), deleteFileNode);
