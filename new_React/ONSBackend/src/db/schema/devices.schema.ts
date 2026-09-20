import { pgTable, uuid, varchar, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { projects } from "./projects.schema.js";
import { fileNodes } from "./files.schema.js";

export const deviceKind = pgEnum("device_kind", ["robot", "plc", "hmi"]);

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: deviceKind("kind").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    // Root "device folder" node for this device in the file tree, e.g. the
    // "robot folder" / "plc folder" / "hmi folder" node under Connected Devices.
    rootFileNodeId: uuid("root_file_node_id").references(() => fileNodes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // v1: at most one device per kind per project; lift this once multi-device
    // per kind is supported.
    unique("devices_project_id_kind_unique").on(table.projectId, table.kind),
  ],
);

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
