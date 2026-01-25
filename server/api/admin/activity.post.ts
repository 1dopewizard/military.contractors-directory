/**
 * @file Admin Activity Log API - POST
 * @description Logs an admin action for audit trail (Drizzle-backed)
 */
import { requireAdmin } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

interface ActivityLogInput {
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, unknown>
}

export default defineEventHandler(async (event): Promise<{ success: boolean; error: string | null }> => {
  let user
  try {
    user = await requireAdmin(event)
  } catch {
    return { success: false, error: 'Unauthorized' }
  }

  const body = await readBody<ActivityLogInput>(event)
  const db = getDb()

  try {
    // Get the user ID from the auth user
    const [dbUser] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, user.email))
      .limit(1)

    if (!dbUser) {
      return { success: false, error: 'User not found' }
    }

    await db.insert(schema.adminActivityLog).values({
      id: randomUUID(),
      adminId: dbUser.id,
      action: body.action,
      entityType: body.entity_type,
      entityId: body.entity_id || null,
      details: body.details || {},
      createdAt: new Date(),
    })

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to log activity:', error)
    return { success: false, error: 'Failed to log activity' }
  }
})
