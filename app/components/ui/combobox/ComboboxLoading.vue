<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { LoadingText } from "@/app/components/ui/loading"
import { cn } from "@/app/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    text?: string
  }>(),
  {
    text: "Loading",
  }
)
</script>

<template>
  <div :class="cn('flex items-center justify-center py-6 text-sm', props.class)">
    <LoadingText :text="text" />
  </div>
</template>
