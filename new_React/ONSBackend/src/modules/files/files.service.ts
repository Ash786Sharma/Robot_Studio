import { randomUUID } from "crypto";
import { filesRepository } from "./files.repository.js";
import { localStorage } from "../../storage/localStorage.provider.js";
import { NotFoundError } from "../../errors/AppError.js";
import type { CreateFileNodeInput } from "./files.validators.js";
import type { FileNode } from "../../db/schema/files.schema.js";

interface FileTreeNode extends FileNode {
  children: FileTreeNode[];
}

function buildTree(nodes: FileNode[]): FileTreeNode[] {
  const byId = new Map<string, FileTreeNode>(nodes.map((node) => [node.id, { ...node, children: [] }]));
  const roots: FileTreeNode[] = [];

  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export const filesService = {
  async getTree(projectId: string) {
    const nodes = await filesRepository.listByProject(projectId);
    return buildTree(nodes);
  },

  async createNode(projectId: string, input: CreateFileNodeInput) {
    const storageKey = input.kind === "file" ? `${projectId}/${randomUUID()}` : undefined;

    const node = await filesRepository.create({
      projectId,
      parentId: input.parentId,
      name: input.name,
      kind: input.kind,
      fileType: input.fileType,
      storageKey,
    });

    if (storageKey) await localStorage.write(storageKey, "");
    return node;
  },

  async readContent(projectId: string, fileId: string) {
    const node = await filesRepository.findById(projectId, fileId);
    if (!node || node.kind !== "file" || !node.storageKey) throw new NotFoundError("File not found");
    const buffer = await localStorage.read(node.storageKey);
    return buffer.toString("utf-8");
  },

  async writeContent(projectId: string, fileId: string, content: string) {
    const node = await filesRepository.findById(projectId, fileId);
    if (!node || node.kind !== "file" || !node.storageKey) throw new NotFoundError("File not found");
    await localStorage.write(node.storageKey, content);
    return node;
  },

  async rename(projectId: string, fileId: string, name: string) {
    const node = await filesRepository.rename(projectId, fileId, name);
    if (!node) throw new NotFoundError("File not found");
    return node;
  },

  async remove(projectId: string, fileId: string) {
    const node = await filesRepository.findById(projectId, fileId);
    if (!node) throw new NotFoundError("File not found");
    if (node.storageKey) await localStorage.delete(node.storageKey);
    await filesRepository.remove(projectId, fileId);
  },
};
