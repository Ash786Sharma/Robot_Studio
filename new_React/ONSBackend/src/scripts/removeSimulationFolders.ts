// One-off fixup: removes the "Simulation" folder (and any children) from
// existing robot devices — no longer part of the robot scaffold. Safe to re-run.
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

  for (const node of toDelete.reverse()) {
    await filesRepository.remove(projectId, node.id);
  }
}

async function main() {
  const robotDevices = await db.select().from(devices).where(eq(devices.kind, "robot"));

  for (const device of robotDevices) {
    if (!device.rootFileNodeId) continue;

    const nodes = await db.select().from(fileNodes).where(eq(fileNodes.projectId, device.projectId));
    const simulationFolder = nodes.find(
      (n) => n.parentId === device.rootFileNodeId && n.fileType === "simulation folder",
    );

    if (!simulationFolder) {
      console.log(`Skipping "${device.name}" (${device.id}) — no Simulation folder`);
      continue;
    }

    await removeSubtree(device.projectId, simulationFolder.id);
    console.log(`Removed Simulation folder for "${device.name}" (${device.id})`);
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    return pool.end().finally(() => process.exit(1));
  });
