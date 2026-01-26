<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from "reka-ui"
import { useForwardPropsEmits, VisuallyHidden } from "reka-ui"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/app/components/ui/dialog'
import Command from "./Command.vue"

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits & {
  openAutoFocus: [event: Event]
}>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <Dialog v-bind="forwarded">
    <DialogContent class="overflow-hidden p-0 shadow-lg" hide-close-button @open-auto-focus="$emit('openAutoFocus', $event)">
      <VisuallyHidden>
        <DialogTitle>Command Palette</DialogTitle>
        <DialogDescription>Search and navigate quickly</DialogDescription>
      </VisuallyHidden>
      <Command class="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
        <slot />
      </Command>
    </DialogContent>
  </Dialog>
</template>
