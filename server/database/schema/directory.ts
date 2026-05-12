/**
 * @file Directory schema tables
 * @description Defense contractor directory - contractors, specialties, locations
 */

import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

/**
 * Contractor table - Core company data
 */
export const contractor = sqliteTable("contractor", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"), // 2-3 paragraph company overview
  defenseNewsRank: integer("defenseNewsRank"), // 2025 rank (1-100)
  country: text("country"), // from Top 100 list
  headquarters: text("headquarters"), // city, state/country
  founded: integer("founded"), // year
  employeeCount: text("employeeCount"), // approximate headcount (e.g., "45,000")
  website: text("website"),
  linkedinUrl: text("linkedinUrl"),
  wikipediaUrl: text("wikipediaUrl"),
  stockTicker: text("stockTicker"), // if public (e.g., "LMT")
  isPublic: integer("isPublic", { mode: "boolean" }).default(false),
  totalRevenue: real("totalRevenue"), // 2024 total revenue (in billions)
  defenseRevenue: real("defenseRevenue"), // 2024 defense revenue (in billions)
  defenseRevenuePercent: real("defenseRevenuePercent"), // percentage (e.g., 95.5)
  logoUrl: text("logoUrl"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * Specialty table - Taxonomy for classifying contractors
 */
export const specialty = sqliteTable("specialty", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // Icon identifier (e.g., for Iconify)
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * ContractorSpecialty table - Many-to-many relationship between contractors and specialties
 */
export const contractorSpecialty = sqliteTable("contractorSpecialty", {
  contractorId: text("contractorId")
    .notNull()
    .references(() => contractor.id, { onDelete: "cascade" }),
  specialtyId: text("specialtyId")
    .notNull()
    .references(() => specialty.id, { onDelete: "cascade" }),
  isPrimary: integer("isPrimary", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * ContractorLocation table - Office locations for contractors
 */
export const contractorLocation = sqliteTable("contractorLocation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  contractorId: text("contractorId")
    .notNull()
    .references(() => contractor.id, { onDelete: "cascade" }),
  city: text("city"),
  state: text("state"),
  country: text("country").notNull(),
  isHeadquarters: integer("isHeadquarters", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const profileClaim = sqliteTable(
  "profileClaim",
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
    submitterName: text("submitterName"),
    companyRole: text("companyRole"),
    evidenceUrl: text("evidenceUrl"),
    requestedContext: text("requestedContext", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    status: text("status", {
      enum: ["pending", "approved", "rejected", "needs_more_info"],
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
    index("profileClaim_slug_idx").on(table.contractorSlug),
    index("profileClaim_user_idx").on(table.submitterUserId),
    index("profileClaim_status_idx").on(table.status),
  ],
);

// Relations
export const contractorRelations = relations(contractor, ({ many }) => ({
  specialties: many(contractorSpecialty),
  locations: many(contractorLocation),
}));

export const specialtyRelations = relations(specialty, ({ many }) => ({
  contractors: many(contractorSpecialty),
}));

export const contractorSpecialtyRelations = relations(
  contractorSpecialty,
  ({ one }) => ({
    contractor: one(contractor, {
      fields: [contractorSpecialty.contractorId],
      references: [contractor.id],
    }),
    specialty: one(specialty, {
      fields: [contractorSpecialty.specialtyId],
      references: [specialty.id],
    }),
  }),
);

export const contractorLocationRelations = relations(
  contractorLocation,
  ({ one }) => ({
    contractor: one(contractor, {
      fields: [contractorLocation.contractorId],
      references: [contractor.id],
    }),
  }),
);

export const profileClaimRelations = relations(profileClaim, ({ one }) => ({
  contractor: one(contractor, {
    fields: [profileClaim.contractorId],
    references: [contractor.id],
  }),
  submitter: one(user, {
    fields: [profileClaim.submitterUserId],
    references: [user.id],
  }),
}));
