<!--
  @file LogoTest component for dev page
  @usage <LogoTest />
  @description Test page for logo variations and designs
-->

<script setup lang="ts">
const logger = useLogger('dev-logo-test')

const logos = [
  { name: 'CACI', png: 'logos/companies/caci.png', svg: 'logos/companies/caci.svg' },
  { name: 'Lockheed Martin', png: 'logos/companies/lockheed-martin.png', svg: 'logos/companies/lockheed-martin.svg' },
  { name: 'V2X', jpg: 'logos/companies/v2x.jpg', svg: 'logos/companies/v2x.svg' }
]

const sizes = [
  { label: 'Small', class: 'h-8' },
  { label: 'Medium', class: 'h-16' },
  { label: 'Large', class: 'h-24' },
  { label: 'X-Large', class: 'h-32' }
]
</script>

<template>
  <div class="space-y-12">
    <section class="space-y-6 pt-4">
      <Badge variant="ghost" class="w-fit text-sm px-3 py-1">
        <Icon name="mdi:code-tags" class="w-3.5 h-3.5 mr-1.5" />
        Development
      </Badge>
      <div class="space-y-4">
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Logo Test
        </h1>
        <p class="text-xl text-muted-foreground leading-relaxed max-w-2xl">
          Test page for logo variations, designs, and implementations. Compare PNG/JPG vs SVG scaling.
        </p>
      </div>
    </section>

    <div class="space-y-8">
      <Card v-for="logo in logos" :key="logo.name">
        <CardHeader>
          <CardTitle>{{ logo.name }}</CardTitle>
          <CardDescription>Comparing raster ({{ logo.png ? 'PNG' : 'JPG' }}) vs vector (SVG) scaling</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-6">
            <!-- Size comparison grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div v-for="size in sizes" :key="size.label" class="space-y-3">
                <div class="text-center">
                  <p class="text-xs font-medium text-muted-foreground mb-2">{{ size.label }}</p>
                  
                  <!-- Raster version -->
                  <div class="space-y-2">
                    <p class="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {{ logo.png ? 'PNG' : 'JPG' }}
                    </p>
                    <div class="flex items-center justify-center border border-border rounded p-2 bg-muted/30">
                      <img
                        :src="logo.png || logo.jpg"
                        :alt="`${logo.name} ${logo.png ? 'PNG' : 'JPG'}`"
                        :class="[size.class, 'w-auto object-contain']"
                      />
                    </div>
                  </div>

                  <!-- SVG version -->
                  <div class="space-y-2 mt-4">
                    <p class="text-[10px] text-muted-foreground uppercase tracking-wide">
                      SVG
                    </p>
                    <div class="flex items-center justify-center border border-border rounded p-2 bg-muted/30">
                      <img
                        :src="logo.svg"
                        :alt="`${logo.name} SVG`"
                        :class="[size.class, 'w-auto object-contain']"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Side-by-side comparison at large size -->
            <div class="border-t border-border pt-6">
              <h3 class="text-sm font-semibold mb-4">Large Size Comparison</h3>
              <div class="grid grid-cols-2 gap-6">
                <div class="space-y-2">
                  <p class="text-xs font-medium text-muted-foreground">
                    {{ logo.png ? 'PNG' : 'JPG' }} (Raster)
                  </p>
                  <div class="flex items-center justify-center border border-border rounded-lg p-6 bg-muted/30 h-48">
                    <img
                      :src="logo.png || logo.jpg"
                      :alt="`${logo.name} ${logo.png ? 'PNG' : 'JPG'}`"
                      class="h-full w-auto object-contain"
                    />
                  </div>
                </div>
                <div class="space-y-2">
                  <p class="text-xs font-medium text-muted-foreground">
                    SVG (Vector)
                  </p>
                  <div class="flex items-center justify-center border border-border rounded-lg p-6 bg-muted/30 h-48">
                    <img
                      :src="logo.svg"
                      :alt="`${logo.name} SVG`"
                      class="h-full w-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

