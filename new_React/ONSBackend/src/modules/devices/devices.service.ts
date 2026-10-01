import { devicesRepository } from "./devices.repository.js";
import { deviceScaffoldService } from "./deviceScaffold.service.js";
import { removeSubtree, filesService } from "../files/files.service.js";
import { filesRepository } from "../files/files.repository.js";
import { localStorage } from "../../storageLib/localStorage.provider.js";
import { ConflictError, NotFoundError, ValidationError } from "../../errors/AppError.js";
import { resolveOrdFromUpload, type OrdUploadFiles } from "../robots/ordUpload.helper.js";
import { robotLibraryService } from "../robots/robotLibrary.service.js";
import { ordSchema, type OrdDocument } from "../robots/ord.schema.js";
import type { CreateDeviceInput } from "./devices.validators.js";

/**
 * Attaches an .ord-derived robot description to a freshly scaffolded device
 * tree. The Kinematic Chain folder is deliberately left empty here —
 * `filesService.getTree` synthesizes its link/joint nodes live from this
 * .ord on every read, so it's never persisted as file_nodes.
 */
async function attachRobotDescription(
  projectId: string,
  ownerId: string,
  tree: { root: { id: string } },
  deviceName: string,
  files: OrdUploadFiles,
  libraryEntryId?: string,
) {
  const storagePrefix = `${projectId}/devices/${tree.root.id}`;

  // Cloning from the robot library references its mesh/source files directly
  // instead of duplicating them into this project's storage — the library
  // entry already holds the canonical copy, so relocating them here would
  // just be wasted disk space. (Trade-off: editing/removing the library
  // entry later can affect projects that reference it this way.)
  const ord = libraryEntryId
    ? await robotLibraryService.getOrdDocument(libraryEntryId, ownerId)
    : await resolveOrdFromUpload(storagePrefix, files);

  // Mesh bytes and the source file already live in storage (either freshly
  // written above for an upload, or referenced from the library) and are
  // tracked via the .ord's `meshes`/`source` fields — no separate file_nodes
  // are created for them; the .ord below is the canonical file the rest of
  // the app reads.
  await deviceScaffoldService.createNode(projectId, tree.root.id, {
    name: `${deviceName}.ord`,
    kind: "file",
    fileType: "ord",
    content: JSON.stringify(ord, null, 2),
  });
}

export const devicesService = {
  async list(projectId: string) {
    return devicesRepository.listByProject(projectId);
  },

  async create(projectId: string, ownerId: string, input: CreateDeviceInput, files: OrdUploadFiles) {
    const existing = await devicesRepository.findByProjectAndKind(projectId, input.kind);
    if (existing) {
      throw new ConflictError(`Project already has a ${input.kind} device (multiple ${input.kind}s per project aren't supported yet)`);
    }

    let rootFileNodeId: string;
    if (input.kind === "robot") {
      const tree = await deviceScaffoldService.buildRobotTree(projectId, input.name);
      await attachRobotDescription(projectId, ownerId, tree, input.name, files, input.libraryEntryId);
      rootFileNodeId = tree.root.id;
    } else if (input.kind === "plc") {
      rootFileNodeId = (await deviceScaffoldService.buildPlcTree(projectId, input.name)).root.id;
    } else {
      rootFileNodeId = (await deviceScaffoldService.buildHmiTree(projectId, input.name)).root.id;
    }

    return devicesRepository.create({
      projectId,
      kind: input.kind,
      name: input.name,
      rootFileNodeId,
    });
  },

  async remove(projectId: string, deviceId: string) {
    const device = await devicesRepository.findById(projectId, deviceId);
    if (!device) throw new NotFoundError("Device not found");

    if (device.rootFileNodeId) {
      await removeSubtree(projectId, device.rootFileNodeId);
    }
    await devicesRepository.remove(projectId, deviceId);
  },

  /** Locates the `.ord` file node directly under a robot device's root (see `attachRobotDescription`). */
  async findOrdNode(projectId: string, deviceId: string) {
    const device = await devicesRepository.findById(projectId, deviceId);
    if (!device || device.kind !== "robot" || !device.rootFileNodeId) {
      throw new NotFoundError("Robot device not found");
    }
    const nodes = await filesRepository.listByProject(projectId);
    const ordNode = nodes.find((node) => node.parentId === device.rootFileNodeId && node.fileType === "ord");
    if (!ordNode) throw new NotFoundError("This device has no .ord description yet");
    return ordNode;
  },

  async getOrdDocument(projectId: string, deviceId: string): Promise<OrdDocument> {
    const ordNode = await devicesService.findOrdNode(projectId, deviceId);
    const content = await filesService.readContent(projectId, ordNode.id);
    return ordSchema.parse(JSON.parse(content));
  },

  async updateOrdDocument(projectId: string, deviceId: string, ord: unknown): Promise<OrdDocument> {
    const ordNode = await devicesService.findOrdNode(projectId, deviceId);
    const parsed = ordSchema.parse(ord);
    await filesService.writeContent(projectId, ordNode.id, JSON.stringify(parsed, null, 2));
    return parsed;
  },

  /** Streams a mesh referenced by an .ord document — `storageKey` must belong to this project,
   *  or be a robot-library asset (library entries are shared/cloned-by-reference across projects). */
  async readMeshBuffer(projectId: string, storageKey: string): Promise<Buffer> {
    const isOwnProjectKey = storageKey.startsWith(`${projectId}/`);
    const isLibraryKey = storageKey.startsWith("robot-library/");
    if (!isOwnProjectKey && !isLibraryKey) {
      throw new ValidationError("Mesh key does not belong to this project");
    }
    if (!(await localStorage.exists(storageKey))) throw new NotFoundError("Mesh file not found");
    return localStorage.read(storageKey);
  },
};
