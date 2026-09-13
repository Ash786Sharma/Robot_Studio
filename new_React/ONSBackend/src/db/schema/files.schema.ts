import { pgTable, uuid, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { projects } from "./projects.schema.js";

export const fileNodeKind = pgEnum("file_node_kind", ["folder", "file"]);

export const fileNodes = pgTable("file_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  // Self-referencing tree pointer; left without a FK constraint to avoid
  // drizzle's circular-type workaround, ordering is enforced in the repository.
  parentId: uuid("parent_id"),
  name: varchar("name", { length: 255 }).notNull(),
  kind: fileNodeKind("kind").notNull(),
  fileType: varchar("file_type", { length: 50 }),
  storageKey: varchar("storage_key", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type FileNode = typeof fileNodes.$inferSelect;
export type NewFileNode = typeof fileNodes.$inferInsert;
