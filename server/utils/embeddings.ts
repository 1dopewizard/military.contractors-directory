/**
 * @file Embedding utilities for vector search
 * @description Generate embeddings using OpenAI text-embedding-3-small
 */

import { createOpenAI } from '@ai-sdk/openai'
import { embedMany } from 'ai'

const EMBEDDING_MODEL = 'text-embedding-3-small'

/**
 * Generate embedding vector for a search query
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = useRuntimeConfig().openaiApiKey
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  
  const openai = createOpenAI({ apiKey })
  
  const { embeddings } = await embedMany({
    model: openai.embedding(EMBEDDING_MODEL),
    values: [query],
  })
  
  const embedding = embeddings[0]
  if (!embedding) {
    throw new Error('Failed to generate embedding')
  }
  
  return embedding
}

/**
 * Format embedding array as pgvector-compatible string
 */
export function formatEmbeddingForPg(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
