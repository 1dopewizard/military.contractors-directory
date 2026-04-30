CREATE TABLE `contractorSnapshotRun` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`windowStart` integer NOT NULL,
	`windowEnd` integer NOT NULL,
	`startedAt` integer NOT NULL,
	`completedAt` integer,
	`pageCount` integer DEFAULT 0 NOT NULL,
	`rowCount` integer DEFAULT 0 NOT NULL,
	`error` text,
	`sourceMetadata` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contractorSnapshotRun_status_idx` ON `contractorSnapshotRun` (`status`);--> statement-breakpoint
CREATE INDEX `contractorSnapshotRun_completed_at_idx` ON `contractorSnapshotRun` (`completedAt`);--> statement-breakpoint
CREATE TABLE `contractorSnapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`runId` text,
	`slug` text NOT NULL,
	`recipientName` text NOT NULL,
	`normalizedName` text NOT NULL,
	`recipientUei` text,
	`recipientCode` text,
	`totalObligations36m` real DEFAULT 0 NOT NULL,
	`awardCount36m` integer DEFAULT 0 NOT NULL,
	`lastAwardDate` integer,
	`topAwardingAgency` text,
	`topAwardingSubagency` text,
	`topNaicsCode` text,
	`topNaicsTitle` text,
	`topPscCode` text,
	`topPscTitle` text,
	`sourceUrl` text NOT NULL,
	`sourceMetadata` text,
	`rawAggregate` text,
	`snapshotWindowStart` integer NOT NULL,
	`snapshotWindowEnd` integer NOT NULL,
	`refreshedAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`runId`) REFERENCES `contractorSnapshotRun`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contractorSnapshot_slug_idx` ON `contractorSnapshot` (`slug`);--> statement-breakpoint
CREATE INDEX `contractorSnapshot_recipient_code_idx` ON `contractorSnapshot` (`recipientCode`);--> statement-breakpoint
CREATE INDEX `contractorSnapshot_normalized_name_idx` ON `contractorSnapshot` (`normalizedName`);--> statement-breakpoint
CREATE INDEX `contractorSnapshot_obligations_idx` ON `contractorSnapshot` (`totalObligations36m`);--> statement-breakpoint
CREATE INDEX `contractorSnapshot_agency_idx` ON `contractorSnapshot` (`topAwardingAgency`);--> statement-breakpoint
CREATE INDEX `contractorSnapshot_naics_idx` ON `contractorSnapshot` (`topNaicsCode`);--> statement-breakpoint
CREATE INDEX `contractorSnapshot_psc_idx` ON `contractorSnapshot` (`topPscCode`);--> statement-breakpoint
CREATE INDEX `contractorSnapshot_refreshed_at_idx` ON `contractorSnapshot` (`refreshedAt`);
