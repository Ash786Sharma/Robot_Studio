import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env.js";
import * as usersSchema from "./schema/users.schema.js";
import * as projectsSchema from "./schema/projects.schema.js";
import * as filesSchema from "./schema/files.schema.js";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, {
  schema: { ...usersSchema, ...projectsSchema, ...filesSchema },
});
