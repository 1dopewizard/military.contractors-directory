/**
 * @file Get company programs
 * @route GET /api/profile-manager/programs
 * @description Returns programs for the company's claimed profile
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

  const programs = await db
    .select()
    .from(schema.contractorProgram)
    .where(eq(schema.contractorProgram.claimedProfileId, profileId))
    .orderBy(asc(schema.contractorProgram.sortOrder))

  return programs
})
