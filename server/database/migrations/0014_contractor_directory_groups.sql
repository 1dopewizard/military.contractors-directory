CREATE TABLE `contractorDirectoryGroup` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`canonicalName` text NOT NULL,
	`normalizedName` text NOT NULL,
	`primarySnapshotId` text,
	`primaryRecipientUei` text,
	`primaryRecipientCode` text,
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
	`aliasCount` integer DEFAULT 1 NOT NULL,
	`snapshotWindowStart` integer NOT NULL,
	`snapshotWindowEnd` integer NOT NULL,
	`refreshedAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`primarySnapshotId`) REFERENCES `contractorSnapshot`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contractorDirectoryGroup_slug_idx` ON `contractorDirectoryGroup` (`slug`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryGroup_normalized_name_idx` ON `contractorDirectoryGroup` (`normalizedName`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryGroup_primary_snapshot_idx` ON `contractorDirectoryGroup` (`primarySnapshotId`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryGroup_obligations_idx` ON `contractorDirectoryGroup` (`totalObligations36m`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryGroup_agency_idx` ON `contractorDirectoryGroup` (`topAwardingAgency`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryGroup_naics_idx` ON `contractorDirectoryGroup` (`topNaicsCode`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryGroup_psc_idx` ON `contractorDirectoryGroup` (`topPscCode`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryGroup_refreshed_at_idx` ON `contractorDirectoryGroup` (`refreshedAt`);--> statement-breakpoint
CREATE TABLE `contractorDirectoryAlias` (
	`id` text PRIMARY KEY NOT NULL,
	`groupId` text NOT NULL,
	`snapshotId` text NOT NULL,
	`slug` text NOT NULL,
	`recipientName` text NOT NULL,
	`normalizedName` text NOT NULL,
	`recipientUei` text,
	`recipientCode` text,
	`totalObligations36m` real DEFAULT 0 NOT NULL,
	`awardCount36m` integer DEFAULT 0 NOT NULL,
	`lastAwardDate` integer,
	`sourceUrl` text NOT NULL,
	`isCanonical` integer DEFAULT false NOT NULL,
	`matchReason` text DEFAULT 'single_snapshot' NOT NULL,
	`matchKey` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`groupId`) REFERENCES `contractorDirectoryGroup`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`snapshotId`) REFERENCES `contractorSnapshot`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contractorDirectoryAlias_slug_idx` ON `contractorDirectoryAlias` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `contractorDirectoryAlias_snapshot_idx` ON `contractorDirectoryAlias` (`snapshotId`);--> statement-breakpoint
CREATE UNIQUE INDEX `contractorDirectoryAlias_canonical_group_idx` ON `contractorDirectoryAlias` (`groupId`) WHERE `isCanonical` = 1;--> statement-breakpoint
CREATE INDEX `contractorDirectoryAlias_group_idx` ON `contractorDirectoryAlias` (`groupId`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryAlias_normalized_name_idx` ON `contractorDirectoryAlias` (`normalizedName`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryAlias_uei_idx` ON `contractorDirectoryAlias` (`recipientUei`);--> statement-breakpoint
CREATE INDEX `contractorDirectoryAlias_code_idx` ON `contractorDirectoryAlias` (`recipientCode`);
