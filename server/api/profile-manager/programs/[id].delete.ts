/**
 * @file Delete employer program
 * @route DELETE /api/employer/programs/[id]
 * @description Deletes a program from the employer's profile
 */

import { getDb, schema } from '@/server/utils/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/server/utils/better-auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = getDb()
  const programId = getRouterParam(event, 'id')

  if (!programId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Program ID is required',
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
    const [employerAccess] = await db
      .select()
      .from(schema.employerUser)
      .where(eq(schema.employerUser.userId, user.id))
      .limit(1)

    if (!employerAccess || employerAccess.role === 'editor') {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to manage programs',
      })
    }
    profileId = employerAccess.claimedProfileId
  }

  await db
    .delete(schema.employerProgram)
    .where(
      and(
        eq(schema.employerProgram.id, programId),
        eq(schema.employerProgram.claimedProfileId, profileId)
      )
    )

  return { success: true }
})
