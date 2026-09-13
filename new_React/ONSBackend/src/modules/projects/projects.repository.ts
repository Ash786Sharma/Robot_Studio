import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { projects, type NewProject } from "../../db/schema/projects.schema.js";

export const projectsRepository = {
  async create(data: NewProject) {
    const rows = await db.insert(projects).values(data).returning();
    return rows[0];
  },

  async listByOwner(ownerId: string) {
    return db.select().from(projects).where(eq(projects.ownerId, ownerId));
  },

  async findById(id: string) {
    const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return rows[0];
  },
};
