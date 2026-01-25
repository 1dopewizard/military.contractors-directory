/**
 * @file Admin Activity Log API - GET
 * @description Fetches recent admin activity for audit trail (Drizzle-backed)
 */
import { requireAdmin } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { desc } from 'drizzle-orm'

interface ActivityLogEntry {
  id: string
  adminId: string | null
  action: string
  entityType: string
  entityId: string | null
  details: Record<string, unknown>
  createdAt: string
}

export default defineEventHandler(async (event): Promise<{ data: ActivityLogEntry[]; error: string | null }> => {
  try {
    await requireAdmin(event)
  } catch {
    return { data: [], error: 'Unauthorized' }
  }

  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 20

  const db = getDb()

  try {
    const logs = await db
      .select()
      .from(schema.adminActivityLog)
      .orderBy(desc(schema.adminActivityLog.createdAt))
      .limit(limit)

    const data: ActivityLogEntry[] = logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: (log.details as Record<string, unknown>) || {},
      createdAt: log.createdAt?.toISOString() ?? new Date().toISOString(),
    }))

    return { data, error: null }
  } catch (error) {
    console.error('Failed to fetch activity log:', error)
    return { data: [], error: 'Failed to fetch activity log' }
  }
})
