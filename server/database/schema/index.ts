/**
 * @file Schema index - Re-exports all schema tables
 * @description Unified schema export for the military.contractors database
 */

// Auth tables (Better Auth)
export * from "./auth";

// Directory (contractors, specialties, locations)
export * from "./directory";

// Public award and contractor intelligence
export * from "./intelligence";

// Admin (activity log)
export * from "./admin";
