/**
 * @file Admin get contractor contact endpoint
 * @route GET /api/admin/contractor-contacts/:id
 * @description Get a single HR/contractor contact (admin or recruiter) (Drizzle-backed)
 */

import { requireAdminOrRecruiter } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdminOrRecruiter(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Contact ID is required'
    })
  }

  const db = getDb()

  try {
    // Get contact with contractor info
    const [result] = await db
      .select({
        contact: schema.contractorContact,
        contractor: schema.contractor,
      })
      .from(schema.contractorContact)
      .leftJoin(schema.contractor, eq(schema.contractor.id, schema.contractorContact.contractorId))
      .where(eq(schema.contractorContact.id, id))
      .limit(1)

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contact not found'
      })
    }

    const { contact, contractor } = result

    return {
      contact: {
        id: contact.id,
        contractor_id: contact.contractorId,
        contractor_name: contractor?.name ?? null,
        name: contact.name,
        email: contact.email,
        title: contact.title,
        phone: contact.phone,
        is_primary: contact.isPrimary,
        created_at: contact.createdAt?.toISOString() ?? null,
        updated_at: contact.updatedAt?.toISOString() ?? null,
      }
    }
  } catch (error) {
    const err = error as { statusCode?: number }
    if (err.statusCode) throw error
    
    console.error('Failed to fetch contractor contact:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch contact'
    })
  }
})
