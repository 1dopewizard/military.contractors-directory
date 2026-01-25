/**
 * @file User viewed MOS endpoint
 * @route GET /api/users/viewed-mos
 * @description Fetch MOS codes the user has viewed/shown interest in
 */

import { db, schema } from '@/server/utils/db'
import { getServerUser } from '@/server/utils/better-auth'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await getServerUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)

  try {
    const viewedMos = await db.query.viewedMos.findMany({
      where: eq(schema.viewedMos.userId, user.id),
      with: {
        mosCode: true,
      },
      orderBy: desc(schema.viewedMos.viewedAt),
      limit,
    })

    return viewedMos.map(vm => ({
      id: vm.id,
      code: vm.mosCode?.code || vm.mosId,
      title: vm.mosCode?.name || 'Unknown MOS',
      branch: vm.mosCode?.branch || 'unknown',
      viewedAt: vm.viewedAt instanceof Date 
        ? vm.viewedAt.getTime() 
        : vm.viewedAt,
      viewCount: vm.viewCount || 1,
    }))
  } catch (error) {
    console.error('Failed to fetch viewed MOS:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch viewed MOS',
    })
  }
})
