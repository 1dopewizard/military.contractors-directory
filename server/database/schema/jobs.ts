/**
 * @file Job listings schema
 * @description Defense contractor job postings
 */

import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { contractor } from "./directory";
import { user } from "./auth";
import { base } from "./core";

// JSON type definitions for structured data
interface LocationData {
  type?: string;
  city?: string;
  state?: string;
  country?: string;
  isoCountry?: string;
  region?: string;
  theater?: string;
  siteNameOrBase?: string;
  travelPercent?: number;
}

interface ClearanceData {
  level?: string;
  polygraph?: string;
  activeRequired?: boolean;
  usCitizenshipRequired?: boolean;
  sponsorAvailable?: boolean;
}

interface CompensationData {
  rateType?: string;
  currency?: string;
  min?: number;
  max?: number;
  period?: string;
  normalizedAnnualUSD?: number;
  benefits?: string[];
  perDiemDailyUSD?: number;
  housingProvided?: boolean;
  hardshipEligible?: boolean;
}

interface QualificationsData {
  yearsExperienceMin?: number;
  education?: {
    level?: string;
    fields?: string[];
    acceptsEquivalency?: boolean;
  };
  required?: string[];
  preferred?: string[];
  certs?: string[];
  licenses?: string[];
  languages?: string[];
}

interface ContractData {
  type?: string;
  programOrMission?: string;
  vehicleOrIDIQ?: string;
  durationMonths?: number;
}

interface ComplianceData {
  itar?: boolean;
  drugTest?: boolean;
  backgroundCheck?: boolean;
  eeoStatementPresent?: boolean;
}

interface PostingData {
  datePosted?: string;
  validThrough?: string;
  lastSeenAt?: string;
  scrapedAt?: string;
  shift?: string;
}

interface SourceData {
  site?: string;
  url?: string;
  externalId?: string;
}

interface EmployerData {
  name?: string;
  cageCode?: string;
}

interface MilitaryMapping {
  service?: string[];
  mos?: string[];
  afsc?: string[];
  necOrRating?: string[];
  billetKeywords?: string[];
}

export const job = sqliteTable(
  "job",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    company: text("company").notNull(),
    contractorId: text("contractorId").references(() => contractor.id),
    location: text("location").notNull(),
    locationType: text("locationType"), // CONUS, OCONUS, Remote, Hybrid, ONSITE, DEPLOYED
    salaryMin: integer("salaryMin"),
    salaryMax: integer("salaryMax"),
    currency: text("currency").default("USD"),
    description: text("description").notNull(),
    snippet: text("snippet"),
    requirements: text("requirements", { mode: "json" }).$type<string[]>(),
    clearanceRequired: text("clearanceRequired"),
    featured: integer("featured", { mode: "boolean" }).default(false),
    postedAt: integer("postedAt", { mode: "timestamp" }),
    expiresAt: integer("expiresAt", { mode: "timestamp" }),
    status: text("status").default("ACTIVE"), // DRAFT, PENDING_REVIEW, APPROVED, ACTIVE, PAUSED, REJECTED, EXPIRED, ARCHIVED
    createdBy: text("createdBy").references(() => user.id),
    sponsorCategory: text("sponsorCategory"), // WILL_SPONSOR, ELIGIBLE_TO_OBTAIN, ACTIVE_ONLY, NOT_SPECIFIED, NOT_CLEARANCE
    isOconus: integer("isOconus", { mode: "boolean" }).default(false),
    isActive: integer("isActive", { mode: "boolean" }).default(true),
    theater: text("theater"), // CENTCOM, EUCOM, INDOPACOM, AFRICOM, NORTHCOM, SOUTHCOM
    sourceSite: text("sourceSite"),
    externalId: text("externalId"),
    slug: text("slug"),
    seniority: text("seniority"), // INTERN, JUNIOR, MID, SENIOR, LEAD, MANAGER, DIRECTOR, PRINCIPAL
    employmentType: text("employmentType"), // FULL_TIME, PART_TIME, CONTRACT, CONTRACT_TO_HIRE, INTERN
    sourceType: text("sourceType"), // scraped, employer_submitted, admin_created
    priority: integer("priority").default(0),
    featuredImpressions: integer("featuredImpressions").default(0),
    baseId: text("baseId").references(() => base.id),
    // Structured JSONB fields
    locationData: text("locationData", { mode: "json" }).$type<LocationData>(),
    clearanceData: text("clearanceData", {
      mode: "json",
    }).$type<ClearanceData>(),
    compensationData: text("compensationData", {
      mode: "json",
    }).$type<CompensationData>(),
    qualificationsData: text("qualificationsData", {
      mode: "json",
    }).$type<QualificationsData>(),
    contractData: text("contractData", { mode: "json" }).$type<ContractData>(),
    responsibilitiesData: text("responsibilitiesData", { mode: "json" }).$type<
      string[]
    >(),
    toolsTech: text("toolsTech", { mode: "json" }).$type<string[]>(),
    complianceData: text("complianceData", {
      mode: "json",
    }).$type<ComplianceData>(),
    postingData: text("postingData", { mode: "json" }).$type<PostingData>(),
    militaryMapping: text("militaryMapping", {
      mode: "json",
    }).$type<MilitaryMapping>(),
    domainTags: text("domainTags", { mode: "json" }).$type<string[]>(),
    sourceData: text("sourceData", { mode: "json" }).$type<SourceData>(),
    employerData: text("employerData", { mode: "json" }).$type<EmployerData>(),
    // Approval fields
    autoApproved: integer("autoApproved", { mode: "boolean" }).default(false),
    approvalDecision: text("approvalDecision"), // approve, soft_approve, review
    approvalConfidence: real("approvalConfidence"),
    approvalReasoning: text("approvalReasoning"),
    approvalFlags: text("approvalFlags", { mode: "json" }).$type<string[]>(),
    // Additional fields for job submission
    salaryDisplay: text("salaryDisplay"),
    clearanceLevel: text("clearanceLevel"),
    responsibilities: text("responsibilities", { mode: "json" }).$type<
      string[]
    >(),
    sourceUrl: text("sourceUrl"),
    // Vector embedding (stored as JSON array for SQLite compatibility)
    embedding: text("embedding", { mode: "json" }).$type<number[]>(),
    // Timestamps
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("job_status_idx").on(table.status),
    index("job_contractor_id_idx").on(table.contractorId),
    index("job_slug_idx").on(table.slug),
    index("job_active_idx").on(table.isActive, table.status),
    index("job_theater_idx").on(table.theater),
    index("job_external_id_idx").on(table.externalId, table.sourceSite),
    index("job_featured_idx").on(table.featured, table.status),
  ],
);
