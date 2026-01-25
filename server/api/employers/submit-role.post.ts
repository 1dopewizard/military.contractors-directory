/**
 * @file Employer role submission endpoint
 * @route POST /api/employers/submit-role
 * @description Handles employer inquiries for recruiting partnership (Drizzle-backed)
 */

import { z } from 'zod'
import { getDb, schema } from '@/server/utils/db'
import { nanoid } from 'nanoid'

const submitRoleSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  contactEmail: z.string().email('Please enter a valid email'),
  contactPhone: z.string().optional(),
  roleTitle: z.string().min(2, 'Role title is required'),
  clearanceRequired: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate request body
  const parsed = submitRoleSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const {
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    roleTitle,
    clearanceRequired,
    location,
    notes
  } = parsed.data

  const db = getDb()

  try {
    // Log the inquiry as candidate activity
    await db.insert(schema.candidateActivity).values({
      id: nanoid(),
      email: contactEmail.toLowerCase(),
      activityType: 'employer_inquiry',
      metadata: {
        companyName,
        contactName,
        contactPhone,
        roleTitle,
        clearanceRequired,
        location,
        notes,
        status: 'new'
      },
      createdAt: new Date(),
    })

    return {
      success: true,
      message: 'Role request submitted successfully'
    }
  } catch (error) {
    console.error('Failed to create employer inquiry:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit role request'
    })
  }
})
