// One-off fixup: replaces any deeply-nested Kinematic Chain link/joint nodes
// (from the earlier nested-folder scaffolding) with a flat, traversal-ordered
// list under the same Kinematic Chain folder. Safe to re-run.
import { eq } from "drizzle-orm";
import { db, pool } from "../db/client.js";
import { devices } from "../db/schema/devices.schema.js";
import { fileNodes } from "../db/schema/files.schema.js";
import { filesRepository } from "../modules/files/files.repository.js";
import { localStorage } from "../storageLib/localStorage.provider.js";
import { ordSchema } from "../modules/robots/ord.schema.js";
import { buildKinematicChainNodes } from "../modules/devices/devices.service.js";

async function deleteSubtreeContents(projectId: string, rootId: string) {
  const allNodes = await db.select().from(fileNodes).where(eq(fileNodes.projectId, projectId));
  const childrenByParent = new Map<string, typeof allNodes>();
  for (const node of allNodes) {
    if (!node.parentId) continue;
    if (!childrenByParent.has(node.parentId)) childrenByParent.set(node.parentId, []);
    childrenByParent.get(node.parentId)!.push(node);
  }

  const toDelete: typeof allNodes = [];
  const stack = [...(childrenByParent.get(rootId) ?? [])];
  while (stack.length > 0) {
    const node = stack.pop()!;
    toDelete.push(node);
    stack.push(...(childrenByParent.get(node.id) ?? []));
  }

  for (const node of toDelete) {
    if (node.storageKey) await localStorage.delete(node.storageKey);
    await filesRepository.remove(projectId, node.id);
  }
}

async function main() {
  const robotDevices = await db.select().from(devices).where(eq(devices.kind, "robot"));

  for (const device of robotDevices) {
    if (!device.rootFileNodeId) continue;

    const nodes = await db.select().from(fileNodes).where(eq(fileNodes.projectId, device.projectId));
    const kinematicChain = nodes.find(
      (n) => n.parentId === device.rootFileNodeId && n.fileType === "robot layer folder",
    );
    const ordFileNode = nodes.find((n) => n.parentId === device.rootFileNodeId && n.fileType === "ord");
    if (!kinematicChain || !ordFileNode?.storageKey) continue;

    await deleteSubtreeContents(device.projectId, kinematicChain.id);

    const buffer = await localStorage.read(ordFileNode.storageKey);
    const ord = ordSchema.parse(JSON.parse(buffer.toString("utf-8")));
    await buildKinematicChainNodes(device.projectId, kinematicChain.id, ord);
    console.log(`Flattened Kinematic Chain for "${device.name}" (${device.id})`);
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    return pool.end().finally(() => process.exit(1));
  });
