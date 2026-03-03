<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/app/lib/utils";

interface SkeletonProps {
  class?: HTMLAttributes["class"];
}

const props = defineProps<SkeletonProps>();
</script>

<template>
  <div :class="cn('bg-primary/5 animate-pulse rounded-md', props.class)" />
</template>
