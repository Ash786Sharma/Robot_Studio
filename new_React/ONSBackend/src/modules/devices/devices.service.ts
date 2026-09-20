import { devicesRepository } from "./devices.repository.js";
import { deviceScaffoldService } from "./deviceScaffold.service.js";
import { filesRepository } from "../files/files.repository.js";
import { localStorage } from "../../storage/localStorage.provider.js";
import { ConflictError, NotFoundError } from "../../errors/AppError.js";
import { resolveOrdFromUpload, type OrdUploadFiles } from "../robots/ordUpload.helper.js";
import { robotLibraryService } from "../robots/robotLibrary.service.js";
import type { OrdDocument } from "../robots/ord.schema.js";
import type { CreateDeviceInput } from "./devices.validators.js";

async function copyStorageFile(oldKey: string, newPrefix: string): Promise<string> {
  const buffer = await localStorage.read(oldKey);
  const filename = oldKey.split("/").pop()!;
  const newKey = `${newPrefix}/${filename}`;
  await localStorage.write(newKey, buffer);
  return newKey;
}

/** Deep-copies every mesh/source byte an .ord references into `storagePrefix`. */
async function relocateOrdFiles(ord: OrdDocument, storagePrefix: string): Promise<OrdDocument> {
  const visual = await Promise.all(
    ord.meshes.visual.map(async (mesh) => ({ ...mesh, storageKey: await copyStorageFile(mesh.storageKey, `${storagePrefix}/meshes`) })),
  );
  const collision = await Promise.all(
    ord.meshes.collision.map(async (mesh) => ({ ...mesh, storageKey: await copyStorageFile(mesh.storageKey, `${storagePrefix}/meshes`) })),
  );
  const source = { ...ord.source, storageKey: await copyStorageFile(ord.source.storageKey, storagePrefix) };
  return { ...ord, source, meshes: { visual, collision } };
}

async function attachRobotDescription(
  projectId: string,
  ownerId: string,
  tree: { root: { id: string }; visualModel: { id: string }; collisionModel: { id: string } },
  deviceName: string,
  files: OrdUploadFiles,
  libraryEntryId?: string,
) {
  const storagePrefix = `${projectId}/devices/${tree.root.id}`;

  const ord = libraryEntryId
    ? await relocateOrdFiles(await robotLibraryService.getOrdDocument(libraryEntryId, ownerId), storagePrefix)
    : await resolveOrdFromUpload(storagePrefix, files);

  for (const mesh of ord.meshes.visual) {
    await deviceScaffoldService.attachExistingFile(projectId, tree.visualModel.id, mesh.storageKey.split("/").pop()!, mesh.fileType, mesh.storageKey);
  }
  for (const mesh of ord.meshes.collision) {
    await deviceScaffoldService.attachExistingFile(projectId, tree.collisionModel.id, mesh.storageKey.split("/").pop()!, mesh.fileType, mesh.storageKey);
  }
  await deviceScaffoldService.attachExistingFile(
    projectId,
    tree.root.id,
    ord.source.storageKey.split("/").pop()!,
    ord.source.format,
    ord.source.storageKey,
  );
  await deviceScaffoldService.createNode(projectId, tree.root.id, {
    name: `${deviceName}.ord`,
    kind: "file",
    fileType: "ord",
    content: JSON.stringify(ord, null, 2),
  });
}

/** Recursively deletes a file_nodes subtree (and its storage bytes), root inclusive. */
async function deleteFileSubtree(projectId: string, rootId: string) {
  const allNodes = await filesRepository.listByProject(projectId);
  const childrenByParent = new Map<string, typeof allNodes>();
  for (const node of allNodes) {
    if (!node.parentId) continue;
    if (!childrenByParent.has(node.parentId)) childrenByParent.set(node.parentId, []);
    childrenByParent.get(node.parentId)!.push(node);
  }

  const toDelete: typeof allNodes = [];
  const stack = [rootId];
  while (stack.length > 0) {
    const currentId = stack.pop()!;
    const node = allNodes.find((n) => n.id === currentId);
    if (node) toDelete.push(node);
    for (const child of childrenByParent.get(currentId) ?? []) stack.push(child.id);
  }

  for (const node of toDelete) {
    if (node.storageKey) await localStorage.delete(node.storageKey);
    await filesRepository.remove(projectId, node.id);
  }
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
      await deleteFileSubtree(projectId, device.rootFileNodeId);
    }
    await devicesRepository.remove(projectId, deviceId);
  },
};
