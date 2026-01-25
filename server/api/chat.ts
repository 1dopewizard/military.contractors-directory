import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';

export default defineLazyEventHandler(async () => {
  const openai = createOpenAI({
    apiKey: useRuntimeConfig().openaiApiKey,
  });

  return defineEventHandler(async (event) => {
    // Extract the `messages` from the body of the request
    const { messages } = await readBody(event) as { messages: UIMessage[] };

    console.log('messages', messages);

    // Call the language model
    const result = streamText({
      model: openai('gpt-5.1'),
      messages: convertToModelMessages(messages),
      async onFinish({ text, toolCalls, toolResults, usage, finishReason }) {
        // implement your own logic here, e.g. for storing messages
        // or recording token usage
      },
    });

    // Respond with the stream
    return result.toUIMessageStreamResponse();
  });
});
