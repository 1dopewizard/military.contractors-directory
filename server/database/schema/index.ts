/**
 * @file Schema index - Re-exports all schema tables
 * @description Unified schema export for the military.contractors database
 */

// Auth tables (Better Auth)
export * from "./auth";

// Core reference tables
export * from "./core";

// Directory (contractors, specialties, locations)
export * from "./directory";

// Public award and contractor intelligence
export * from "./intelligence";

// Jobs (kept for future re-integration)
export * from "./jobs";

// User profiles and preferences
export * from "./users";

// Campaigns and advertising
export * from "./campaigns";

// CRM and leads
export * from "./crm";

// Pipeline jobs
export * from "./pipeline";

// Admin
export * from "./admin";

// Community intel
export * from "./community";

// Analytics
export * from "./analytics";

// Claimed profiles and sponsored content
export * from "./claimed";
