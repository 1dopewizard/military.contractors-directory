/**
 * @file CRM and leads schema
 * @description Job alerts, candidate activity, placements, employer contacts
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { contractor } from "./directory";
import { job } from "./jobs";

export const jobAlertSubscription = sqliteTable(
  "job_alert_subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    userId: text("userId").references(() => user.id, { onDelete: "cascade" }),
    keywords: text("keywords", { mode: "json" }).$type<string[]>(),
    locations: text("locations", { mode: "json" }).$type<string[]>(),
    clearanceLevels: text("clearanceLevels", { mode: "json" }).$type<
      string[]
    >(),
    mosCodes: text("mosCodes", { mode: "json" }).$type<string[]>(),
    frequency: text("frequency").default("weekly"),
    isActive: integer("isActive", { mode: "boolean" }).default(true),
    lastSentAt: integer("lastSentAt", { mode: "timestamp" }),
    unsubscribeToken: text("unsubscribeToken"),
    resumeUrl: text("resumeUrl"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("job_alert_email_idx").on(table.email),
    index("job_alert_user_idx").on(table.userId),
    index("job_alert_active_idx").on(table.isActive),
  ],
);

export const candidateActivity = sqliteTable(
  "candidate_activity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").references(() => user.id, { onDelete: "cascade" }),
    email: text("email"),
    name: text("name"),
    phone: text("phone"),
    companyName: text("companyName"),
    type: text("type").notNull(), // JOB_SUBMISSION, EXPRESS_INTEREST, etc.
    activityType: text("activityType"), // Legacy field for backward compatibility
    entityType: text("entityType"),
    entityId: text("entityId"),
    jobId: text("jobId").references(() => job.id),
    notes: text("notes"),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("candidate_activity_user_idx").on(table.userId),
    index("candidate_activity_email_idx").on(table.email),
    index("candidate_activity_type_idx").on(table.type),
    index("candidate_activity_job_idx").on(table.jobId),
  ],
);

export const placement = sqliteTable(
  "placement",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    candidateEmail: text("candidateEmail").notNull(),
    jobId: text("jobId").references(() => job.id),
    contractorId: text("contractorId").references(() => contractor.id),
    status: text("status").notNull(),
    placementDate: integer("placementDate", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("placement_candidate_idx").on(table.candidateEmail),
    index("placement_job_idx").on(table.jobId),
    index("placement_contractor_idx").on(table.contractorId),
    index("placement_status_idx").on(table.status),
  ],
);

export const contractorContact = sqliteTable(
  "contractor_contact",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contractorId: text("contractorId")
      .notNull()
      .references(() => contractor.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    title: text("title"),
    phone: text("phone"),
    isPrimary: integer("isPrimary", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("contractor_contact_contractor_idx").on(table.contractorId),
    index("contractor_contact_email_idx").on(table.email),
  ],
);

export const contractorNote = sqliteTable(
  "contractor_note",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contractorId: text("contractorId")
      .notNull()
      .references(() => contractor.id, { onDelete: "cascade" }),
    contactId: text("contactId").references(() => contractorContact.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    createdBy: text("createdBy").references(() => user.id),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("contractor_note_contractor_idx").on(table.contractorId),
    index("contractor_note_contact_idx").on(table.contactId),
  ],
);
