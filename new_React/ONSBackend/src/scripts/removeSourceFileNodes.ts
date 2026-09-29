// One-off fixup: removes the source URDF/SDF file_node (e.g. "source.urdf")
// from existing robot devices — the .ord file is the canonical description;
// the original import stays in storage (referenced by ord.source) but no
// longer needs its own tree row. Does NOT touch storage bytes. Safe to re-run.
import { eq } from "drizzle-orm";
import { db, pool } from "../db/client.js";
import { devices } from "../db/schema/devices.schema.js";
import { fileNodes } from "../db/schema/files.schema.js";
import { filesRepository } from "../modules/files/files.repository.js";

const SOURCE_FILE_TYPES = new Set(["urdf", "sdf"]);

async function main() {
  const robotDevices = await db.select().from(devices).where(eq(devices.kind, "robot"));

  for (const device of robotDevices) {
    if (!device.rootFileNodeId) continue;

    const nodes = await db.select().from(fileNodes).where(eq(fileNodes.projectId, device.projectId));
    const sourceNode = nodes.find(
      (n) => n.parentId === device.rootFileNodeId && n.fileType && SOURCE_FILE_TYPES.has(n.fileType),
    );

    if (!sourceNode) {
      console.log(`Skipping "${device.name}" (${device.id}) — no source file_node`);
      continue;
    }

    await filesRepository.remove(device.projectId, sourceNode.id);
    console.log(`Removed "${sourceNode.name}" for "${device.name}" (${device.id})`);
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    return pool.end().finally(() => process.exit(1));
  });
