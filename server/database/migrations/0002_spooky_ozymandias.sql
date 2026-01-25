CREATE TABLE `admin_activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`adminId` text NOT NULL,
	`action` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text,
	`details` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`adminId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `admin_log_admin_idx` ON `admin_activity_log` (`adminId`);--> statement-breakpoint
CREATE INDEX `admin_log_action_idx` ON `admin_activity_log` (`action`);--> statement-breakpoint
CREATE INDEX `admin_log_entity_idx` ON `admin_activity_log` (`entityType`,`entityId`);--> statement-breakpoint
CREATE TABLE `recruiter_access` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`accessLevel` text NOT NULL,
	`invitedBy` text,
	`expiresAt` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`invitedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recruiter_access_email_unique` ON `recruiter_access` (`email`);--> statement-breakpoint
CREATE INDEX `recruiter_access_email_idx` ON `recruiter_access` (`email`);--> statement-breakpoint
CREATE TABLE `toast_click` (
	`id` text PRIMARY KEY NOT NULL,
	`campaignId` text NOT NULL,
	`impressionId` text,
	`userId` text,
	`sessionId` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`campaignId`) REFERENCES `campaign`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`impressionId`) REFERENCES `toast_impression`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `toast_click_campaign_idx` ON `toast_click` (`campaignId`);--> statement-breakpoint
CREATE INDEX `toast_click_impression_idx` ON `toast_click` (`impressionId`);--> statement-breakpoint
CREATE TABLE `toast_impression` (
	`id` text PRIMARY KEY NOT NULL,
	`campaignId` text NOT NULL,
	`userId` text,
	`sessionId` text,
	`pagePath` text,
	`mosCode` text,
	`companySlug` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`campaignId`) REFERENCES `campaign`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `toast_impression_campaign_idx` ON `toast_impression` (`campaignId`);--> statement-breakpoint
CREATE INDEX `toast_impression_session_idx` ON `toast_impression` (`sessionId`);--> statement-breakpoint
CREATE TABLE `campaign` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`budget` integer,
	`spent` integer DEFAULT 0,
	`startDate` integer,
	`endDate` integer,
	`targetingRules` text,
	`createdBy` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `campaign_status_idx` ON `campaign` (`status`);--> statement-breakpoint
