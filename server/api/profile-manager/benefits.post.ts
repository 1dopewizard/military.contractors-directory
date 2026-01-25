/**
 * @file Create/update company benefit
 * @route POST /api/profile-manager/benefits
 * @description Creates or updates a benefit for the company's profile
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/server/utils/better-auth'
import { z } from 'zod'

const benefitSchema = z.object({
  id: z.string().uuid().optional(),
  icon: z.string().min(1).max(100),
  title: z.string().min(1).max(50),
  description: z.string().min(1).max(150),
  sortOrder: z.number().int().min(0).max(10).default(0),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = getDb()
  const body = await readBody(event)

  const parsed = benefitSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input: ' + parsed.error.issues.map(i => i.message).join(', '),
    })
  }

  // Find claimed profile
  const [claimedProfile] = await db
    .select({ id: schema.claimedProfile.id })
    .from(schema.claimedProfile)
    .where(
      and(
        eq(schema.claimedProfile.userId, user.id),
        eq(schema.claimedProfile.status, 'active')
      )
    )
    .limit(1)

  let profileId = claimedProfile?.id

  if (!profileId) {
    // Check contractor user access (admin or owner role required)
    const [contractorAccess] = await db
      .select()
      .from(schema.contractorUser)
      .where(eq(schema.contractorUser.userId, user.id))
      .limit(1)

    if (!contractorAccess || contractorAccess.role === 'editor') {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to manage benefits',
      })
    }
    profileId = contractorAccess.claimedProfileId
  }

  if (parsed.data.id) {
    // Update existing benefit
    await db
      .update(schema.contractorBenefit)
      .set({
        icon: parsed.data.icon,
        title: parsed.data.title,
        description: parsed.data.description,
        sortOrder: parsed.data.sortOrder,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.contractorBenefit.id, parsed.data.id),
          eq(schema.contractorBenefit.claimedProfileId, profileId)
        )
      )

    return { success: true, id: parsed.data.id }
  }

  // Create new benefit
  const [newBenefit] = await db
    .insert(schema.contractorBenefit)
    .values({
      claimedProfileId: profileId,
      icon: parsed.data.icon,
      title: parsed.data.title,
      description: parsed.data.description,
      sortOrder: parsed.data.sortOrder,
    })
    .returning({ id: schema.contractorBenefit.id })

  return { success: true, id: newBenefit?.id }
})
