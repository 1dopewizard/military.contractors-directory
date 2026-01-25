/**
 * @file Database server utility
 * @description Provides Drizzle ORM client for server-side API routes
 */

import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from '../database/schema'
import { resolve } from 'path'

const dbPath = resolve(process.cwd(), 'server/database/app.db')

let _client: Client | null = null
let _db: LibSQLDatabase<typeof schema> | null = null

/**
 * Get or create the database client (lazy initialization)
 * This is the recommended way to access the database in server routes
 */
export function getDb(): LibSQLDatabase<typeof schema> {
  if (!_db) {
    _client = createClient({
      url: `file:${dbPath}`,
    })
    _db = drizzle(_client, { schema })
  }
  return _db
}

/**
 * Get the raw libSQL client
 */
export function getClient(): Client {
  if (!_client) {
    getDb() // Initialize
  }
  return _client!
}

// Backwards compatibility: export `db` directly (uses same lazy singleton)
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get: (_, prop) => {
    const instance = getDb()
    return Reflect.get(instance, prop)
  },
})

// Re-export schema and client for convenience
export { schema }
export { _client as client }