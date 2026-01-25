CREATE TABLE `contractor` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`defenseNewsRank` integer,
	`country` text,
	`headquarters` text,
	`founded` integer,
	`employeeCount` text,
	`website` text,
	`careersUrl` text,
	`linkedinUrl` text,
	`wikipediaUrl` text,
	`stockTicker` text,
	`isPublic` integer DEFAULT false,
	`totalRevenue` real,
	`defenseRevenue` real,
	`defenseRevenuePercent` real,
	`logoUrl` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contractor_slug_unique` ON `contractor` (`slug`);--> statement-breakpoint
CREATE TABLE `contractorLocation` (
	`id` text PRIMARY KEY NOT NULL,
	`contractorId` text NOT NULL,
	`city` text,
	`state` text,
	`country` text NOT NULL,
	`isHeadquarters` integer DEFAULT false,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`contractorId`) REFERENCES `contractor`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `contractorSpecialty` (
	`contractorId` text NOT NULL,
	`specialtyId` text NOT NULL,
	`isPrimary` integer DEFAULT false,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`contractorId`) REFERENCES `contractor`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`specialtyId`) REFERENCES `specialty`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `specialty` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `specialty_slug_unique` ON `specialty` (`slug`);