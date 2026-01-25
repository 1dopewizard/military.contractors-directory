/**
 * @file Get user profile API endpoint
 * @description Returns the profile for the authenticated user
 */

import { db, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const email = query.email as string

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required',
    })
  }

  try {
    // Get user by email
    const user = await db.query.user.findFirst({
      where: eq(schema.user.email, email.toLowerCase()),
    })

    if (!user) {
      return { user: null, profile: null }
    }

    // Get profile
    const profile = await db.query.profile.findFirst({
      where: eq(schema.profile.userId, user.id),
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      },
      profile: profile ? {
        id: profile.id,
        userId: profile.userId,
        branch: profile.branch,
        mosCode: profile.mosCode,
        clearanceLevel: profile.clearanceLevel,
        yearsExperience: profile.yearsExperience,
        preferredLocations: profile.preferredLocations || [],
        preferredTheaters: profile.preferredTheaters || [],
        openToOconus: profile.openToOconus,
        desiredSalaryMin: profile.desiredSalaryMin,
        desiredSalaryMax: profile.desiredSalaryMax,
        createdAt: profile.createdAt ? new Date(profile.createdAt).toISOString() : null,
        updatedAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : null,
      } : null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to fetch profile: ${message}`,
    })
  }
})
