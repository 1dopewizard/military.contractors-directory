<!--
  @file Intelligence error state
  @description Consistent public intelligence error panel
-->

<script setup lang="ts">
defineProps<{
  title: string;
  message?: string | null;
}>();
</script>

<template>
  <Alert variant="destructive">
    <AlertTitle>{{ title }}</AlertTitle>
    <AlertDescription>{{ message || "The requested intelligence data is unavailable." }}</AlertDescription>
  </Alert>
</template>
