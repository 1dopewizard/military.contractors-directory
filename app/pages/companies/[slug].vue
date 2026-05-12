<!--
  @file Legacy company profile redirect
  @route /companies/[slug]
  @description Redirects legacy company profile URLs to canonical root-level profiles
-->

<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug;
const canonicalSlug = Array.isArray(slug) ? slug[0] : slug;

await navigateTo(`/${canonicalSlug}`, { redirectCode: 301 });
</script>
