<!--
  @file Chat with tools component
  @description AI chat interface with tool calling support
-->

<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import { computed, ref } from 'vue'

const chat = new Chat({
  // run client-side tools that are automatically executed:
  async onToolCall({ toolCall }) {
    // artificial 2 second delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (toolCall.toolName === 'getLocation') {
      const cities = ['New York', 'Los Angeles', 'Chicago', 'San Francisco']
      const location = cities[Math.floor(Math.random() * cities.length)]

      await chat.addToolOutput({
        toolCallId: toolCall.toolCallId,
        tool: 'getLocation',
        output: location,
      })
    }
  },
  transport: new DefaultChatTransport({
    api: '/api/use-chat-tools',
  }),
})

const messageList = computed(() => chat.messages)
const input = ref('')

const handleSubmit = (e: Event) => {
  e.preventDefault()
  chat.sendMessage({ text: input.value })
  input.value = ''
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-2">Chat with Tools</h1>
      <p class="text-sm text-muted-foreground">
        AI chat interface with tool calling and confirmation support
      </p>
    </div>

    <!-- Messages Container -->
    <Card class="flex-1 flex flex-col overflow-hidden mb-4">
      <CardContent class="flex-1 overflow-y-auto p-6 space-y-4">
        <div v-if="messageList.length === 0" class="flex items-center justify-center h-full text-muted-foreground">
          <div class="text-center">
            <Icon name="mdi:message-outline" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet. Start a conversation!</p>
          </div>
        </div>

        <div
          v-for="message in messageList"
          :key="message.id"
          class="flex flex-col gap-2"
        >
          <div
            :class="[
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
              :class="[
                'max-w-[80%] rounded-lg px-4 py-3',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              ]"
            >
              <div class="flex items-center gap-2 mb-1">
                <Icon
                  :name="message.role === 'user' ? 'mdi:account' : 'simple-icons:googlegemini'"
                  class="w-4 h-4"
                />
                <span class="text-xs font-medium uppercase">
                  {{ message.role }}
                </span>
              </div>

              <template v-for="part in message.parts" :key="part.type">
                <!-- Text Parts -->
                <template v-if="part.type === 'text'">
                  <div class="whitespace-pre-wrap text-sm">{{ part.text }}</div>
                </template>

                <!-- Tool: askForConfirmation -->
                <template v-else-if="part.type === 'tool-askForConfirmation'">
                  <div v-if="part.state === 'input-available'" class="mt-2 p-3 bg-muted/50 border border-border">
                    <p class="text-sm mb-2">
                      {{ (part.input as { message: string }).message }}
                    </p>
                    <div class="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        @click="
                          chat.addToolOutput({
                            toolCallId: part.toolCallId,
                            tool: 'askForConfirmation',
                            output: 'Yes, confirmed.',
                          })
                        "
                      >
                        Yes
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        @click="
                          chat.addToolOutput({
                            toolCallId: part.toolCallId,
                            tool: 'askForConfirmation',
                            output: 'No, denied',
                          })
                        "
                      >
                        No
                      </Button>
                    </div>
                  </div>
                  <div v-if="part.state === 'output-available'" class="mt-2 text-sm text-muted-foreground">
                    Location access allowed: {{ part.output }}
                  </div>
                </template>

                <!-- Tool: getLocation -->
                <template v-else-if="part.type === 'tool-getLocation'">
                  <div v-if="part.state === 'input-available'" class="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Spinner class="size-4 text-primary" />
                    Getting location...
                  </div>
                  <div v-if="part.state === 'output-available'" class="mt-2 text-sm">
                    <Badge variant="ghost" class="gap-1">
                      <Icon name="mdi:map-marker" class="w-3 h-3" />
                      Location: {{ part.output }}
                    </Badge>
                  </div>
                </template>

                <!-- Tool: getWeatherInformation -->
                <template v-else-if="part.type === 'tool-getWeatherInformation'">
                  <div v-if="part.state === 'input-streaming'" class="mt-2">
                    <pre class="text-xs bg-muted p-2 overflow-auto">{{ JSON.stringify(part, null, 2) }}</pre>
                  </div>
                  <div v-if="part.state === 'input-available'" class="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Spinner class="size-4 text-primary" />
                    Getting weather information for {{ (part.input as { city: string }).city }}...
                  </div>
                  <div v-if="part.state === 'output-available'" class="mt-2 text-sm">
                    <Badge variant="ghost" class="gap-1">
                      <Icon name="mdi:weather-cloudy" class="w-3 h-3" />
                      Weather in {{ (part.input as { city: string }).city }}: {{ part.output }}
                    </Badge>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Input Form -->
    <Card>
      <CardContent class="p-4">
        <form @submit="handleSubmit">
          <div class="flex gap-2">
            <Input
              v-model="input"
              placeholder="Type your message..."
              class="flex-1"
              @keydown.enter.prevent="handleSubmit($event)"
            />
            <Button type="submit" :disabled="!input.trim()">
              <Icon name="mdi:send" class="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

