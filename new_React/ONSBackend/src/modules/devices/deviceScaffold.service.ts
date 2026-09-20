import { randomUUID } from "crypto";
import { filesRepository } from "../files/files.repository.js";
import { localStorage } from "../../storage/localStorage.provider.js";
import type { FileNode } from "../../db/schema/files.schema.js";

interface ScaffoldNodeInput {
  name: string;
  kind: "folder" | "file";
  fileType?: string;
  content?: string | Buffer;
}

async function createNode(projectId: string, parentId: string | null, input: ScaffoldNodeInput): Promise<FileNode> {
  const storageKey = input.kind === "file" ? `${projectId}/${randomUUID()}` : undefined;
  const node = await filesRepository.create({
    projectId,
    parentId: parentId ?? undefined,
    name: input.name,
    kind: input.kind,
    fileType: input.fileType,
    storageKey,
  });
  if (storageKey) await localStorage.write(storageKey, input.content ?? "");
  return node;
}

/** Registers a file that was already written to `storageKey` (e.g. an imported mesh). */
async function attachExistingFile(
  projectId: string,
  parentId: string,
  name: string,
  fileType: string,
  storageKey: string,
): Promise<FileNode> {
  return filesRepository.create({ projectId, parentId, name, kind: "file", fileType, storageKey });
}


/** Folder-only subtree per device kind, matching new_React/ONS/src/mocks/mockTreeData.json. */
async function buildRobotTree(projectId: string, name: string) {
  const root = await createNode(projectId, null, { name, kind: "folder", fileType: "robot folder" });
  const kinematicChain = await createNode(projectId, root.id, {
    name: "Kinematic Chain",
    kind: "folder",
    fileType: "robot layer folder",
  });
  const visualModel = await createNode(projectId, root.id, {
    name: "Visual Model",
    kind: "folder",
    fileType: "visual model folder",
  });
  const collisionModel = await createNode(projectId, root.id, {
    name: "Collision Model",
    kind: "folder",
    fileType: "collision model folder",
  });
  await createNode(projectId, root.id, { name: "Simulation", kind: "folder", fileType: "simulation folder" });
  await createNode(projectId, root.id, { name: "Hardware Config", kind: "file", fileType: "hardware config", content: "{}" });
  await createNode(projectId, root.id, { name: "Software Config", kind: "file", fileType: "software config", content: "{}" });
  await createNode(projectId, root.id, { name: "Programs", kind: "folder", fileType: "program folder" });
  await createNode(projectId, root.id, { name: "Safety Programs", kind: "folder", fileType: "program folder" });
  return { root, kinematicChain, visualModel, collisionModel };
}

async function buildPlcTree(projectId: string, name: string) {
  const root = await createNode(projectId, null, { name, kind: "folder", fileType: "plc folder" });
  await createNode(projectId, root.id, { name: "Hardware Config", kind: "file", fileType: "hardware config", content: "{}" });
  await createNode(projectId, root.id, { name: "Software Config", kind: "file", fileType: "software config", content: "{}" });
  await createNode(projectId, root.id, { name: "Programs", kind: "folder", fileType: "program folder" });
  await createNode(projectId, root.id, { name: "Safety Program Blocks", kind: "folder", fileType: "program folder" });
  return { root };
}

async function buildHmiTree(projectId: string, name: string) {
  const root = await createNode(projectId, null, { name, kind: "folder", fileType: "hmi folder" });
  await createNode(projectId, root.id, { name: "Software Config", kind: "file", fileType: "software config", content: "{}" });
  await createNode(projectId, root.id, { name: "Screens", kind: "folder", fileType: "Screen folder" });
  return { root };
}

export const deviceScaffoldService = {
  buildRobotTree,
  buildPlcTree,
  buildHmiTree,
  createNode,
  attachExistingFile,
};
