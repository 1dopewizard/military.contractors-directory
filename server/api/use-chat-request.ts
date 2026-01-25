import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';

export default defineLazyEventHandler(async () => {
  const openai = createOpenAI({
    apiKey: useRuntimeConfig().openaiApiKey,
  });

  return defineEventHandler(async (event) => {
    // Extract the `messages` from the body of the request
    const { message } = await readBody(event) as { message: UIMessage };

    // Implement your own logic here to add message history
    const previousMessages: UIMessage[] = [];
    const messages: UIMessage[] = [...previousMessages, message];

    // Call the language model
    const result = streamText({
      model: openai('gpt-5.1'),
      messages: convertToModelMessages(messages),
      async onFinish({ text, toolCalls, toolResults, usage, finishReason }) {
        // Implement your own logic here, e.g. for storing messages
      },
    });

    // Respond with the stream
    return result.toUIMessageStreamResponse();
  });
});