CREATE INDEX `campaign_type_idx` ON `campaign` (`type`);--> statement-breakpoint
CREATE TABLE `featured_employer` (
	`id` text PRIMARY KEY NOT NULL,
	`companyId` text NOT NULL,
	`tagline` text,
	`displayOrder` integer,
	`startsAt` integer NOT NULL,
	`endsAt` integer NOT NULL,
	`isPinned` integer DEFAULT false,
	`impressions` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `featured_employer_company_idx` ON `featured_employer` (`companyId`);--> statement-breakpoint
CREATE INDEX `featured_employer_pinned_idx` ON `featured_employer` (`isPinned`);--> statement-breakpoint
CREATE TABLE `featured_listing` (
	`id` text PRIMARY KEY NOT NULL,
	`jobId` text NOT NULL,
	`displayOrder` integer,
	`startsAt` integer NOT NULL,
	`endsAt` integer NOT NULL,
	`isPinned` integer DEFAULT false,
	`impressions` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`status` text DEFAULT 'pending',
	`requestData` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `featured_listing_job_idx` ON `featured_listing` (`jobId`);--> statement-breakpoint
CREATE INDEX `featured_listing_status_idx` ON `featured_listing` (`status`);--> statement-breakpoint
CREATE INDEX `featured_listing_pinned_idx` ON `featured_listing` (`isPinned`);--> statement-breakpoint
CREATE TABLE `sponsored_ad` (
	`id` text PRIMARY KEY NOT NULL,
	`advertiser` text NOT NULL,
	`tagline` text,
	`headline` text NOT NULL,
	`description` text,
	`ctaText` text,
	`ctaUrl` text,
	`status` text NOT NULL,
	`startsAt` integer,
	`endsAt` integer,
	`impressions` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`priority` integer DEFAULT 0,
	`industries` text,
	`matchedMosCodes` text,
	`embedding` text,
	`createdBy` text,
	`reviewedBy` text,
	`reviewedAt` integer,
	`rejectionReason` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sponsored_ad_status_idx` ON `sponsored_ad` (`status`);--> statement-breakpoint
CREATE INDEX `sponsored_ad_advertiser_idx` ON `sponsored_ad` (`advertiser`);--> statement-breakpoint
CREATE TABLE `sponsored_job` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`location` text NOT NULL,
	`clearance` text,
	`salary` text,
	`pitch` text,
	`applyUrl` text NOT NULL,
	`status` text NOT NULL,
	`locationType` text,
	`sponsorCategory` text,
	`startsAt` integer,
	`endsAt` integer,
	`impressions` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`priority` integer DEFAULT 0,
	`matchedMosCodes` text,
	`embedding` text,
	`createdBy` text,
	`reviewedBy` text,
	`reviewedAt` integer,
	`rejectionReason` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sponsored_job_status_idx` ON `sponsored_job` (`status`);--> statement-breakpoint
CREATE INDEX `sponsored_job_company_idx` ON `sponsored_job` (`company`);--> statement-breakpoint
CREATE TABLE `toast_ad` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`ctaText` text,
	`ctaUrl` text,
	`imageUrl` text,
	`campaignId` text,
	`isActive` integer DEFAULT true,
	`priority` integer DEFAULT 0,
	`startsAt` integer,
	`endsAt` integer,
	`impressions` integer DEFAULT 0,
	`clicks` integer DEFAULT 0,
	`dismissals` integer DEFAULT 0,
	`targeting` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`campaignId`) REFERENCES `campaign`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `toast_ad_active_idx` ON `toast_ad` (`isActive`);--> statement-breakpoint
CREATE INDEX `toast_ad_campaign_idx` ON `toast_ad` (`campaignId`);--> statement-breakpoint
CREATE TABLE `toast_ad_event` (
	`id` text PRIMARY KEY NOT NULL,
	`toastAdId` text NOT NULL,
	`eventType` text NOT NULL,
	`userId` text,
	`sessionId` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`toastAdId`) REFERENCES `toast_ad`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `toast_event_ad_idx` ON `toast_ad_event` (`toastAdId`);--> statement-breakpoint
CREATE INDEX `toast_event_type_idx` ON `toast_ad_event` (`eventType`);--> statement-breakpoint
CREATE TABLE `helpful_vote` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`targetType` text NOT NULL,
	`targetId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `helpful_vote_user_idx` ON `helpful_vote` (`userId`);--> statement-breakpoint
CREATE INDEX `helpful_vote_target_idx` ON `helpful_vote` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `helpful_vote_unique_idx` ON `helpful_vote` (`userId`,`targetType`,`targetId`);--> statement-breakpoint
CREATE TABLE `interview_experience` (
	`id` text PRIMARY KEY NOT NULL,
	`companyId` text NOT NULL,
	`mosCode` text NOT NULL,
	`mosId` text,
	`roleTitle` text NOT NULL,
	`interviewDate` integer NOT NULL,
	`processDescription` text NOT NULL,
	`questionsAsked` text NOT NULL,
	`tips` text NOT NULL,
	`difficulty` text NOT NULL,
	`outcome` text NOT NULL,
	`timelineWeeks` integer NOT NULL,
	`verificationStatus` text DEFAULT 'PENDING' NOT NULL,
	`submittedBy` text,
	`helpfulCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mosId`) REFERENCES `mos_code`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submittedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `interview_company_idx` ON `interview_experience` (`companyId`);--> statement-breakpoint
CREATE INDEX `interview_mos_idx` ON `interview_experience` (`mosId`);--> statement-breakpoint
CREATE INDEX `interview_mos_code_idx` ON `interview_experience` (`mosCode`);--> statement-breakpoint
CREATE INDEX `interview_outcome_idx` ON `interview_experience` (`outcome`);--> statement-breakpoint
CREATE INDEX `interview_difficulty_idx` ON `interview_experience` (`difficulty`);--> statement-breakpoint
CREATE INDEX `interview_verification_idx` ON `interview_experience` (`verificationStatus`);--> statement-breakpoint
CREATE INDEX `interview_submitter_idx` ON `interview_experience` (`submittedBy`);--> statement-breakpoint
CREATE INDEX `interview_helpful_idx` ON `interview_experience` (`helpfulCount`);--> statement-breakpoint
CREATE TABLE `salary_report` (
	`id` text PRIMARY KEY NOT NULL,
	`mosCode` text NOT NULL,
	`mosId` text,
	`companyId` text NOT NULL,
	`location` text NOT NULL,
	`baseSalary` integer NOT NULL,
	`signingBonus` integer,
	`clearanceLevel` text NOT NULL,
	`yearsExperience` integer NOT NULL,
	`employmentType` text NOT NULL,
	`isOconus` integer DEFAULT false NOT NULL,
	`verificationStatus` text DEFAULT 'PENDING' NOT NULL,
	`submittedBy` text,
	`helpfulCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`mosId`) REFERENCES `mos_code`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submittedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `salary_company_idx` ON `salary_report` (`companyId`);--> statement-breakpoint
CREATE INDEX `salary_mos_idx` ON `salary_report` (`mosId`);--> statement-breakpoint
CREATE INDEX `salary_mos_code_idx` ON `salary_report` (`mosCode`);--> statement-breakpoint
CREATE INDEX `salary_location_idx` ON `salary_report` (`location`);--> statement-breakpoint
CREATE INDEX `salary_clearance_idx` ON `salary_report` (`clearanceLevel`);--> statement-breakpoint
CREATE INDEX `salary_verification_idx` ON `salary_report` (`verificationStatus`);--> statement-breakpoint
CREATE INDEX `salary_submitter_idx` ON `salary_report` (`submittedBy`);--> statement-breakpoint
CREATE INDEX `salary_helpful_idx` ON `salary_report` (`helpfulCount`);--> statement-breakpoint
CREATE TABLE `company` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`summary` text NOT NULL,
	`description` text,
	`logoUrl` text,
	`websiteUrl` text,
	`careersUrl` text,
	`headquarters` text,
	`employeeCount` text,
	`foundedYear` integer,
	`stockSymbol` text,
	`domains` text,
	`theaters` text,
	`isPrimeContractor` integer DEFAULT false,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_slug_unique` ON `company` (`slug`);--> statement-breakpoint
CREATE TABLE `base` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`theaterCode` text,
	`country` text NOT NULL,
	`city` text,
	`description` text,
	`jobCount` integer DEFAULT 0,
	`coordinatesLat` real,
	`coordinatesLng` real,
	`isActive` integer DEFAULT true,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`theaterCode`) REFERENCES `theater`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `base_slug_unique` ON `base` (`slug`);--> statement-breakpoint
CREATE TABLE `theater` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`region` text,
	`countries` text,
	`majorBases` text,
	`jobCount` integer DEFAULT 0,
	`avgSalaryMin` integer,
	`avgSalaryMax` integer,
	`isActive` integer DEFAULT true,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `theater_code_unique` ON `theater` (`code`);--> statement-breakpoint
CREATE TABLE `candidate_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`email` text,
	`activityType` text NOT NULL,
	`entityType` text,
	`entityId` text,
	`metadata` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `candidate_activity_user_idx` ON `candidate_activity` (`userId`);--> statement-breakpoint
CREATE INDEX `candidate_activity_email_idx` ON `candidate_activity` (`email`);--> statement-breakpoint
CREATE INDEX `candidate_activity_type_idx` ON `candidate_activity` (`activityType`);--> statement-breakpoint
CREATE TABLE `employer_contact` (
	`id` text PRIMARY KEY NOT NULL,
	`companyId` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`title` text,
	`phone` text,
	`isPrimary` integer DEFAULT false,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `employer_contact_company_idx` ON `employer_contact` (`companyId`);--> statement-breakpoint
CREATE INDEX `employer_contact_email_idx` ON `employer_contact` (`email`);--> statement-breakpoint
CREATE TABLE `employer_note` (
	`id` text PRIMARY KEY NOT NULL,
	`companyId` text NOT NULL,
	`contactId` text,
	`content` text NOT NULL,
	`createdBy` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contactId`) REFERENCES `employer_contact`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `employer_note_company_idx` ON `employer_note` (`companyId`);--> statement-breakpoint
CREATE INDEX `employer_note_contact_idx` ON `employer_note` (`contactId`);--> statement-breakpoint
CREATE TABLE `job_alert_subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`userId` text,
	`keywords` text,
	`locations` text,
	`clearanceLevels` text,
	`mosCodes` text,
	`frequency` text DEFAULT 'weekly',
	`isActive` integer DEFAULT true,
	`lastSentAt` integer,
	`unsubscribeToken` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `job_alert_email_idx` ON `job_alert_subscription` (`email`);--> statement-breakpoint
CREATE INDEX `job_alert_user_idx` ON `job_alert_subscription` (`userId`);--> statement-breakpoint
CREATE INDEX `job_alert_active_idx` ON `job_alert_subscription` (`isActive`);--> statement-breakpoint
CREATE TABLE `placement` (
	`id` text PRIMARY KEY NOT NULL,
	`candidateEmail` text NOT NULL,
	`jobId` text,
	`companyId` text,
	`status` text NOT NULL,
	`placementDate` integer,
	`notes` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `placement_candidate_idx` ON `placement` (`candidateEmail`);--> statement-breakpoint
CREATE INDEX `placement_job_idx` ON `placement` (`jobId`);--> statement-breakpoint
CREATE INDEX `placement_company_idx` ON `placement` (`companyId`);--> statement-breakpoint
CREATE INDEX `placement_status_idx` ON `placement` (`status`);--> statement-breakpoint
CREATE TABLE `job` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`companyId` text,
	`location` text NOT NULL,
	`locationType` text,
	`salaryMin` integer,
	`salaryMax` integer,
	`currency` text DEFAULT 'USD',
	`description` text NOT NULL,
	`snippet` text,
	`requirements` text,
	`clearanceRequired` text,
	`featured` integer DEFAULT false,
	`postedAt` integer,
	`expiresAt` integer,
	`status` text DEFAULT 'ACTIVE',
	`createdBy` text,
	`sponsorCategory` text,
	`isOconus` integer DEFAULT false,
	`isActive` integer DEFAULT true,
	`theater` text,
	`sourceSite` text,
	`externalId` text,
	`slug` text,
	`seniority` text,
	`employmentType` text,
	`sourceType` text,
	`priority` integer DEFAULT 0,
	`featuredImpressions` integer DEFAULT 0,
	`baseId` text,
	`locationData` text,
	`clearanceData` text,
	`compensationData` text,
	`qualificationsData` text,
	`contractData` text,
	`responsibilitiesData` text,
	`toolsTech` text,
	`complianceData` text,
	`postingData` text,
	`militaryMapping` text,
	`domainTags` text,
	`sourceData` text,
	`employerData` text,
	`approvalDecision` text,
	`approvalConfidence` real,
	`approvalReasoning` text,
	`approvalFlags` text,
	`embedding` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`baseId`) REFERENCES `base`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `job_status_idx` ON `job` (`status`);--> statement-breakpoint
CREATE INDEX `job_company_id_idx` ON `job` (`companyId`);--> statement-breakpoint
CREATE INDEX `job_slug_idx` ON `job` (`slug`);--> statement-breakpoint
CREATE INDEX `job_active_idx` ON `job` (`isActive`,`status`);--> statement-breakpoint
CREATE INDEX `job_theater_idx` ON `job` (`theater`);--> statement-breakpoint
CREATE INDEX `job_external_id_idx` ON `job` (`externalId`,`sourceSite`);--> statement-breakpoint
CREATE INDEX `job_featured_idx` ON `job` (`featured`,`status`);--> statement-breakpoint
CREATE TABLE `company_mos` (
	`id` text PRIMARY KEY NOT NULL,
	`companyId` text NOT NULL,
	`mosId` text NOT NULL,
	`jobCount` integer DEFAULT 0,
	`matchScore` real,
	`strength` text,
	`typicalRoles` text,
	`typicalClearance` text,
	`source` text,
	`confidence` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mosId`) REFERENCES `mos_code`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `company_mos_company_idx` ON `company_mos` (`companyId`);--> statement-breakpoint
CREATE INDEX `company_mos_mos_idx` ON `company_mos` (`mosId`);--> statement-breakpoint
CREATE INDEX `company_mos_unique_idx` ON `company_mos` (`companyId`,`mosId`);--> statement-breakpoint
CREATE TABLE `job_mos_mapping` (
	`id` text PRIMARY KEY NOT NULL,
	`jobId` text NOT NULL,
	`mosId` text NOT NULL,
	`matchScore` real,
	`mappingSource` text,
	`explanation` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mosId`) REFERENCES `mos_code`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `job_mos_job_idx` ON `job_mos_mapping` (`jobId`);--> statement-breakpoint
CREATE INDEX `job_mos_mos_idx` ON `job_mos_mapping` (`mosId`);--> statement-breakpoint
CREATE INDEX `job_mos_unique_idx` ON `job_mos_mapping` (`jobId`,`mosId`);--> statement-breakpoint
CREATE TABLE `mos_code` (
	`id` text PRIMARY KEY NOT NULL,
	`branch` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`rank` text NOT NULL,
	`description` text,
	`sourceUrl` text NOT NULL,
	`mosCategory` text,
	`summarizedDescription` text,
	`source` text,
	`coreSkills` text,
	`toolsPlatforms` text,
	`missionDomains` text,
	`environments` text,
	`civilianRoles` text,
	`roleFamilies` text,
	`companyArchetypes` text,
	`clearanceProfile` text,
	`deploymentProfile` text,
	`seniorityDistribution` text,
	`payBandHint` text,
	`commonCerts` text,
	`recommendedCertsContract` text,
	`trainingPaths` text,
	`jobCountTotal` integer DEFAULT 0,
	`jobCountOconus` integer DEFAULT 0,
	`jobCountConus` integer DEFAULT 0,
	`enrichmentVersion` integer,
	`lastEnrichedAt` integer,
	`embedding` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mos_branch_idx` ON `mos_code` (`branch`);--> statement-breakpoint
CREATE INDEX `mos_code_idx` ON `mos_code` (`code`);--> statement-breakpoint
CREATE INDEX `mos_branch_code_idx` ON `mos_code` (`branch`,`code`);--> statement-breakpoint
CREATE INDEX `mos_category_idx` ON `mos_code` (`mosCategory`);--> statement-breakpoint
CREATE TABLE `mos_job_ranking` (
	`id` text PRIMARY KEY NOT NULL,
	`mosId` text NOT NULL,
	`jobId` text NOT NULL,
	`score` real NOT NULL,
	`rank` integer,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`mosId`) REFERENCES `mos_code`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mos_job_ranking_mos_idx` ON `mos_job_ranking` (`mosId`);--> statement-breakpoint
CREATE INDEX `mos_job_ranking_job_idx` ON `mos_job_ranking` (`jobId`);--> statement-breakpoint
CREATE INDEX `mos_job_ranking_mos_score_idx` ON `mos_job_ranking` (`mosId`,`score`);--> statement-breakpoint
CREATE TABLE `mos_stat` (
	`id` text PRIMARY KEY NOT NULL,
	`mosId` text NOT NULL,
	`mosCode` text NOT NULL,
	`activeJobs` integer DEFAULT 0 NOT NULL,
	`strongMatches` integer DEFAULT 0 NOT NULL,
	`mediumMatches` integer DEFAULT 0 NOT NULL,
	`weakMatches` integer DEFAULT 0 NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`mosId`) REFERENCES `mos_code`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mos_stat_mosId_unique` ON `mos_stat` (`mosId`);--> statement-breakpoint
CREATE INDEX `mos_stat_mos_idx` ON `mos_stat` (`mosId`);--> statement-breakpoint
CREATE INDEX `mos_stat_code_idx` ON `mos_stat` (`mosCode`);--> statement-breakpoint
CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`branch` text,
	`mosCode` text,
	`clearanceLevel` text,
	`yearsExperience` integer,
	`preferredLocations` text,
	`preferredTheaters` text,
	`openToOconus` integer,
	`desiredSalaryMin` integer,
	`desiredSalaryMax` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profile_userId_unique` ON `profile` (`userId`);--> statement-breakpoint
CREATE INDEX `profile_user_idx` ON `profile` (`userId`);--> statement-breakpoint
CREATE TABLE `saved_job` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`jobId` text NOT NULL,
	`notes` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`jobId`) REFERENCES `job`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `saved_job_user_idx` ON `saved_job` (`userId`);--> statement-breakpoint
CREATE INDEX `saved_job_job_idx` ON `saved_job` (`jobId`);--> statement-breakpoint
CREATE INDEX `saved_job_unique_idx` ON `saved_job` (`userId`,`jobId`);--> statement-breakpoint
CREATE TABLE `user_mos_preference` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`mosId` text NOT NULL,
	`isPrimary` integer DEFAULT false,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mosId`) REFERENCES `mos_code`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_mos_pref_user_idx` ON `user_mos_preference` (`userId`);--> statement-breakpoint
CREATE INDEX `user_mos_pref_mos_idx` ON `user_mos_preference` (`mosId`);--> statement-breakpoint
CREATE TABLE `viewed_mos` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`mosId` text NOT NULL,
	`sessionId` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mosId`) REFERENCES `mos_code`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `viewed_mos_user_idx` ON `viewed_mos` (`userId`);--> statement-breakpoint
CREATE INDEX `viewed_mos_mos_idx` ON `viewed_mos` (`mosId`);--> statement-breakpoint
CREATE INDEX `viewed_mos_session_idx` ON `viewed_mos` (`sessionId`);--> statement-breakpoint
CREATE TABLE `pipeline_job` (
	`id` text PRIMARY KEY NOT NULL,
	`script` text NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	`dryRun` integer DEFAULT false,
	`args` text,
	`startedAt` integer NOT NULL,
	`completedAt` integer,
	`exitCode` integer,
	`error` text,
	`logs` text,
	`createdBy` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pipeline_job_status_idx` ON `pipeline_job` (`status`);--> statement-breakpoint
CREATE INDEX `pipeline_job_script_idx` ON `pipeline_job` (`script`);--> statement-breakpoint
CREATE INDEX `pipeline_job_started_idx` ON `pipeline_job` (`startedAt`);--> statement-breakpoint
CREATE TABLE `pipeline_schedule` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`script` text NOT NULL,
	`cronExpression` text NOT NULL,
	`args` text,
	`dryRun` integer DEFAULT false NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`lastRunAt` integer,
	`nextRunAt` integer,
	`createdBy` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pipeline_schedule_enabled_idx` ON `pipeline_schedule` (`enabled`);--> statement-breakpoint
CREATE INDEX `pipeline_schedule_script_idx` ON `pipeline_schedule` (`script`);--> statement-breakpoint
CREATE INDEX `pipeline_schedule_next_run_idx` ON `pipeline_schedule` (`nextRunAt`);--> statement-breakpoint
ALTER TABLE `user` ADD `contributorStatus` text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `user` ADD `contributionCount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user` ADD `communityViewsThisMonth` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user` ADD `communityViewsResetAt` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `lastLoginAt` integer;