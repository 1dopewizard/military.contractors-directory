/**
 * @file Get employer benefits
 * @route GET /api/employer/benefits
 * @description Returns benefits for the employer's claimed profile
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and, asc } from 'drizzle-orm'
import { requireAuth } from '@/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const db = getDb()

  // Find claimed profile
  const [claimedProfile] = await db
    .select({ id: schema.claimedProfile.id })
    .from(schema.claimedProfile)
    .where(
      and(
        eq(schema.claimedProfile.userId, session.user.id),
        eq(schema.claimedProfile.status, 'active')
      )
    )
    .limit(1)

  let profileId = claimedProfile?.id

  if (!profileId) {
    // Check employer user access
    const [employerAccess] = await db
      .select({ claimedProfileId: schema.employerUser.claimedProfileId })
      .from(schema.employerUser)
      .where(eq(schema.employerUser.userId, session.user.id))
      .limit(1)

    if (!employerAccess) {
      return []
    }
    profileId = employerAccess.claimedProfileId
  }

  const benefits = await db
    .select()
    .from(schema.employerBenefit)
    .where(eq(schema.employerBenefit.claimedProfileId, profileId))
    .orderBy(asc(schema.employerBenefit.sortOrder))

  return benefits
})
