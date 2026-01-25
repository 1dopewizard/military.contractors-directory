/**
 * @file Get company benefits
 * @route GET /api/profile-manager/benefits
 * @description Returns benefits for the company's claimed profile
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, asc } from 'drizzle-orm'
import { requireAuth } from '@/server/utils/better-auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = getDb()

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
    // Check contractor user access
    const [contractorAccess] = await db
      .select({ claimedProfileId: schema.contractorUser.claimedProfileId })
      .from(schema.contractorUser)
      .where(eq(schema.contractorUser.userId, user.id))
      .limit(1)

    if (!contractorAccess) {
      return []
    }
    profileId = contractorAccess.claimedProfileId
  }

  const benefits = await db
    .select()
    .from(schema.contractorBenefit)
    .where(eq(schema.contractorBenefit.claimedProfileId, profileId))
    .orderBy(asc(schema.contractorBenefit.sortOrder))

  return benefits
})
