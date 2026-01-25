/**
 * @file Admin employer contacts list endpoint
 * @route GET /api/admin/employer-contacts
 * @description List HR/employer contacts with optional filters (admin or recruiter) (Drizzle-backed)
 */

import { requireAdminOrRecruiter } from '@/server/utils/better-auth'
import { getDb, schema } from '@/server/utils/db'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdminOrRecruiter(event)

  const db = getDb()

  try {
    // Get contacts with contractor info
    const contacts = await db
      .select({
        contact: schema.employerContact,
        contractor: schema.contractor,
      })
      .from(schema.employerContact)
      .leftJoin(schema.contractor, eq(schema.contractor.id, schema.employerContact.contractorId))
      .orderBy(desc(schema.employerContact.createdAt))

    // Transform to expected format
    const transformed = contacts.map(({ contact, contractor }) => ({
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
    }))

    return {
      contacts: transformed
    }
  } catch (error) {
    console.error('Failed to fetch employer contacts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch contacts'
    })
  }
})
