<!--
  @file Chat with attachments append component
  @description AI chat interface with file attachment support using append method
-->

<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { convertFileListToFileUIParts } from 'ai'
import { computed, ref } from 'vue'

const chat = new Chat({})
const input = ref('')

const files = ref<FileList | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const submit = async (e: Event) => {
  e.preventDefault()

  const fileParts = await convertFileListToFileUIParts(
    files.value ?? undefined,
  )

  chat.sendMessage({
    role: 'user',
    parts: [...fileParts, { type: 'text', text: input.value }],
  })

  input.value = ''
  fileInputRef.value!.value = ''
  files.value = null
}

const filesWithUrl = computed(() => {
  if (!files.value) return []

  return Array.from(files.value).map(file => ({
    file,
    url: URL.createObjectURL(file),
  }))
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-2">Chat with Attachments Append</h1>
      <p class="text-sm text-muted-foreground">
        Send messages with image attachments using the append method
      </p>
    </div>

    <!-- Messages Container -->
    <Card class="flex-1 flex flex-col overflow-hidden mb-4">
      <CardContent class="flex-1 overflow-y-auto p-6 space-y-4">
        <div v-if="chat.messages.length === 0" class="flex items-center justify-center h-full text-muted-foreground">
          <div class="text-center">
            <Icon name="mdi:message-outline" class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet. Start a conversation!</p>
          </div>
        </div>

        <div
          v-for="message in chat.messages"
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

              <!-- File Attachments -->
              <div
                v-if="message.parts.some(part => part.type === 'file')"
                class="flex flex-wrap gap-2 mt-3"
              >
                <img
                  v-for="(attachment, index) in message.parts.filter(
                    part => part.type === 'file',
                  )"
                  :key="`${message.id}-${index}`"
                  :src="attachment.url"
                  class="rounded-md w-20 h-20 object-cover border border-border"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Input Form -->
    <Card>
      <CardContent class="p-4">
        <form @submit.prevent="submit" class="space-y-3">
          <!-- Preview Selected Files -->
          <div v-if="filesWithUrl.length > 0" class="flex flex-wrap gap-2">
            <div
              v-for="file in filesWithUrl"
              :key="file.file.name"
              class="relative group"
            >
              <img
                :src="file.url"
                class="rounded-md w-20 h-20 object-cover border border-border"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <Label for="file-input" class="sr-only">Upload images</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              @click="fileInputRef?.click()"
            >
              <Icon name="mdi:attachment" class="w-4 h-4" />
            </Button>
            <input
              id="file-input"
              ref="fileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="files = ($event.target as HTMLInputElement).files"
            />
            <Input
              v-model="input"
              placeholder="Type your message..."
              class="flex-1"
              @keydown.enter.prevent="submit($event)"
            />
            <Button type="submit" :disabled="!input.trim() && !files">
              <Icon name="mdi:send" class="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

