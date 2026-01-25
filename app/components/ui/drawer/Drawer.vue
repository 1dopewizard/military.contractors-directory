<script lang="ts" setup>
import { reactive, watchEffect } from 'vue'
import type { DrawerRootEmits, DrawerRootProps } from "vaul-vue"
import { useForwardPropsEmits } from "reka-ui"
import { DrawerRoot } from "vaul-vue"

const props = withDefaults(defineProps<DrawerRootProps>(), {
  shouldScaleBackground: true,
})

const emits = defineEmits<DrawerRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
const forwardedProps = reactive<Record<string, any>>({})

watchEffect(() => {
  const next = forwarded.value
  Object.keys(forwardedProps).forEach((key) => {
    if (!(key in next)) {
      delete forwardedProps[key]
    }
  })
  Object.assign(forwardedProps, next)
})
</script>

<template>
  <DrawerRoot v-bind="forwardedProps">
    <slot />
  </DrawerRoot>
</template>
