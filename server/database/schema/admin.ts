/**
 * @file Admin schema
 * @description Admin activity logs and recruiter access
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { contractor } from "./directory";

export const profileCorrection = sqliteTable(
  "profileCorrection",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contractorSlug: text("contractorSlug").notNull(),
    contractorSnapshotId: text("contractorSnapshotId"),
    contractorId: text("contractorId").references(() => contractor.id, {
      onDelete: "set null",
    }),
    submitterUserId: text("submitterUserId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    submitterEmail: text("submitterEmail").notNull(),
    targetField: text("targetField").notNull(),
    explanation: text("explanation").notNull(),
    evidenceUrl: text("evidenceUrl"),
    status: text("status", {
      enum: ["pending", "accepted", "rejected", "needs_more_info"],
    })
      .notNull()
      .default("pending"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("profileCorrection_slug_idx").on(table.contractorSlug),
    index("profileCorrection_user_idx").on(table.submitterUserId),
    index("profileCorrection_status_idx").on(table.status),
  ],
);

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
