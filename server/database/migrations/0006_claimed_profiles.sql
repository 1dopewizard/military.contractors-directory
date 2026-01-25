-- Claimed profiles and sponsored content tables
CREATE TABLE IF NOT EXISTS `claimedProfile` (
	`id` text PRIMARY KEY NOT NULL,
	`contractorId` text NOT NULL,
	`userId` text NOT NULL,
	`tier` text DEFAULT 'claimed' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`verifiedAt` integer,
	`verificationMethod` text,
	`monthlyPrice` integer,
	`billingStartedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`contractorId`) REFERENCES `contractor`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `claimedProfile_contractorId_unique` ON `claimedProfile` (`contractorId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `claimedProfile_contractor_idx` ON `claimedProfile` (`contractorId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `claimedProfile_user_idx` ON `claimedProfile` (`userId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `claimedProfile_status_idx` ON `claimedProfile` (`status`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `employerUser` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`claimedProfileId` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`invitedBy` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`claimedProfileId`) REFERENCES `claimedProfile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invitedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `employerUser_user_idx` ON `employerUser` (`userId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `employerUser_profile_idx` ON `employerUser` (`claimedProfileId`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sponsoredContent` (
	`id` text PRIMARY KEY NOT NULL,
	`claimedProfileId` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text,
	`content` text,
	`mediaUrl` text,
	`ctaText` text,
	`ctaUrl` text,
	`reviewedBy` text,
	`reviewedAt` integer,
	`rejectionReason` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`claimedProfileId`) REFERENCES `claimedProfile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sponsoredContent_profile_idx` ON `sponsoredContent` (`claimedProfileId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sponsoredContent_status_idx` ON `sponsoredContent` (`status`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `employerBenefit` (
	`id` text PRIMARY KEY NOT NULL,
	`claimedProfileId` text NOT NULL,
	`icon` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`claimedProfileId`) REFERENCES `claimedProfile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `employerBenefit_profile_idx` ON `employerBenefit` (`claimedProfileId`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `employerProgram` (
	`id` text PRIMARY KEY NOT NULL,
	`claimedProfileId` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`description` text,
	`imageUrl` text,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`claimedProfileId`) REFERENCES `claimedProfile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `employerProgram_profile_idx` ON `employerProgram` (`claimedProfileId`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `employerTestimonial` (
	`id` text PRIMARY KEY NOT NULL,
	`claimedProfileId` text NOT NULL,
	`quote` text NOT NULL,
	`employeeName` text NOT NULL,
	`employeeTitle` text NOT NULL,
	`employeePhotoUrl` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`claimedProfileId`) REFERENCES `claimedProfile`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `employerTestimonial_profile_idx` ON `employerTestimonial` (`claimedProfileId`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `employerTestimonial_status_idx` ON `employerTestimonial` (`status`);
