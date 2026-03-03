/**
 * @file Claimed profiles and sponsored content schema
 * @description Tables for company profile claiming and sponsored content management
 */

import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { contractor } from "./directory";

/**
 * Claimed profile - Links a user to a contractor they manage
 */
export const claimedProfile = sqliteTable(
  "claimedProfile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contractorId: text("contractorId")
      .notNull()
      .references(() => contractor.id, { onDelete: "cascade" })
      .unique(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tier: text("tier", { enum: ["claimed", "premium", "enterprise"] })
      .notNull()
      .default("claimed"),
    status: text("status", { enum: ["pending", "active", "suspended"] })
      .notNull()
      .default("pending"),
    verifiedAt: integer("verifiedAt", { mode: "timestamp" }),
    verificationMethod: text("verificationMethod", {
      enum: ["email_domain", "manual", "document"],
    }),
    monthlyPrice: integer("monthlyPrice"), // in cents
    billingStartedAt: integer("billingStartedAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("claimedProfile_contractor_idx").on(table.contractorId),
    index("claimedProfile_user_idx").on(table.userId),
    index("claimedProfile_status_idx").on(table.status),
  ],
);

/**
 * Contractor users - Users who can manage claimed profiles
 */
export const contractorUser = sqliteTable(
  "contractorUser",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    claimedProfileId: text("claimedProfileId")
      .notNull()
      .references(() => claimedProfile.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "admin", "editor"] })
      .notNull()
      .default("editor"),
    invitedBy: text("invitedBy").references(() => user.id),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("contractorUser_user_idx").on(table.userId),
    index("contractorUser_profile_idx").on(table.claimedProfileId),
  ],
);

/**
 * Sponsored content blocks on profile pages
 */
export const sponsoredContent = sqliteTable(
  "sponsoredContent",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    claimedProfileId: text("claimedProfileId")
      .notNull()
      .references(() => claimedProfile.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["spotlight", "why_work_here", "testimonial", "programs"],
    }).notNull(),
    status: text("status", {
      enum: ["draft", "pending_review", "approved", "rejected"],
    })
      .notNull()
      .default("draft"),
    title: text("title"),
    content: text("content"), // JSON for type-specific fields
    mediaUrl: text("mediaUrl"),
    ctaText: text("ctaText"),
    ctaUrl: text("ctaUrl"),
    reviewedBy: text("reviewedBy").references(() => user.id),
    reviewedAt: integer("reviewedAt", { mode: "timestamp" }),
    rejectionReason: text("rejectionReason"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("sponsoredContent_profile_idx").on(table.claimedProfileId),
    index("sponsoredContent_status_idx").on(table.status),
  ],
);

/**
 * "Why Work Here" benefits
 */
export const contractorBenefit = sqliteTable(
  "contractorBenefit",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    claimedProfileId: text("claimedProfileId")
      .notNull()
      .references(() => claimedProfile.id, { onDelete: "cascade" }),
    icon: text("icon").notNull(), // Iconify icon name
    title: text("title").notNull(), // 50 chars max
    description: text("description").notNull(), // 150 chars max
    sortOrder: integer("sortOrder").notNull().default(0),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("contractorBenefit_profile_idx").on(table.claimedProfileId),
  ],
);

/**
 * Notable programs/products
 */
export const contractorProgram = sqliteTable(
  "contractorProgram",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    claimedProfileId: text("claimedProfileId")
      .notNull()
      .references(() => claimedProfile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    description: text("description"), // 200 chars max
    imageUrl: text("imageUrl"),
    sortOrder: integer("sortOrder").notNull().default(0),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("contractorProgram_profile_idx").on(table.claimedProfileId),
  ],
);

/**
 * Contractor testimonials
 */
export const contractorTestimonial = sqliteTable(
  "contractorTestimonial",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    claimedProfileId: text("claimedProfileId")
      .notNull()
      .references(() => claimedProfile.id, { onDelete: "cascade" }),
    quote: text("quote").notNull(), // 300 chars max
    employeeName: text("employeeName").notNull(),
    employeeTitle: text("employeeTitle").notNull(),
    employeePhotoUrl: text("employeePhotoUrl"),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
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
    index("contractorTestimonial_profile_idx").on(table.claimedProfileId),
    index("contractorTestimonial_status_idx").on(table.status),
  ],
);

// Relations
export const claimedProfileRelations = relations(
  claimedProfile,
  ({ one, many }) => ({
    contractor: one(contractor, {
      fields: [claimedProfile.contractorId],
      references: [contractor.id],
    }),
    owner: one(user, {
      fields: [claimedProfile.userId],
      references: [user.id],
    }),
    contractorUsers: many(contractorUser),
    sponsoredContent: many(sponsoredContent),
    benefits: many(contractorBenefit),
    programs: many(contractorProgram),
    testimonials: many(contractorTestimonial),
  }),
);

export const contractorUserRelations = relations(contractorUser, ({ one }) => ({
  user: one(user, {
    fields: [contractorUser.userId],
    references: [user.id],
  }),
  claimedProfile: one(claimedProfile, {
    fields: [contractorUser.claimedProfileId],
    references: [claimedProfile.id],
  }),
  inviter: one(user, {
    fields: [contractorUser.invitedBy],
    references: [user.id],
  }),
}));

export const sponsoredContentRelations = relations(
  sponsoredContent,
  ({ one }) => ({
    claimedProfile: one(claimedProfile, {
      fields: [sponsoredContent.claimedProfileId],
      references: [claimedProfile.id],
    }),
    reviewer: one(user, {
      fields: [sponsoredContent.reviewedBy],
      references: [user.id],
    }),
  }),
);

export const contractorBenefitRelations = relations(
  contractorBenefit,
  ({ one }) => ({
    claimedProfile: one(claimedProfile, {
      fields: [contractorBenefit.claimedProfileId],
      references: [claimedProfile.id],
    }),
  }),
);

export const contractorProgramRelations = relations(
  contractorProgram,
  ({ one }) => ({
    claimedProfile: one(claimedProfile, {
      fields: [contractorProgram.claimedProfileId],
      references: [claimedProfile.id],
    }),
  }),
);

export const contractorTestimonialRelations = relations(
  contractorTestimonial,
  ({ one }) => ({
    claimedProfile: one(claimedProfile, {
      fields: [contractorTestimonial.claimedProfileId],
      references: [claimedProfile.id],
    }),
  }),
);
