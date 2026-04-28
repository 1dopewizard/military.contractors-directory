/**
 * @file Admin schema
 * @description Admin activity logs and recruiter access
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const adminActivityLog = sqliteTable(
  "admin_activity_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adminId: text("adminId")
      .notNull()
      .references(() => user.id),
    action: text("action").notNull(),
    entityType: text("entityType").notNull(),
    entityId: text("entityId"),
    details: text("details", { mode: "json" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("admin_log_admin_idx").on(table.adminId),
    index("admin_log_action_idx").on(table.action),
    index("admin_log_entity_idx").on(table.entityType, table.entityId),
  ],
);

