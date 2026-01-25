<!--
  @file Use object component
  @description AI object generation interface using structured schemas
-->

<script setup lang="ts">
import { experimental_useObject as useObject } from '@ai-sdk/vue'
import { notificationSchema } from '@/app/shared/notification-schema'

const { submit, isLoading, object, stop, error, clear } = useObject({
  api: '/api/use-object',
  schema: notificationSchema,
})
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-2">Use Object</h1>
      <p class="text-sm text-muted-foreground">
        Generate structured notifications using AI object generation
      </p>
    </div>

    <!-- Actions -->
    <Card class="mb-4">
      <CardContent class="p-4">
        <div class="flex flex-wrap gap-2">
          <Button
            @click="() => submit('Messages during finals week.')"
            :disabled="isLoading"
          >
            <Icon name="mdi:lightning-bolt" class="w-4 h-4 mr-2" />
            Generate notifications
          </Button>
          <Button
            v-if="isLoading"
            variant="ghost"
            @click="stop"
          >
            <Icon name="mdi:stop" class="w-4 h-4 mr-2" />
            Stop
          </Button>
          <Button
            v-if="object"
            variant="ghost"
            @click="clear"
          >
            <Icon name="mdi:delete-outline" class="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Error Display -->
    <Alert v-if="error" variant="destructive" class="mb-4">
      <Icon name="mdi:alert-circle" class="w-4 h-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        An error occurred: {{ error.message }}
      </AlertDescription>
    </Alert>

    <!-- Loading State -->
    <Card v-if="isLoading" class="mb-4">
      <CardContent class="p-6">
        <div class="flex items-center justify-center gap-3">
          <Spinner class="size-5 text-primary" />
          <span class="text-muted-foreground">Generating notifications...</span>
        </div>
      </CardContent>
    </Card>

    <!-- Results -->
    <div v-if="object?.notifications && object.notifications.length > 0" class="space-y-3">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-semibold">Generated Notifications</h2>
        <Badge variant="ghost">
          {{ object.notifications.length }} notification{{ object.notifications.length !== 1 ? 's' : '' }}
        </Badge>
      </div>

      <div
        v-for="(notification, index) in object.notifications"
        :key="index"
      >
        <Card>
          <CardContent class="p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 space-y-2">
                <div class="flex items-center gap-2">
                  <Icon name="mdi:account-circle" class="w-5 h-5 text-muted-foreground" />
                  <span class="font-medium">{{ notification?.name }}</span>
                </div>
                <p class="text-sm text-muted-foreground">
                  {{ notification?.message }}
                </p>
              </div>
              <div class="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon name="mdi:clock-outline" class="w-4 h-4" />
                <span>
                  {{ notification?.minutesAgo }}
                  <template v-if="notification?.minutesAgo != null"> min ago</template>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Empty State -->
    <Card v-else-if="!isLoading && !error">
      <CardContent class="p-12">
        <div class="text-center text-muted-foreground">
          <Icon name="mdi:bell-outline" class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No notifications generated yet.</p>
          <p class="text-sm mt-1">Click "Generate notifications" to get started.</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

