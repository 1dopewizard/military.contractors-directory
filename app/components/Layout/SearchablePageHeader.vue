<!--
  @file Page header with filter bar
  @description Compact header with optional filter slot for dropdown filters.
  Search functionality has been moved to the global header omnibar.
-->

<script setup lang="ts"></script>

<template>
  <PageHeader padding="pt-8 pb-4">
    <!-- Filter Row (slot) -->
    <slot name="filters" />
  </PageHeader>
</template>
