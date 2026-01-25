/**
 * @file POST /api/ads/generate-embedding
 * @description Generate embedding for a sponsored job or ad and match to MOS codes
 */

import { db, schema } from '@/server/utils/db'
import { eq, sql, desc } from 'drizzle-orm'
import { createOpenAI } from '@ai-sdk/openai'
import { embed, cosineSimilarity } from 'ai'

const MOS_MATCH_THRESHOLD = 0.65
const MAX_MOS_MATCHES = 10

export default defineLazyEventHandler(async () => {
  const config = useRuntimeConfig()
  const openai = createOpenAI({ apiKey: config.openaiApiKey })

  return defineEventHandler(async (event) => {
    const { jobId, adId } = await readBody(event) as { jobId?: string; adId?: string }

    if (!jobId && !adId) {
      throw createError({
        statusCode: 400,
        message: 'jobId or adId is required',
      })
    }

    try {
      let embeddingText: string
      let targetId: string
      let targetType: 'job' | 'ad'

      if (jobId) {
        // Fetch sponsored job
        const job = await db.query.sponsoredJob.findFirst({
          where: eq(schema.sponsoredJob.id, jobId),
        })

        if (!job) {
          throw createError({
            statusCode: 404,
            message: 'Sponsored job not found',
          })
        }

        embeddingText = `${job.title} ${job.company} ${job.location} ${job.clearance || ''} ${job.pitch || ''}`
        targetId = jobId
        targetType = 'job'
      } else {
        // Fetch sponsored ad
        const ad = await db.query.sponsoredAd.findFirst({
          where: eq(schema.sponsoredAd.id, adId!),
        })

        if (!ad) {
          throw createError({
            statusCode: 404,
            message: 'Sponsored ad not found',
          })
        }

        const industries = (ad.industries as string[]) || []
        embeddingText = `${ad.headline} ${ad.description || ''} ${industries.join(' ')}`
        targetId = adId!
        targetType = 'ad'
      }

      // Generate embedding
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: embeddingText,
      })

      // Fetch MOS codes with embeddings for matching
      const mosCodes = await db.query.mosCode.findMany({
        columns: {
          id: true,
          code: true,
          name: true,
          branch: true,
          embedding: true,
        },
      })

      // Calculate similarity scores
      const matches: { code: string; name: string; branch: string; similarity: number }[] = []

      for (const mos of mosCodes) {
        if (!mos.embedding) continue

        const mosEmbedding = typeof mos.embedding === 'string' 
          ? JSON.parse(mos.embedding) 
          : mos.embedding

        if (!Array.isArray(mosEmbedding)) continue

        const similarity = cosineSimilarity(embedding, mosEmbedding)

        if (similarity >= MOS_MATCH_THRESHOLD) {
          matches.push({
            code: mos.code,
            name: mos.name,
            branch: mos.branch,
            similarity,
          })
        }
      }

      // Sort by similarity and take top matches
      matches.sort((a, b) => b.similarity - a.similarity)
      const topMatches = matches.slice(0, MAX_MOS_MATCHES)
      const matchedCodes = topMatches.map(m => m.code)

      // Update the record with matched MOS codes
      if (targetType === 'job') {
        await db.update(schema.sponsoredJob)
          .set({
            matchedMosCodes: JSON.stringify(matchedCodes),
            updatedAt: Date.now(),
          })
          .where(eq(schema.sponsoredJob.id, targetId))
      } else {
        await db.update(schema.sponsoredAd)
          .set({
            matchedMosCodes: JSON.stringify(matchedCodes),
            updatedAt: Date.now(),
          })
          .where(eq(schema.sponsoredAd.id, targetId))
      }

      return {
        success: true,
        targetType,
        targetId,
        matchedMosCodes: matchedCodes,
        matches: topMatches,
      }
    } catch (error) {
      if ((error as { statusCode?: number })?.statusCode) {
        throw error
      }
      console.error('Failed to generate embedding:', error)
      throw createError({
        statusCode: 500,
        message: 'Failed to generate embedding',
      })
    }
  })
})
