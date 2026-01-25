import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export default defineLazyEventHandler(async () => {
  const apiKey = useRuntimeConfig().openaiApiKey;
  if (!apiKey) throw new Error('Missing OpenAI API key');
  const openai = createOpenAI({ apiKey });

  return defineEventHandler(async (event: any) => {
    // Extract the `prompt` from the body of the request
    const { prompt } = await readBody(event) as { prompt: string };

    // Ask OpenAI for a streaming chat completion given the prompt
    const result = streamText({
      model: openai('gpt-5.1'),
      prompt,
    });

    // Respond with the stream
    return result.toUIMessageStreamResponse();
  });
});
