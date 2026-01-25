/**
 * @file Summarize text using OpenAI
 * @description Simple text summarization endpoint for job descriptions
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey
  if (!apiKey) throw new Error('Missing OpenAI API key')
  const openai = createOpenAI({ apiKey })

  return defineEventHandler(async (event) => {
    const { text, maxChars = 268, maxSentences = 3 } = await readBody(event) as { text?: string; maxChars?: number; maxSentences?: number }

    if (!text || typeof text !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Text is required',
      })
    }

    const result = await generateText({
      model: openai('gpt-5.1'),
      prompt: `Write a ${maxChars}-character summary of this job. STRICT LIMIT: exactly ${maxChars} characters or less. ${maxSentences} sentences max. No quotes.

${text}`,
    })

    // Hard enforce character limit
    let summary = result.text.trim()
    if (summary.length > maxChars) {
      // Truncate at last complete word within limit
      summary = summary.substring(0, maxChars)
      const lastSpace = summary.lastIndexOf(' ')
      if (lastSpace > maxChars - 30) {
        summary = summary.substring(0, lastSpace)
      }
      // Ensure it ends cleanly
      summary = summary.replace(/[,\s]+$/, '') + '...'
    }

    return { summary }
  })
})

