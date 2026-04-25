CREATE TABLE IF NOT EXISTS `agency` (
  `id` text PRIMARY KEY NOT NULL,
  `toptierCode` text NOT NULL,
  `name` text NOT NULL,
  `abbreviation` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `agency_toptierCode_unique` ON `agency` (`toptierCode`);
CREATE INDEX IF NOT EXISTS `agency_name_idx` ON `agency` (`name`);

CREATE TABLE IF NOT EXISTS `naicsCode` (
  `code` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `sector` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `pscCode` (
  `code` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `productOrService` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `award` (
  `id` text PRIMARY KEY NOT NULL,
  `awardId` text NOT NULL,
  `piid` text,
  `recipientEntityId` text NOT NULL,
  `awardingAgencyId` text,
  `fundingAgencyId` text,
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
  `raw` text,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL,
  FOREIGN KEY (`recipientEntityId`) REFERENCES `recipientEntity`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`awardingAgencyId`) REFERENCES `agency`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`fundingAgencyId`) REFERENCES `agency`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`naicsCode`) REFERENCES `naicsCode`(`code`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`pscCode`) REFERENCES `pscCode`(`code`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `award_awardId_unique` ON `award` (`awardId`);
CREATE INDEX IF NOT EXISTS `award_recipient_idx` ON `award` (`recipientEntityId`);
CREATE INDEX IF NOT EXISTS `award_fiscal_year_idx` ON `award` (`fiscalYear`);
CREATE INDEX IF NOT EXISTS `award_awarding_agency_idx` ON `award` (`awardingAgencyId`);
CREATE INDEX IF NOT EXISTS `award_naics_idx` ON `award` (`naicsCode`);
CREATE INDEX IF NOT EXISTS `award_psc_idx` ON `award` (`pscCode`);

ALTER TABLE `award` ADD COLUMN `generatedAwardId` text;
ALTER TABLE `award` ADD COLUMN `recipientName` text;
ALTER TABLE `award` ADD COLUMN `recipientUei` text;
ALTER TABLE `award` ADD COLUMN `awardingSubAgencyName` text;
ALTER TABLE `award` ADD COLUMN `fundingSubAgencyName` text;
ALTER TABLE `award` ADD COLUMN `sourceApi` text DEFAULT 'usaspending';
ALTER TABLE `award` ADD COLUMN `cachedAt` integer;

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

CREATE UNIQUE INDEX IF NOT EXISTS `awardTransaction_transactionId_unique` ON `awardTransaction` (`transactionId`);
CREATE INDEX IF NOT EXISTS `awardTransaction_award_idx` ON `awardTransaction` (`awardId`);
CREATE INDEX IF NOT EXISTS `awardTransaction_fiscal_year_idx` ON `awardTransaction` (`fiscalYear`);

CREATE TABLE IF NOT EXISTS `explorerQueryCache` (
  `id` text PRIMARY KEY NOT NULL,
  `query` text NOT NULL,
  `queryHash` text NOT NULL,
  `plan` text,
  `result` text,
  `modelAnswer` text,
  `sourceMetadata` text,
  `refreshedAt` integer NOT NULL,
  `createdAt` integer NOT NULL,
  `updatedAt` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `explorerQueryCache_queryHash_unique` ON `explorerQueryCache` (`queryHash`);
CREATE UNIQUE INDEX IF NOT EXISTS `explorerQueryCache_query_hash_idx` ON `explorerQueryCache` (`queryHash`);
CREATE INDEX IF NOT EXISTS `explorerQueryCache_refreshed_at_idx` ON `explorerQueryCache` (`refreshedAt`);

ALTER TABLE `explorerQueryCache` ADD COLUMN `normalizedQuery` text;
ALTER TABLE `explorerQueryCache` ADD COLUMN `cacheStatus` text DEFAULT 'live';
ALTER TABLE `explorerQueryCache` ADD COLUMN `expiresAt` integer;
CREATE INDEX IF NOT EXISTS `explorerQueryCache_expires_at_idx` ON `explorerQueryCache` (`expiresAt`);
