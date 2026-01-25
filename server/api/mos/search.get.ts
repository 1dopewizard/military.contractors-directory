/**
 * @file GET /api/mos/search
 * @description Search MOS codes by prefix or name (for omnibar autocomplete)
 */

import { getDb, schema } from '@/server/utils/db'
import { or, like, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = ((query.q as string) || '').trim().toUpperCase()
  const limit = Math.min(Number(query.limit) || 10, 50)

  if (!q) {
    return []
  }

  const db = getDb()

  try {
    // Search by code prefix or name containing query
    // Order by: exact code match first, then code prefix, then name match
    const results = await db
      .select({
        id: schema.mosCode.id,
        code: schema.mosCode.code,
        name: schema.mosCode.name,
        branch: schema.mosCode.branch,
        category: schema.mosCode.mosCategory,
        description: schema.mosCode.summarizedDescription,
      })
      .from(schema.mosCode)
      .where(
        or(
          like(schema.mosCode.code, `${q}%`),
          like(schema.mosCode.name, `%${q}%`)
        )
      )
      .orderBy(
        // Prioritize: exact match > code prefix > name match
        sql`CASE 
          WHEN ${schema.mosCode.code} = ${q} THEN 0
          WHEN ${schema.mosCode.code} LIKE ${q + '%'} THEN 1
          ELSE 2
        END`,
        sql`LENGTH(${schema.mosCode.code})`,
        schema.mosCode.code
      )
      .limit(limit)

    return results.map(mos => ({
      id: mos.id,
      code: mos.code,
      title: mos.name,
      branch: mos.branch,
      category: mos.category,
      description: mos.description,
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      message: `MOS search error: ${message}`,
    })
  }
})
