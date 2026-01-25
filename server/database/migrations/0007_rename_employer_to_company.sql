-- Rename employer tables to company tables
ALTER TABLE `employerUser` RENAME TO `companyUser`;
ALTER TABLE `employerBenefit` RENAME TO `companyBenefit`;
ALTER TABLE `employerProgram` RENAME TO `companyProgram`;
ALTER TABLE `employerTestimonial` RENAME TO `companyTestimonial`;

-- Recreate indexes with new names (SQLite doesn't support renaming indexes directly)
DROP INDEX IF EXISTS `employerUser_user_idx`;
DROP INDEX IF EXISTS `employerUser_profile_idx`;
DROP INDEX IF EXISTS `employerBenefit_profile_idx`;
DROP INDEX IF EXISTS `employerProgram_profile_idx`;
DROP INDEX IF EXISTS `employerTestimonial_profile_idx`;
DROP INDEX IF EXISTS `employerTestimonial_status_idx`;

CREATE INDEX `companyUser_user_idx` ON `companyUser` (`userId`);
CREATE INDEX `companyUser_profile_idx` ON `companyUser` (`claimedProfileId`);
CREATE INDEX `companyBenefit_profile_idx` ON `companyBenefit` (`claimedProfileId`);
CREATE INDEX `companyProgram_profile_idx` ON `companyProgram` (`claimedProfileId`);
CREATE INDEX `companyTestimonial_profile_idx` ON `companyTestimonial` (`claimedProfileId`);
CREATE INDEX `companyTestimonial_status_idx` ON `companyTestimonial` (`status`);
