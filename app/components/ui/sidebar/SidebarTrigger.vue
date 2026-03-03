<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { useSidebar } from "./utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const { toggleSidebar } = useSidebar();
</script>

<template>
  <Button
    data-sidebar="trigger"
    variant="ghost"
    size="icon"
    :class="cn('h-9 w-9', props.class)"
    @click="toggleSidebar"
  >
    <Icon name="mdi:menu" class="h-5 w-5" />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
