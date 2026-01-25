import { createOpenAI } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { z } from 'zod';

// Notification schema for demo
const notificationSchema = z.object({
  notifications: z.array(
    z.object({
      name: z.string().describe('Name of a fictional person.'),
      message: z.string().describe('Message. Do not use emojis or links.'),
      minutesAgo: z.number(),
    }),
  ),
});

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey;
  if (!apiKey) throw new Error('Missing OpenAI API key');
  const openai = createOpenAI({ apiKey });

  return defineEventHandler(async (event: any) => {
    const context = await readBody(event);

    // Stream generated notifications as objects
    const result = streamObject({
      model: openai('gpt-5.1'),
      prompt: `Generate 5 notifications for a messages app in this context: ${context}`,
      schema: notificationSchema,
    });

    return result.toTextStreamResponse();
  });
});
