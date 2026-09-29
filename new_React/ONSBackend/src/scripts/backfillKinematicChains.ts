// One-off backfill: populates the Kinematic Chain folder for robot devices
// created before nested link/joint scaffolding existed. Safe to re-run —
// skips any Kinematic Chain folder that already has children.
import { eq } from "drizzle-orm";
import { db, pool } from "../db/client.js";
import { devices } from "../db/schema/devices.schema.js";
import { fileNodes } from "../db/schema/files.schema.js";
import { localStorage } from "../storageLib/localStorage.provider.js";
import { ordSchema } from "../modules/robots/ord.schema.js";
import { buildKinematicChainNodes } from "../modules/devices/devices.service.js";

async function main() {
  const robotDevices = await db.select().from(devices).where(eq(devices.kind, "robot"));

  for (const device of robotDevices) {
    if (!device.rootFileNodeId) continue;

    const nodes = await db.select().from(fileNodes).where(eq(fileNodes.projectId, device.projectId));
    const kinematicChain = nodes.find(
      (n) => n.parentId === device.rootFileNodeId && n.fileType === "robot layer folder",
    );
    if (!kinematicChain) continue;

    const alreadyPopulated = nodes.some((n) => n.parentId === kinematicChain.id);
    if (alreadyPopulated) {
      console.log(`Skipping "${device.name}" (${device.id}) — Kinematic Chain already populated`);
      continue;
    }

    const ordFileNode = nodes.find((n) => n.parentId === device.rootFileNodeId && n.fileType === "ord");
    if (!ordFileNode?.storageKey) {
      console.log(`Skipping "${device.name}" (${device.id}) — no .ord file found`);
      continue;
    }

    const buffer = await localStorage.read(ordFileNode.storageKey);
    const ord = ordSchema.parse(JSON.parse(buffer.toString("utf-8")));
    await buildKinematicChainNodes(device.projectId, kinematicChain.id, ord);
    console.log(`Backfilled Kinematic Chain for "${device.name}" (${device.id})`);
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    return pool.end().finally(() => process.exit(1));
  });
