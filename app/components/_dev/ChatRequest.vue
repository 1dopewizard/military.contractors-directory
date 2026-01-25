<!--
  @file Chat request component
  @description AI chat interface with custom request preparation
-->

<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { createIdGenerator, DefaultChatTransport } from 'ai'
import { computed, ref } from 'vue'

const chat = new Chat({
  generateId: createIdGenerator({ prefix: 'msgc', size: 16 }),
  transport: new DefaultChatTransport({
    api: '/api/use-chat-request',
    // only send the last message to the server:
    prepareSendMessagesRequest({ messages, id }) {
      return { body: { message: messages[messages.length - 1], id } }
    },
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
      <h1 class="text-2xl font-semibold mb-2">Chat Request</h1>
      <p class="text-sm text-muted-foreground">
        AI chat interface with custom request preparation
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
              <div class="whitespace-pre-wrap text-sm">
                {{
                  message.parts
                    .map(part => (part.type === 'text' ? part.text : ''))
                    .join('')
                }}
              </div>
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

