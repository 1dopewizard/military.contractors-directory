/**
 * @file Admin add recruiter endpoint
 * @route POST /api/admin/recruiters
 * @description Add a new recruiter (admin only) (Drizzle-backed)
 */

import { z } from 'zod'
import { requireAdmin } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const createSchema = z.object({
  email: z.string().email('Invalid email'),
  accessLevel: z.string().default('recruiter')
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email address'
    })
  }

  const db = getDb()
  const email = parsed.data.email.toLowerCase()

  try {
    // Check if recruiter already exists
    const [existing] = await db
      .select()
      .from(schema.recruiterAccess)
      .where(eq(schema.recruiterAccess.email, email))
      .limit(1)

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'This email already has recruiter access'
      })
    }

    const id = nanoid()
    const now = new Date()

    await db.insert(schema.recruiterAccess).values({
      id,
      email,
      accessLevel: parsed.data.accessLevel,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    return {
      success: true,
      recruiter: {
        id,
        email,
        access_level: parsed.data.accessLevel,
        is_active: true,
        created_at: now.toISOString(),
      }
    }
  } catch (error) {
    const err = error as { statusCode?: number }
    if (err.statusCode) throw error

    console.error('Failed to add recruiter:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add recruiter'
    })
  }
})
