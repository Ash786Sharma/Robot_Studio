import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { env } from "../../config/env.js";
import { localStorage } from "../../storageLib/localStorage.provider.js";
import { filesRepository } from "../files/files.repository.js";
import type { FileNode } from "../../db/schema/files.schema.js";

/** Bookkeeping file committed alongside real content so a `git checkout` carries our DB-only
 *  metadata (id/fileType) with it — plain git has no concept of either. */
export const META_FILE = ".ons-meta.json";

export interface MirrorMetaEntry {
  id: string;
  kind: "folder" | "file";
  fileType: string | null;
}

export type MirrorMeta = Record<string, MirrorMetaEntry>;

export function mirrorRootFor(projectId: string): string {
  return path.resolve(env.GIT_WORKDIR_ROOT, projectId);
}

/** Wipes a project's entire git mirror (real working tree + `.git` history) — called when the project itself is deleted. */
export async function removeMirror(projectId: string): Promise<void> {
  await fs.rm(mirrorRootFor(projectId), { force: true, recursive: true });
}

interface PathedNode extends FileNode {
  relPath: string;
}

/** Computes each node's real relative path by walking its parent chain; disambiguates same-name siblings defensively. */
function resolvePaths(nodes: FileNode[]): PathedNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const pathCache = new Map<string, string>();
  const seenAtLevel = new Map<string, Set<string>>();

  function pathFor(node: FileNode): string {
    const cached = pathCache.get(node.id);
    if (cached) return cached;

    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    const parentPath = parent ? pathFor(parent) : "";
    const levelKey = parent ? parent.id : "__root__";

    let segment = node.name;
    const seen = seenAtLevel.get(levelKey) ?? new Set<string>();
    if (seen.has(segment)) segment = `${segment}__${node.id.slice(0, 8)}`;
    seen.add(segment);
    seenAtLevel.set(levelKey, seen);

    const full = parentPath ? `${parentPath}/${segment}` : segment;
    pathCache.set(node.id, full);
    return full;
  }

  return nodes.map((node) => ({ ...node, relPath: pathFor(node) }));
}

async function clearMirrorContents(mirrorRoot: string) {
  const entries = await fs.readdir(mirrorRoot, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.name === ".git") continue;
    await fs.rm(path.join(mirrorRoot, entry.name), { force: true, recursive: true });
  }
}

/** Rewrites the mirror working directory from scratch to match the project's current DB file tree. */
export async function syncDbToMirror(projectId: string): Promise<string> {
  const mirrorRoot = mirrorRootFor(projectId);
  await fs.mkdir(mirrorRoot, { recursive: true });
  await clearMirrorContents(mirrorRoot);

  const nodes = await filesRepository.listByProject(projectId);
  const pathed = resolvePaths(nodes).sort((a, b) => a.relPath.split("/").length - b.relPath.split("/").length);

  const meta: MirrorMeta = {};

  for (const node of pathed) {
    const targetPath = path.join(mirrorRoot, node.relPath);
    if (node.kind === "folder") {
      await fs.mkdir(targetPath, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      const content = node.storageKey ? await localStorage.read(node.storageKey).catch(() => Buffer.from("")) : Buffer.from("");
      await fs.writeFile(targetPath, content);
    }
    meta[node.relPath] = { id: node.id, kind: node.kind, fileType: node.fileType ?? null };
  }

  await writeMirrorMeta(mirrorRoot, meta);
  return mirrorRoot;
}

export async function readMirrorMeta(mirrorRoot: string): Promise<MirrorMeta> {
  try {
    const raw = await fs.readFile(path.join(mirrorRoot, META_FILE), "utf-8");
    return JSON.parse(raw) as MirrorMeta;
  } catch {
    return {};
  }
}

export async function writeMirrorMeta(mirrorRoot: string, meta: MirrorMeta) {
  await fs.writeFile(path.join(mirrorRoot, META_FILE), JSON.stringify(meta, null, 2));
}

/** Recursively lists real files/folders under `dir` (mirror-relative paths), excluding `.git` and the meta file. */
async function walkMirror(mirrorRoot: string, dir = mirrorRoot): Promise<{ relPath: string; kind: "folder" | "file" }[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: { relPath: string; kind: "folder" | "file" }[] = [];

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === META_FILE) continue;
    const abs = path.join(dir, entry.name);
    const relPath = path.relative(mirrorRoot, abs).split(path.sep).join("/");
    if (entry.isDirectory()) {
      results.push({ relPath, kind: "folder" });
      results.push(...(await walkMirror(mirrorRoot, abs)));
    } else {
      results.push({ relPath, kind: "file" });
    }
  }

  return results;
}

/** Replaces the project's entire file_nodes tree + blobs with whatever is actually on disk in the mirror (post checkout/reset). */
export async function syncMirrorToDb(projectId: string): Promise<void> {
  const mirrorRoot = mirrorRootFor(projectId);
  const meta = await readMirrorMeta(mirrorRoot);
  const entries = await walkMirror(mirrorRoot);
  entries.sort((a, b) => a.relPath.split("/").length - b.relPath.split("/").length);

  const oldNodes = await filesRepository.listByProject(projectId);
  for (const node of oldNodes) {
    if (node.storageKey) await localStorage.delete(node.storageKey).catch(() => undefined);
  }
  await filesRepository.removeAllForProject(projectId);

  const idByRelPath = new Map<string, string>();

  for (const entry of entries) {
    const known = meta[entry.relPath];
    const id = known?.id ?? randomUUID();
    idByRelPath.set(entry.relPath, id);

    const segments = entry.relPath.split("/");
    const parentRelPath = segments.slice(0, -1).join("/");
    const parentId = parentRelPath ? idByRelPath.get(parentRelPath) ?? null : null;
    const name = segments[segments.length - 1];

    if (entry.kind === "folder") {
      await filesRepository.create({
        id,
        projectId,
        parentId,
        name,
        kind: "folder",
        fileType: known?.fileType ?? undefined,
      });
    } else {
      const storageKey = `${projectId}/${randomUUID()}`;
      const content = await fs.readFile(path.join(mirrorRoot, entry.relPath));
      await localStorage.write(storageKey, content);
      await filesRepository.create({
        id,
        projectId,
        parentId,
        name,
        kind: "file",
        fileType: known?.fileType ?? undefined,
        storageKey,
      });
    }
  }
}
