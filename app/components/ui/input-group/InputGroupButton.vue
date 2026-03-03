<script setup lang="ts">
import type { InputGroupButtonProps } from ".";
import { cn } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { inputGroupButtonVariants } from ".";

const props = withDefaults(defineProps<InputGroupButtonProps>(), {
  size: "xs",
  variant: "ghost",
});
</script>

<template>
  <Button
    :data-size="props.size"
    :variant="props.variant"
    :class="cn(inputGroupButtonVariants({ size: props.size }), props.class)"
  >
    <slot />
  </Button>
</template>
