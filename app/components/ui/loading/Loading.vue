<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { Spinner } from "@/app/components/ui/spinner"
import { cn } from "@/app/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    spinnerClass?: HTMLAttributes["class"]
    text?: string
    fullscreen?: boolean
  }>(),
  {
    text: undefined,
    fullscreen: false,
  }
)
</script>

<template>
  <div
    :class="
      cn(
        'flex items-center justify-center',
        fullscreen ? 'min-h-screen' : 'py-12',
        props.class
      )
    "
  >
    <div class="flex flex-col items-center gap-4">
      <Spinner :class="cn('w-8 h-8 text-muted-foreground', spinnerClass)" />
      <p v-if="text" class="text-sm text-muted-foreground">
        {{ text }}
      </p>
    </div>
  </div>
</template>
