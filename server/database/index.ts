/**
 * @file Database connection for libSQL/Drizzle
 * @description Unified database connection for military.contractors
 * 
 * Uses @libsql/client with drizzle-orm for SQLite-compatible database operations.
 * Shared between contractors and directory apps via the same file path.
 */

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import { resolve } from 'path'

const dbPath = resolve(process.cwd(), 'server/database/app.db')

const client = createClient({
  url: `file:${dbPath}`,
})

export const db = drizzle(client, { schema })

export { schema, client }
