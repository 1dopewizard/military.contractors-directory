<!--
  @file Legacy teaming redirect
  @route /teaming
  @description Redirects old teaming discovery URL to Find Primes/Subs
-->

<script setup lang="ts">
await navigateTo("/find-primes-subs", { redirectCode: 301 });
</script>
