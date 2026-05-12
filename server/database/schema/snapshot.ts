/**
 * @file Contractor snapshot schema
 * @description USAspending recipient snapshots for the verified intelligence data layer
 */

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const contractorSnapshotRun = sqliteTable(
  "contractorSnapshotRun",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    status: text("status", {
      enum: ["running", "completed", "failed", "partial"],
    })
      .notNull()
      .default("running"),
    windowStart: integer("windowStart", { mode: "timestamp" }).notNull(),
    windowEnd: integer("windowEnd", { mode: "timestamp" }).notNull(),
    startedAt: integer("startedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    completedAt: integer("completedAt", { mode: "timestamp" }),
    pageCount: integer("pageCount").notNull().default(0),
    rowCount: integer("rowCount").notNull().default(0),
    error: text("error"),
    sourceMetadata: text("sourceMetadata", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    statusIdx: index("contractorSnapshotRun_status_idx").on(table.status),
    completedAtIdx: index("contractorSnapshotRun_completed_at_idx").on(
      table.completedAt,
    ),
  }),
);

export const contractorSnapshot = sqliteTable(
  "contractorSnapshot",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    runId: text("runId").references(() => contractorSnapshotRun.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    recipientName: text("recipientName").notNull(),
    normalizedName: text("normalizedName").notNull(),
    recipientUei: text("recipientUei"),
    recipientCode: text("recipientCode"),
    totalObligations36m: real("totalObligations36m").notNull().default(0),
    awardCount36m: integer("awardCount36m").notNull().default(0),
    lastAwardDate: integer("lastAwardDate", { mode: "timestamp" }),
    topAwardingAgency: text("topAwardingAgency"),
    topAwardingSubagency: text("topAwardingSubagency"),
    topNaicsCode: text("topNaicsCode"),
    topNaicsTitle: text("topNaicsTitle"),
    topPscCode: text("topPscCode"),
    topPscTitle: text("topPscTitle"),
    sourceUrl: text("sourceUrl").notNull(),
    sourceMetadata: text("sourceMetadata", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    rawAggregate: text("rawAggregate", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    snapshotWindowStart: integer("snapshotWindowStart", {
      mode: "timestamp",
    }).notNull(),
    snapshotWindowEnd: integer("snapshotWindowEnd", {
      mode: "timestamp",
    }).notNull(),
    refreshedAt: integer("refreshedAt", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    slugIdx: uniqueIndex("contractorSnapshot_slug_idx").on(table.slug),
    recipientCodeIdx: index("contractorSnapshot_recipient_code_idx").on(
      table.recipientCode,
    ),
    normalizedNameIdx: index("contractorSnapshot_normalized_name_idx").on(
      table.normalizedName,
    ),
    obligationsIdx: index("contractorSnapshot_obligations_idx").on(
      table.totalObligations36m,
    ),
    agencyIdx: index("contractorSnapshot_agency_idx").on(
      table.topAwardingAgency,
    ),
    naicsIdx: index("contractorSnapshot_naics_idx").on(table.topNaicsCode),
    pscIdx: index("contractorSnapshot_psc_idx").on(table.topPscCode),
    refreshedAtIdx: index("contractorSnapshot_refreshed_at_idx").on(
      table.refreshedAt,
    ),
  }),
);

export const contractorDirectoryGroup = sqliteTable(
  "contractorDirectoryGroup",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    canonicalName: text("canonicalName").notNull(),
    normalizedName: text("normalizedName").notNull(),
    primarySnapshotId: text("primarySnapshotId").references(
      () => contractorSnapshot.id,
      { onDelete: "set null" },
    ),
    primaryRecipientUei: text("primaryRecipientUei"),
    primaryRecipientCode: text("primaryRecipientCode"),
    totalObligations36m: real("totalObligations36m").notNull().default(0),
    awardCount36m: integer("awardCount36m").notNull().default(0),
    lastAwardDate: integer("lastAwardDate", { mode: "timestamp" }),
    topAwardingAgency: text("topAwardingAgency"),
    topAwardingSubagency: text("topAwardingSubagency"),
    topNaicsCode: text("topNaicsCode"),
    topNaicsTitle: text("topNaicsTitle"),
    topPscCode: text("topPscCode"),
    topPscTitle: text("topPscTitle"),
    sourceUrl: text("sourceUrl").notNull(),
    sourceMetadata: text("sourceMetadata", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    aliasCount: integer("aliasCount").notNull().default(1),
    snapshotWindowStart: integer("snapshotWindowStart", {
      mode: "timestamp",
    }).notNull(),
    snapshotWindowEnd: integer("snapshotWindowEnd", {
      mode: "timestamp",
    }).notNull(),
    refreshedAt: integer("refreshedAt", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    slugIdx: uniqueIndex("contractorDirectoryGroup_slug_idx").on(table.slug),
    normalizedNameIdx: index("contractorDirectoryGroup_normalized_name_idx").on(
      table.normalizedName,
    ),
    primarySnapshotIdx: index(
      "contractorDirectoryGroup_primary_snapshot_idx",
    ).on(table.primarySnapshotId),
    obligationsIdx: index("contractorDirectoryGroup_obligations_idx").on(
      table.totalObligations36m,
    ),
    agencyIdx: index("contractorDirectoryGroup_agency_idx").on(
      table.topAwardingAgency,
    ),
    naicsIdx: index("contractorDirectoryGroup_naics_idx").on(
      table.topNaicsCode,
    ),
    pscIdx: index("contractorDirectoryGroup_psc_idx").on(table.topPscCode),
    refreshedAtIdx: index("contractorDirectoryGroup_refreshed_at_idx").on(
      table.refreshedAt,
    ),
  }),
);

export const contractorDirectoryAlias = sqliteTable(
  "contractorDirectoryAlias",
  {
    id: text("id").primaryKey(),
    groupId: text("groupId")
      .notNull()
      .references(() => contractorDirectoryGroup.id, { onDelete: "cascade" }),
    snapshotId: text("snapshotId")
      .notNull()
      .references(() => contractorSnapshot.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    recipientName: text("recipientName").notNull(),
    normalizedName: text("normalizedName").notNull(),
    recipientUei: text("recipientUei"),
    recipientCode: text("recipientCode"),
    totalObligations36m: real("totalObligations36m").notNull().default(0),
    awardCount36m: integer("awardCount36m").notNull().default(0),
    lastAwardDate: integer("lastAwardDate", { mode: "timestamp" }),
    sourceUrl: text("sourceUrl").notNull(),
    isCanonical: integer("isCanonical", { mode: "boolean" })
      .notNull()
      .default(false),
    matchReason: text("matchReason", {
      enum: [
        "single_snapshot",
        "shared_identifier",
        "shared_name",
        "curated_alias",
      ],
    })
      .notNull()
      .default("single_snapshot"),
    matchKey: text("matchKey").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    slugIdx: uniqueIndex("contractorDirectoryAlias_slug_idx").on(table.slug),
    snapshotIdx: uniqueIndex("contractorDirectoryAlias_snapshot_idx").on(
      table.snapshotId,
    ),
    canonicalGroupIdx: uniqueIndex(
      "contractorDirectoryAlias_canonical_group_idx",
    )
      .on(table.groupId)
      .where(sql`${table.isCanonical} = 1`),
    groupIdx: index("contractorDirectoryAlias_group_idx").on(table.groupId),
    normalizedNameIdx: index("contractorDirectoryAlias_normalized_name_idx").on(
      table.normalizedName,
    ),
    recipientUeiIdx: index("contractorDirectoryAlias_uei_idx").on(
      table.recipientUei,
    ),
    recipientCodeIdx: index("contractorDirectoryAlias_code_idx").on(
      table.recipientCode,
    ),
  }),
);

export type ContractorSnapshotRun = typeof contractorSnapshotRun.$inferSelect;
export type NewContractorSnapshotRun =
  typeof contractorSnapshotRun.$inferInsert;
export type ContractorSnapshot = typeof contractorSnapshot.$inferSelect;
export type NewContractorSnapshot = typeof contractorSnapshot.$inferInsert;
export type ContractorDirectoryGroup =
  typeof contractorDirectoryGroup.$inferSelect;
export type NewContractorDirectoryGroup =
  typeof contractorDirectoryGroup.$inferInsert;
export type ContractorDirectoryAlias =
  typeof contractorDirectoryAlias.$inferSelect;
export type NewContractorDirectoryAlias =
  typeof contractorDirectoryAlias.$inferInsert;
