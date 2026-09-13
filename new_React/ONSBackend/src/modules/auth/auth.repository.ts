import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users, type NewUser } from "../../db/schema/users.schema.js";

export const authRepository = {
  async findByEmail(email: string) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0];
  },

  async create(data: NewUser) {
    const rows = await db.insert(users).values(data).returning();
    return rows[0];
  },
};
