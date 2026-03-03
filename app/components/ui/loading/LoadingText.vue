<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/app/lib/utils";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    text?: string;
  }>(),
  {
    text: "Loading",
  },
);
</script>

<template>
  <span
    :class="cn('text-muted-foreground inline-flex items-center', props.class)"
  >
    {{ text }}
    <span class="ml-0.5 inline-flex w-6">
      <span class="animate-pulse-dot animation-delay-0">.</span>
      <span class="animate-pulse-dot animation-delay-200">.</span>
      <span class="animate-pulse-dot animation-delay-400">.</span>
    </span>
  </span>
</template>

<style scoped>
.animate-pulse-dot {
  animation: pulse-dot 1.4s ease-in-out infinite;
}

.animation-delay-0 {
  animation-delay: 0s;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-400 {
  animation-delay: 0.4s;
}

@keyframes pulse-dot {
  0%,
  80%,
  100% {
    opacity: 0.2;
  }
  40% {
    opacity: 1;
  }
}
</style>
