<!--
  @file MosAlertDialog.vue
  @usage <MosAlertDialog :mos-code="'25B'" :mos-title="'IT Specialist'" />
  @description Dialog wrapper for MOS job alert signup with optional placement consent
-->

<script setup lang="ts">
const props = defineProps<{
  mosCode: string
  mosTitle?: string
  branch?: string
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Get {{ mosCode }} Job Alerts</DialogTitle>
        <DialogDescription>
          Receive daily job matches for {{ mosTitle || mosCode }} positions delivered to your inbox.
        </DialogDescription>
      </DialogHeader>
      
      <MosAlertSignup 
        :mos-code="mosCode" 
        :mos-title="mosTitle" 
        :branch="branch"
        :in-dialog="true"
        @success="open = false"
      />
    </DialogContent>
  </Dialog>
</template>
