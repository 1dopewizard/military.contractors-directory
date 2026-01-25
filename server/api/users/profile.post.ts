/**
 * @file Update user profile API endpoint
 * @description Creates or updates user profile (requires authentication)
 */

import { z } from 'zod'
import { db, schema } from '@/server/utils/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/server/utils/better-auth'

const profileSchema = z.object({
  name: z.string().optional(),
  branch: z.string().optional(),
  mosCode: z.string().optional(),
  clearanceLevel: z.string().optional(),
  yearsExperience: z.number().optional(),
  preferredLocations: z.array(z.string()).optional(),
  preferredTheaters: z.array(z.string()).optional(),
  openToOconus: z.boolean().optional(),
  desiredSalaryMin: z.number().optional(),
  desiredSalaryMax: z.number().optional(),
})

export default defineEventHandler(async (event) => {
  const authUser = await requireAuth(event)
  const body = await readBody(event)

  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: parsed.error.flatten(),
    })
  }

  const data = parsed.data

  try {
    // Get authenticated user from database
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, authUser.id),
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    // Update user name if provided
    if (data.name && data.name !== user.name) {
      await db.update(schema.user)
        .set({ name: data.name, updatedAt: new Date() })
        .where(eq(schema.user.id, user.id))
    }

    // Get or create profile
    let profile = await db.query.profile.findFirst({
      where: eq(schema.profile.userId, user.id),
    })

    const profileData = {
      branch: data.branch,
      mosCode: data.mosCode,
      clearanceLevel: data.clearanceLevel,
      yearsExperience: data.yearsExperience,
      preferredLocations: data.preferredLocations,
      preferredTheaters: data.preferredTheaters,
      openToOconus: data.openToOconus,
      desiredSalaryMin: data.desiredSalaryMin,
      desiredSalaryMax: data.desiredSalaryMax,
      updatedAt: new Date(),
    }

    if (!profile) {
      // Create profile
      const [newProfile] = await db.insert(schema.profile).values({
        userId: user.id,
        ...profileData,
      }).returning()

      profile = newProfile
    } else {
      // Update profile
      await db.update(schema.profile)
        .set(profileData)
        .where(eq(schema.profile.id, profile.id))

      // Refresh profile
      profile = await db.query.profile.findFirst({
        where: eq(schema.profile.id, profile.id),
      })
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
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
      } : null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `Failed to update profile: ${message}`,
    })
  }
})
