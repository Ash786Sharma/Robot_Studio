import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { robotLibraryEntries, type NewRobotLibraryEntry } from "../../db/schema/robotLibrary.schema.js";

export const robotLibraryRepository = {
  async create(data: NewRobotLibraryEntry) {
    const rows = await db.insert(robotLibraryEntries).values(data).returning();
    return rows[0];
  },

  async listByOwner(ownerId: string) {
    return db
      .select()
      .from(robotLibraryEntries)
      .where(eq(robotLibraryEntries.ownerId, ownerId))
      .orderBy(desc(robotLibraryEntries.createdAt));
  },

  async findById(id: string) {
    const rows = await db.select().from(robotLibraryEntries).where(eq(robotLibraryEntries.id, id)).limit(1);
    return rows[0];
  },

  async remove(id: string) {
    await db.delete(robotLibraryEntries).where(eq(robotLibraryEntries.id, id));
  },
};
