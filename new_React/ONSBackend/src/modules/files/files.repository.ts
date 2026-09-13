import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { fileNodes, type NewFileNode } from "../../db/schema/files.schema.js";

export const filesRepository = {
  async listByProject(projectId: string) {
    return db.select().from(fileNodes).where(eq(fileNodes.projectId, projectId));
  },

  async create(data: NewFileNode) {
    const rows = await db.insert(fileNodes).values(data).returning();
    return rows[0];
  },

  async findById(projectId: string, fileId: string) {
    const rows = await db
      .select()
      .from(fileNodes)
      .where(and(eq(fileNodes.projectId, projectId), eq(fileNodes.id, fileId)))
      .limit(1);
    return rows[0];
  },

  async rename(projectId: string, fileId: string, name: string) {
    const rows = await db
      .update(fileNodes)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(fileNodes.projectId, projectId), eq(fileNodes.id, fileId)))
      .returning();
    return rows[0];
  },

  async remove(projectId: string, fileId: string) {
    await db.delete(fileNodes).where(and(eq(fileNodes.projectId, projectId), eq(fileNodes.id, fileId)));
  },
};
