import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";

// Reusable, project-independent catalog of robot descriptions ("bring your own
// robot" library) — replaces the legacy Mongo/GridFS Robot_Models collections.
export const robotLibraryEntries = pgTable("robot_library_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  // Storage key of the canonical .ord (ONS Robot Description) JSON document.
  ordStorageKey: varchar("ord_storage_key", { length: 500 }).notNull(),
  jointCount: integer("joint_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type RobotLibraryEntry = typeof robotLibraryEntries.$inferSelect;
export type NewRobotLibraryEntry = typeof robotLibraryEntries.$inferInsert;
