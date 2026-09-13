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
filesRoutes.get("/", validate({ params: projectIdParamsSchema }), getFileTree);
filesRoutes.post("/", validate({ params: projectIdParamsSchema, body: createFileNodeSchema }), createFileNode);
filesRoutes.get("/:fileId/content", validate({ params: fileIdParamsSchema }), getFileContent);
filesRoutes.put(
  "/:fileId/content",
  validate({ params: fileIdParamsSchema, body: updateFileContentSchema }),
  updateFileContent,
);
filesRoutes.patch("/:fileId", validate({ params: fileIdParamsSchema, body: renameFileNodeSchema }), renameFileNode);
filesRoutes.delete("/:fileId", validate({ params: fileIdParamsSchema }), deleteFileNode);
