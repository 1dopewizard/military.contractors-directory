<!--
  @file Header search component
  @description Simple search input for contractor search
-->

<script setup lang="ts">
const router = useRouter()
const searchQuery = ref('')

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/contractors?q=${encodeURIComponent(searchQuery.value.trim())}`)
    searchQuery.value = ''
  }
}
</script>

<template>
  <form @submit.prevent="handleSearch" class="relative">
    <Icon 
      name="mdi:magnify" 
      class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
    />
    <Input
      v-model="searchQuery"
      type="search"
      placeholder="Search contractors..."
      class="pl-9 w-48 lg:w-64 h-9"
    />
  </form>
</template>
