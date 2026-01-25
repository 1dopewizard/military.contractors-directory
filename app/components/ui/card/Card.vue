<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/app/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    :class="
      cn(
        'border border-primary/20 bg-card text-card-foreground',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
