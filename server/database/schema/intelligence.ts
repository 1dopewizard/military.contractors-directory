/**
 * @file Public contractor intelligence schema
 * @description USAspending/SAM-oriented entities for awards, recipients, agencies, categories, and intelligence cache
 */

import { relations } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { contractor } from "./directory";

export const recipientEntity = sqliteTable(
  "recipientEntity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contractorId: text("contractorId").references(() => contractor.id, {
      onDelete: "set null",
    }),
    recipientName: text("recipientName").notNull(),
    normalizedName: text("normalizedName").notNull(),
    uei: text("uei"),
    cageCode: text("cageCode"),
    aliases: text("aliases", { mode: "json" }).$type<string[]>(),
    source: text("source").default("usaspending"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    contractorIdx: index("recipientEntity_contractor_idx").on(
      table.contractorId,
    ),
    normalizedNameIdx: index("recipientEntity_normalized_name_idx").on(
      table.normalizedName,
    ),
    ueiIdx: uniqueIndex("recipientEntity_uei_idx").on(table.uei),
  }),
);

export const agency = sqliteTable(
  "agency",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    toptierCode: text("toptierCode").notNull().unique(),
    name: text("name").notNull(),
    abbreviation: text("abbreviation"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    nameIdx: index("agency_name_idx").on(table.name),
  }),
);

export const naicsCode = sqliteTable("naicsCode", {
  code: text("code").primaryKey(),
  title: text("title").notNull(),
  sector: text("sector"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pscCode = sqliteTable("pscCode", {
  code: text("code").primaryKey(),
  title: text("title").notNull(),
  productOrService: text("productOrService"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const award = sqliteTable(
  "award",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    awardId: text("awardId").notNull().unique(),
    generatedAwardId: text("generatedAwardId"),
    piid: text("piid"),
    recipientEntityId: text("recipientEntityId")
      .notNull()
      .references(() => recipientEntity.id, { onDelete: "cascade" }),
    recipientName: text("recipientName"),
    recipientUei: text("recipientUei"),
    awardingAgencyId: text("awardingAgencyId").references(() => agency.id),
    fundingAgencyId: text("fundingAgencyId").references(() => agency.id),
    awardingSubAgencyName: text("awardingSubAgencyName"),
    fundingSubAgencyName: text("fundingSubAgencyName"),
    naicsCode: text("naicsCode").references(() => naicsCode.code),
    pscCode: text("pscCode").references(() => pscCode.code),
    fiscalYear: integer("fiscalYear").notNull(),
    description: text("description"),
    baseObligation: real("baseObligation").notNull().default(0),
    totalObligation: real("totalObligation").notNull().default(0),
    awardType: text("awardType"),
    placeOfPerformanceState: text("placeOfPerformanceState"),
    placeOfPerformanceCountry: text("placeOfPerformanceCountry"),
    periodStartDate: integer("periodStartDate", { mode: "timestamp" }),
    periodEndDate: integer("periodEndDate", { mode: "timestamp" }),
    sourceUrl: text("sourceUrl"),
    sourceApi: text("sourceApi").default("usaspending"),
    cachedAt: integer("cachedAt", { mode: "timestamp" }),
    raw: text("raw", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    recipientIdx: index("award_recipient_idx").on(table.recipientEntityId),
    fiscalYearIdx: index("award_fiscal_year_idx").on(table.fiscalYear),
    agencyIdx: index("award_awarding_agency_idx").on(table.awardingAgencyId),
    naicsIdx: index("award_naics_idx").on(table.naicsCode),
    pscIdx: index("award_psc_idx").on(table.pscCode),
  }),
);

export const awardTransaction = sqliteTable(
  "awardTransaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    awardId: text("awardId")
      .notNull()
      .references(() => award.id, { onDelete: "cascade" }),
    transactionId: text("transactionId").notNull().unique(),
    fiscalYear: integer("fiscalYear").notNull(),
    actionDate: integer("actionDate", { mode: "timestamp" }),
    actionType: text("actionType"),
    obligation: real("obligation").notNull().default(0),
    description: text("description"),
    sourceUrl: text("sourceUrl"),
    raw: text("raw", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    awardIdx: index("awardTransaction_award_idx").on(table.awardId),
    fiscalYearIdx: index("awardTransaction_fiscal_year_idx").on(
      table.fiscalYear,
    ),
  }),
);

export const explorerQueryCache = sqliteTable(
  "explorerQueryCache",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    query: text("query").notNull(),
    normalizedQuery: text("normalizedQuery"),
    queryHash: text("queryHash").notNull().unique(),
    plan: text("plan", { mode: "json" }).$type<Record<string, unknown>>(),
    result: text("result", { mode: "json" }).$type<Record<string, unknown>>(),
    modelAnswer: text("modelAnswer"),
    sourceMetadata: text("sourceMetadata", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    cacheStatus: text("cacheStatus").default("live"),
    refreshedAt: integer("refreshedAt", { mode: "timestamp" }).notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    queryHashIdx: uniqueIndex("explorerQueryCache_query_hash_idx").on(
      table.queryHash,
    ),
    refreshedAtIdx: index("explorerQueryCache_refreshed_at_idx").on(
      table.refreshedAt,
    ),
  }),
);

export const recipientEntityRelations = relations(
  recipientEntity,
  ({ one, many }) => ({
    contractor: one(contractor, {
      fields: [recipientEntity.contractorId],
      references: [contractor.id],
    }),
    awards: many(award),
  }),
);

export const awardRelations = relations(award, ({ one, many }) => ({
  recipient: one(recipientEntity, {
    fields: [award.recipientEntityId],
    references: [recipientEntity.id],
  }),
  awardingAgency: one(agency, {
    fields: [award.awardingAgencyId],
    references: [agency.id],
  }),
  fundingAgency: one(agency, {
    fields: [award.fundingAgencyId],
    references: [agency.id],
  }),
  naics: one(naicsCode, {
    fields: [award.naicsCode],
    references: [naicsCode.code],
  }),
  psc: one(pscCode, {
    fields: [award.pscCode],
    references: [pscCode.code],
  }),
  transactions: many(awardTransaction),
}));

export const awardTransactionRelations = relations(
  awardTransaction,
  ({ one }) => ({
    award: one(award, {
      fields: [awardTransaction.awardId],
      references: [award.id],
    }),
  }),
);

export type RecipientEntity = typeof recipientEntity.$inferSelect;
export type NewRecipientEntity = typeof recipientEntity.$inferInsert;
export type Agency = typeof agency.$inferSelect;
export type NewAgency = typeof agency.$inferInsert;
export type NaicsCode = typeof naicsCode.$inferSelect;
export type NewNaicsCode = typeof naicsCode.$inferInsert;
export type PscCode = typeof pscCode.$inferSelect;
export type NewPscCode = typeof pscCode.$inferInsert;
export type Award = typeof award.$inferSelect;
export type NewAward = typeof award.$inferInsert;
export type AwardTransaction = typeof awardTransaction.$inferSelect;
export type NewAwardTransaction = typeof awardTransaction.$inferInsert;
export type ExplorerQueryCache = typeof explorerQueryCache.$inferSelect;
export type NewExplorerQueryCache = typeof explorerQueryCache.$inferInsert;
