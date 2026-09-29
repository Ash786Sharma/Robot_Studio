// One-off fixup: removes the Visual Model / Collision Model folders (and
// their file_node rows) from existing robot devices — the Kinematic Chain's
// link/joint nodes now stand in for them (viewer highlights via the .ord's
// mesh references, not via a parallel folder tree). Does NOT touch storage
// bytes: the mesh files are still referenced by the .ord document. Safe to re-run.
import { eq } from "drizzle-orm";
import { db, pool } from "../db/client.js";
import { devices } from "../db/schema/devices.schema.js";
import { fileNodes } from "../db/schema/files.schema.js";
import { filesRepository } from "../modules/files/files.repository.js";

async function removeSubtree(projectId: string, rootId: string) {
  const allNodes = await db.select().from(fileNodes).where(eq(fileNodes.projectId, projectId));
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

  // Deepest-first so parent rows aren't removed before their children.
  for (const node of toDelete.reverse()) {
    await filesRepository.remove(projectId, node.id);
  }
}

async function main() {
  const robotDevices = await db.select().from(devices).where(eq(devices.kind, "robot"));

  for (const device of robotDevices) {
    if (!device.rootFileNodeId) continue;

    const nodes = await db.select().from(fileNodes).where(eq(fileNodes.projectId, device.projectId));
    const staleFolders = nodes.filter(
      (n) =>
        n.parentId === device.rootFileNodeId &&
        (n.fileType === "visual model folder" || n.fileType === "collision model folder"),
    );

    if (staleFolders.length === 0) {
      console.log(`Skipping "${device.name}" (${device.id}) — no Visual/Collision Model folders`);
      continue;
    }

    for (const folder of staleFolders) {
      await removeSubtree(device.projectId, folder.id);
    }
    console.log(`Removed Visual/Collision Model folders for "${device.name}" (${device.id})`);
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    return pool.end().finally(() => process.exit(1));
  });
