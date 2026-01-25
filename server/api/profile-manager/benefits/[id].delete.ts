/**
 * @file Delete company benefit
 * @route DELETE /api/profile-manager/benefits/[id]
 * @description Deletes a benefit from the company's profile
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/server/utils/better-auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = getDb()
  const benefitId = getRouterParam(event, 'id')

  if (!benefitId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Benefit ID is required',
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

  await db
    .delete(schema.contractorBenefit)
    .where(
      and(
        eq(schema.contractorBenefit.id, benefitId),
        eq(schema.contractorBenefit.claimedProfileId, profileId)
      )
    )

  return { success: true }
})
