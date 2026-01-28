<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/app/lib/utils'
import { Textarea } from '@/app/components/ui/textarea'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <Textarea
    data-slot="input-group-control"
    :class="cn(
      'flex-1 resize-none rounded-none border border-border bg-input/30 py-3 shadow-none focus-visible:ring-0',
      props.class,
    )"
  />
</template>
