import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createDevice, deleteDevice, listDevices } from "./devices.controller.js";
import { deviceIdParamsSchema } from "./devices.validators.js";
import { projectIdParamsSchema } from "../files/files.validators.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 50 } });

export const devicesRoutes = Router({ mergeParams: true });

devicesRoutes.use(requireAuth);

/**
 * @openapi
 * /api/projects/{projectId}/devices:
 *   post:
 *     summary: Add a device (robot/plc/hmi) to a project, scaffolding its folder structure
 *     tags: [Devices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               kind: { type: string, enum: [robot, plc, hmi] }
 *               name: { type: string }
 *               libraryEntryId: { type: string, description: "Robot only: clone from the robot library instead of uploading files" }
 *               ord: { type: string, format: binary }
 *               urdf: { type: string, format: binary }
 *               meshes: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       201: { description: Device created }
 *       409: { description: A device of this kind already exists in the project }
 *   get:
 *     summary: List devices in a project
 *     tags: [Devices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Array of devices }
 */
devicesRoutes.post(
  "/",
  validate({ params: projectIdParamsSchema }),
  upload.fields([
    { name: "ord", maxCount: 1 },
    { name: "urdf", maxCount: 1 },
    { name: "meshes", maxCount: 50 },
  ]),
  createDevice,
);
devicesRoutes.get("/", validate({ params: projectIdParamsSchema }), listDevices);

/**
 * @openapi
 * /api/projects/{projectId}/devices/{deviceId}:
 *   delete:
 *     summary: Remove a device and its file tree
 *     tags: [Devices]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: projectId, in: path, required: true, schema: { type: string } }
 *       - { name: deviceId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Deleted }
 */
devicesRoutes.delete("/:deviceId", validate({ params: deviceIdParamsSchema }), deleteDevice);
