import { promises as fs } from "fs";
import path from "path";
import { env } from "../config/env.js";
import type { StorageProvider } from "./storage.interface.js";

const root = path.resolve(env.STORAGE_ROOT);

// Storage keys are always server-generated (project id + uuid), never derived from
// client-supplied names, but we still verify the resolved path stays under `root`
// as defense in depth against path traversal.
function resolveSafePath(key: string): string {
  const target = path.resolve(root, key);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error("Invalid storage key: path traversal detected");
  }
  return target;
}

export const localStorage: StorageProvider = {
  async write(key, content) {
    const filePath = resolveSafePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  },
  async read(key) {
    return fs.readFile(resolveSafePath(key));
  },
  async delete(key) {
    await fs.rm(resolveSafePath(key), { force: true });
  },
  async exists(key) {
    try {
      await fs.access(resolveSafePath(key));
      return true;
    } catch {
      return false;
    }
  },
};
