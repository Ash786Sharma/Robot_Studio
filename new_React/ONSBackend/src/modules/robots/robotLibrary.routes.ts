import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import {
  createRobotLibraryEntry,
  deleteRobotLibraryEntry,
  getRobotLibraryEntry,
  listRobotLibraryEntries,
} from "./robotLibrary.controller.js";

// Uploads are parsed into memory then handed to StorageProvider — robot
// description bundles (URDF + meshes) are small enough (a few MB) that this
// is simpler than a temp-file dance, with a hard cap as defense in depth.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 50 } });

export const robotLibraryRoutes = Router();

robotLibraryRoutes.use(requireAuth);

/**
 * @openapi
 * /api/robot-library:
 *   post:
 *     summary: Add a robot description to the reusable library (upload an .ord, or a URDF + meshes)
 *     tags: [RobotLibrary]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               ord: { type: string, format: binary }
 *               urdf: { type: string, format: binary }
 *               meshes: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       201: { description: Robot library entry created }
 *   get:
 *     summary: List the current user's robot library entries
 *     tags: [RobotLibrary]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of robot library entries }
 */
robotLibraryRoutes.post(
  "/",
  upload.fields([
    { name: "ord", maxCount: 1 },
    { name: "urdf", maxCount: 1 },
    { name: "meshes", maxCount: 50 },
  ]),
  createRobotLibraryEntry,
);
robotLibraryRoutes.get("/", listRobotLibraryEntries);

/**
 * @openapi
 * /api/robot-library/{id}:
 *   get:
 *     summary: Get a robot library entry
 *     tags: [RobotLibrary]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Robot library entry }
 *   delete:
 *     summary: Delete a robot library entry
 *     tags: [RobotLibrary]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Deleted }
 */
robotLibraryRoutes.get("/:id", getRobotLibraryEntry);
robotLibraryRoutes.delete("/:id", deleteRobotLibraryEntry);
