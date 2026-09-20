import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { devices, type NewDevice } from "../../db/schema/devices.schema.js";

export const devicesRepository = {
  async create(data: NewDevice) {
    const rows = await db.insert(devices).values(data).returning();
    return rows[0];
  },

  async listByProject(projectId: string) {
    return db.select().from(devices).where(eq(devices.projectId, projectId));
  },

  async findByProjectAndKind(projectId: string, kind: NewDevice["kind"]) {
    const rows = await db
      .select()
      .from(devices)
      .where(and(eq(devices.projectId, projectId), eq(devices.kind, kind)))
      .limit(1);
    return rows[0];
  },

  async findById(projectId: string, deviceId: string) {
    const rows = await db
      .select()
      .from(devices)
      .where(and(eq(devices.projectId, projectId), eq(devices.id, deviceId)))
      .limit(1);
    return rows[0];
  },

  async remove(projectId: string, deviceId: string) {
    await db.delete(devices).where(and(eq(devices.projectId, projectId), eq(devices.id, deviceId)));
  },
};
