CREATE UNIQUE INDEX IF NOT EXISTS `agency_toptierCode_unique` ON `agency` (`toptierCode`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `agency_name_idx` ON `agency` (`name`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `naicsCode` (
  `code` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `sector` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pscCode` (
  `code` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `productOrService` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `award` (
  `id` text PRIMARY KEY NOT NULL,
  `awardId` text NOT NULL,
  `generatedAwardId` text,
  `piid` text,
  `recipientEntityId` text NOT NULL,
  `recipientName` text,
  `recipientUei` text,
  `awardingAgencyId` text,
  `fundingAgencyId` text,
  `awardingSubAgencyName` text,
  `fundingSubAgencyName` text,
  `naicsCode` text,
  `pscCode` text,
  `fiscalYear` integer NOT NULL,
  `description` text,
  `baseObligation` real DEFAULT 0 NOT NULL,
  `totalObligation` real DEFAULT 0 NOT NULL,
  `awardType` text,
  `placeOfPerformanceState` text,
  `placeOfPerformanceCountry` text,
  `periodStartDate` integer,
  `periodEndDate` integer,
  `sourceUrl` text,
  `sourceApi` text DEFAULT 'usaspending',
  `cachedAt` integer,
  `raw` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL,
  FOREIGN KEY (`recipientEntityId`) REFERENCES `recipientEntity`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`awardingAgencyId`) REFERENCES `agency`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`fundingAgencyId`) REFERENCES `agency`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`naicsCode`) REFERENCES `naicsCode`(`code`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`pscCode`) REFERENCES `pscCode`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `award_awardId_unique` ON `award` (`awardId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `award_recipient_idx` ON `award` (`recipientEntityId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `award_fiscal_year_idx` ON `award` (`fiscalYear`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `award_awarding_agency_idx` ON `award` (`awardingAgencyId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `award_naics_idx` ON `award` (`naicsCode`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `award_psc_idx` ON `award` (`pscCode`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `awardTransaction` (
  `id` text PRIMARY KEY NOT NULL,
  `awardId` text NOT NULL,
  `transactionId` text NOT NULL,
  `fiscalYear` integer NOT NULL,
  `actionDate` integer,
  `actionType` text,
  `obligation` real DEFAULT 0 NOT NULL,
  `description` text,
  `sourceUrl` text,
  `raw` text,
  `createdAt` integer NOT NULL,
  FOREIGN KEY (`awardId`) REFERENCES `award`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `awardTransaction_transactionId_unique` ON `awardTransaction` (`transactionId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `awardTransaction_award_idx` ON `awardTransaction` (`awardId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `awardTransaction_fiscal_year_idx` ON `awardTransaction` (`fiscalYear`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `explorerQueryCache` (
  `id` text PRIMARY KEY NOT NULL,
  `query` text NOT NULL,
  `normalizedQuery` text,
  `queryHash` text NOT NULL,
  `plan` text,
  `result` text,
  `modelAnswer` text,
  `sourceMetadata` text,
  `cacheStatus` text DEFAULT 'live',
  `refreshedAt` integer NOT NULL,
  `expiresAt` integer,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `explorerQueryCache_queryHash_unique` ON `explorerQueryCache` (`queryHash`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `explorerQueryCache_query_hash_idx` ON `explorerQueryCache` (`queryHash`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `explorerQueryCache_refreshed_at_idx` ON `explorerQueryCache` (`refreshedAt`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `explorerQueryCache_expires_at_idx` ON `explorerQueryCache` (`expiresAt`);
