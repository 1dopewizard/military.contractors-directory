<!--
  @file Admin Contractor List Component
  @description List and manage contractors
-->
<script setup lang="ts">
interface Contractor {
  id: string
  name: string
  slug: string
  headquarters: string | null
  primarySpecialty: { name: string | null } | null
}

const { data: contractors, pending, error, refresh } = await useFetch<{ contractors: Contractor[] }>('/api/contractors', {
  params: {
    limit: 100,
    sort: 'name',
  },
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Contractors</h2>
        <p class="text-sm text-muted-foreground">Manage defense contractor profiles</p>
      </div>
      <Button variant="outline" size="sm" :disabled="pending" @click="refresh">
        <Icon :name="pending ? 'mdi:loading' : 'mdi:refresh'" :class="['w-4 h-4 mr-1.5', { 'animate-spin': pending }]" />
        Refresh
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-12">
      <Spinner class="w-8 h-8 text-muted-foreground" />
    </div>

    <!-- Error -->
    <Card v-else-if="error" class="p-6 text-center border-destructive/30">
      <Icon name="mdi:alert-circle-outline" class="w-8 h-8 text-destructive mx-auto mb-2" />
      <p class="text-sm text-destructive">{{ error.message }}</p>
      <Button variant="ghost" size="sm" class="mt-4" @click="refresh">
        Try Again
      </Button>
    </Card>

    <!-- Contractors Table -->
    <Card v-else class="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Headquarters</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead class="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="contractor in contractors?.contractors" :key="contractor.id">
            <TableCell>
              <NuxtLink 
                :to="`/companies/${contractor.slug}`" 
                class="font-medium hover:text-primary"
                target="_blank"
              >
                {{ contractor.name }}
              </NuxtLink>
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ contractor.headquarters || '—' }}
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ contractor.primarySpecialty?.name || '—' }}
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" as-child>
                <NuxtLink :to="`/companies/${contractor.slug}`" target="_blank">
                  <Icon name="mdi:open-in-new" class="w-4 h-4" />
                </NuxtLink>
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>
