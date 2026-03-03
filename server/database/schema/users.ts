/**
 * @file User profile and preferences schema
 * @description User profiles, preferences, saved jobs, etc.
 * @note Legacy MOS-related tables (userMosPreference, viewedMos) removed.
 *       Profile mosCode field kept as text for user preference storage.
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { job } from "./jobs";

export const profile = sqliteTable(
  "profile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    branch: text("branch"), // army, navy, air_force, marine_corps, coast_guard, space_force
    mosCode: text("mosCode"), // Legacy: kept as text for user preference
    clearanceLevel: text("clearanceLevel"),
    yearsExperience: integer("yearsExperience"),
    preferredLocations: text("preferredLocations", { mode: "json" }).$type<
      string[]
    >(),
    preferredTheaters: text("preferredTheaters", { mode: "json" }).$type<
      string[]
    >(),
    openToOconus: integer("openToOconus", { mode: "boolean" }),
    desiredSalaryMin: integer("desiredSalaryMin"),
    desiredSalaryMax: integer("desiredSalaryMax"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("profile_user_idx").on(table.userId)],
);

export const savedJob = sqliteTable(
  "saved_job",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    jobId: text("jobId")
      .notNull()
      .references(() => job.id, { onDelete: "cascade" }),
    notes: text("notes"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("saved_job_user_idx").on(table.userId),
    index("saved_job_job_idx").on(table.jobId),
    index("saved_job_unique_idx").on(table.userId, table.jobId),
  ],
);
