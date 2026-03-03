<script setup lang="ts">
import type { ListboxContentProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { ListboxContent, useForwardProps } from "reka-ui";
import { cn } from "@/app/lib/utils";
import { ScrollArea } from "@/app/components/ui/scroll-area";

const props = defineProps<
  ListboxContentProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <ListboxContent
    v-bind="forwarded"
    :class="cn('max-h-[300px] overflow-hidden', props.class)"
  >
    <ScrollArea class="h-full max-h-[300px]">
      <div role="presentation">
        <slot />
      </div>
    </ScrollArea>
  </ListboxContent>
</template>
