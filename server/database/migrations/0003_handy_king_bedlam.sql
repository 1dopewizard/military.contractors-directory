PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_candidate_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`email` text,
	`name` text,
	`phone` text,
	`companyName` text,
	`type` text NOT NULL,
	`activityType` text,
	`entityType` text,
	`entityId` text,
	`jobId` text,
	`notes` text,
	`metadata` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_candidate_activity`("id", "userId", "email", "name", "phone", "companyName", "type", "activityType", "entityType", "entityId", "jobId", "notes", "metadata", "createdAt") SELECT "id", "userId", "email", "name", "phone", "companyName", "type", "activityType", "entityType", "entityId", "jobId", "notes", "metadata", "createdAt" FROM `candidate_activity`;--> statement-breakpoint
DROP TABLE `candidate_activity`;--> statement-breakpoint
ALTER TABLE `__new_candidate_activity` RENAME TO `candidate_activity`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `candidate_activity_user_idx` ON `candidate_activity` (`userId`);--> statement-breakpoint
CREATE INDEX `candidate_activity_email_idx` ON `candidate_activity` (`email`);--> statement-breakpoint
CREATE INDEX `candidate_activity_type_idx` ON `candidate_activity` (`type`);--> statement-breakpoint
CREATE INDEX `candidate_activity_job_idx` ON `candidate_activity` (`jobId`);--> statement-breakpoint
ALTER TABLE `job_alert_subscription` ADD `resumeUrl` text;--> statement-breakpoint
ALTER TABLE `job` ADD `autoApproved` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `job` ADD `salaryDisplay` text;--> statement-breakpoint
ALTER TABLE `job` ADD `clearanceLevel` text;--> statement-breakpoint
ALTER TABLE `job` ADD `responsibilities` text;--> statement-breakpoint
ALTER TABLE `job` ADD `sourceUrl` text;