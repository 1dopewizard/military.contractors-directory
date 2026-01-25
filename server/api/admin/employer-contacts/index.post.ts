/**
 * @file Admin create employer contact endpoint
 * @route POST /api/admin/employer-contacts
 * @description Create a new HR/employer contact (admin or recruiter) (Drizzle-backed)
 */

import { z } from 'zod'
import { requireAdminOrRecruiter } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { randomUUID } from 'crypto'

const createSchema = z.object({
  contractorId: z.string(),
  name: z.string().min(2, 'Contact name is required'),
  email: z.string().email(),
  title: z.string().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdminOrRecruiter(event)

  const body = await readBody(event)

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const db = getDb()

  try {
    const id = randomUUID()
    const now = new Date()

    await db.insert(schema.employerContact).values({
      id,
      contractorId: parsed.data.contractorId,
      name: parsed.data.name,
      email: parsed.data.email,
      title: parsed.data.title ?? null,
      phone: parsed.data.phone ?? null,
      isPrimary: parsed.data.isPrimary ?? false,
      createdAt: now,
      updatedAt: now,
    })

    return {
      success: true,
      contact: { 
        id, 
        ...parsed.data,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
    }
  } catch (error) {
    console.error('Failed to create employer contact:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create contact'
    })
  }
})
