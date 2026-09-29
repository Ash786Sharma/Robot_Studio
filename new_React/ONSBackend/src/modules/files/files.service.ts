import { randomUUID } from "crypto";
import { filesRepository } from "./files.repository.js";
import { localStorage } from "../../storageLib/localStorage.provider.js";
import { NotFoundError } from "../../errors/AppError.js";
import { ordSchema } from "../robots/ord.schema.js";
import { synthesizeKinematicChainNodes } from "../robots/kinematicChainTree.js";
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

/** Replaces each robot device's Kinematic Chain folder contents with nodes derived live from its .ord — never persisted. */
async function attachKinematicChains(projectId: string, roots: FileTreeNode[]) {
  for (const root of roots) {
    if (root.fileType !== "robot folder") continue;
    const kinematicChain = root.children.find((child) => child.fileType === "robot layer folder");
    const ordNode = root.children.find((child) => child.fileType === "ord");
    if (!kinematicChain || !ordNode?.storageKey) continue;

    try {
      const buffer = await localStorage.read(ordNode.storageKey);
      const ord = ordSchema.parse(JSON.parse(buffer.toString("utf-8")));
      kinematicChain.children = synthesizeKinematicChainNodes(projectId, kinematicChain.id, ord) as FileTreeNode[];
    } catch {
      // Missing/corrupt .ord — leave the Kinematic Chain folder empty rather than failing the whole tree.
    }
  }
}

/** Recursively deletes a file_nodes subtree (and its storage bytes), root inclusive. */
export async function removeSubtree(projectId: string, rootId: string) {
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

export const filesService = {
  async getTree(projectId: string) {
    const nodes = await filesRepository.listByProject(projectId);
    const tree = buildTree(nodes);
    await attachKinematicChains(projectId, tree);
    return tree;
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
    // Folders may have nested subfolders/files — delete the whole subtree,
    // not just this row, so nothing is orphaned in the DB or on disk.
    await removeSubtree(projectId, fileId);
  },
};
