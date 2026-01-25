import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { z } from 'zod';

export default defineLazyEventHandler(async () => {
  const openai = createOpenAI({
    apiKey: useRuntimeConfig().openaiApiKey,
  });

  return defineEventHandler(async (event) => {
    const { messages } = await readBody(event) as { messages: UIMessage[] };

    const result = streamText({
      model: openai('gpt-5.1'),
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(5), // multi-steps for server-side tools
      tools: {
        // server-side tool with execute function:
        getWeatherInformation: {
          description: 'show the weather in a given city to the user',
          inputSchema: z.object({ city: z.string() }),
          execute: async ({}: { city: string }) => {
            // Add artificial delay of 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));

            const weatherOptions = [
              'sunny',
              'cloudy',
              'rainy',
              'snowy',
              'windy',
            ];
            return weatherOptions[
              Math.floor(Math.random() * weatherOptions.length)
            ];
          },
        },
        // client-side tool that starts user interaction:
        askForConfirmation: {
          description: 'Ask the user for confirmation.',
          inputSchema: z.object({
            message: z
              .string()
              .describe('The message to ask for confirmation.'),
          }),
        },
        // client-side tool that is automatically executed on the client:
        getLocation: {
          description:
            'Get the user location. Always ask for confirmation before using this tool.',
          inputSchema: z.object({}),
        },
      },
    });

    return result.toUIMessageStreamResponse();
  });
});
