<!--
  @file Companies directory redirect
  @route /companies
  @description Redirects legacy directory URL to the canonical home page
-->

<script setup lang="ts">
await navigateTo("/", { redirectCode: 301 });
</script>
