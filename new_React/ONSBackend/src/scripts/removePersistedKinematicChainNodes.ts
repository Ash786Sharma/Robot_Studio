// One-off cleanup: deletes previously-persisted Kinematic Chain link/joint
// file_nodes now that files.service.ts synthesizes them live from the .ord
// on every getTree() call instead. Safe to re-run.
import { eq } from "drizzle-orm";
import { db, pool } from "../db/client.js";
import { fileNodes } from "../db/schema/files.schema.js";
import { filesRepository } from "../modules/files/files.repository.js";

async function main() {
  const kinematicChains = await db
    .select()
    .from(fileNodes)
    .where(eq(fileNodes.fileType, "robot layer folder"));

  for (const kinematicChain of kinematicChains) {
    const children = await db.select().from(fileNodes).where(eq(fileNodes.parentId, kinematicChain.id));
    if (children.length === 0) {
      console.log(`Skipping "${kinematicChain.name}" (${kinematicChain.id}) — already empty`);
      continue;
    }
    for (const child of children) {
      await filesRepository.remove(child.projectId, child.id);
    }
    console.log(`Removed ${children.length} persisted node(s) from "${kinematicChain.name}" (${kinematicChain.id})`);
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    return pool.end().finally(() => process.exit(1));
  });
