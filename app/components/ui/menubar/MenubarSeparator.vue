<script setup lang="ts">
import type { MenubarSeparatorProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { MenubarSeparator, useForwardProps } from "reka-ui";
import { cn } from "@/app/lib/utils";

const props = defineProps<
  MenubarSeparatorProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = reactiveOmit(props, "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <MenubarSeparator
    :class="cn('bg-muted -mx-1 my-1 h-px', props.class)"
    v-bind="forwardedProps"
  />
</template>
