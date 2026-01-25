<!--
  @file Dashboard/Advertiser/AdvertiserCompanySpotlightForm.vue
  @description Form for creating company spotlight ads
-->

<script setup lang="ts">
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import type { FeaturedAdInput, AdPlacementTier, AdIndustry } from '@/app/types/ad.types'

const industryOptions: AdIndustry[] = [
  'Defense',
  'Intelligence', 
  'Cyber',
  'Aerospace',
  'IT Services',
  'Logistics',
  'Engineering',
  'Healthcare',
  'Training'
]

interface Props {
  isSubmitting: boolean
  duplicateWarning: string | null
  selectedTier: AdPlacementTier
}

interface Emits {
  (e: 'submit', input: FeaturedAdInput): void
  (e: 'checkDuplicate', name: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const spotlightSchema = toTypedSchema(
  z.object({
    advertiser: z.string().min(2, 'Company name is required'),
    tagline: z.string().min(5, 'Tagline is required').max(50, 'Tagline must be under 50 characters'),
    headline: z.string().min(10, 'Headline is required').max(80, 'Headline must be under 80 characters'),
    description: z.string().min(20, 'Description is required').max(200, 'Description must be under 200 characters'),
    industries: z.array(z.string()).min(1, 'Select at least one industry').max(3, 'Maximum 3 industries'),
    cta_text: z.string().min(3, 'Button text is required').max(25, 'Button text must be under 25 characters'),
    cta_url: z.string().url('Please enter a valid URL')
  })
)

const form = useForm({
  validationSchema: spotlightSchema,
  initialValues: {
    advertiser: '', tagline: '', headline: '', description: '', industries: [] as string[], cta_text: 'Learn More', cta_url: ''
  },
  validateOnMount: false
})

const toggleIndustry = (industry: AdIndustry) => {
  const current = form.values.industries || []
  if (current.includes(industry)) {
    form.setFieldValue('industries', current.filter(i => i !== industry))
  } else if (current.length < 3) {
    form.setFieldValue('industries', [...current, industry])
  }
}

const formSubmitted = ref(false)
const showPreview = ref(false)

const previewData = computed(() => ({
  id: 'preview', 
  advertiser: form.values.advertiser || 'Company Name',
  tagline: form.values.tagline || 'Your tagline',
  headline: form.values.headline || 'Your headline will appear here',
  description: form.values.description || 'Your description will appear here...',
  industries: (form.values.industries || []) as AdIndustry[],
  cta_text: form.values.cta_text || 'Learn More', 
  cta_url: '#',
  status: 'draft' as const, 
  impressions: 0, 
  clicks: 0, 
  starts_at: null, 
  ends_at: null,
  created_by: null, 
  created_at: new Date().toISOString(), 
  updated_at: new Date().toISOString(),
  reviewed_by: null, 
  reviewed_at: null, 
  rejection_reason: null
}))

watch(() => form.values.advertiser, (val) => { 
  if (val) emit('checkDuplicate', val) 
})

const normalizeUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

const handleSubmit = async () => {
  formSubmitted.value = true
  const { valid } = await form.validate()
  if (!valid) return
  
  const values = form.values
  const input: FeaturedAdInput = {
    advertiser: values.advertiser!, 
    tagline: values.tagline!, 
    headline: values.headline!,
    description: values.description!,
    industries: (values.industries || []) as AdIndustry[],
    cta_text: values.cta_text!, 
    cta_url: normalizeUrl(values.cta_url!),
    priority: props.selectedTier === 'premium' ? 2 : 1
  }
  
  emit('submit', input)
}

const resetForm = () => {
  form.resetForm()
  formSubmitted.value = false
  showPreview.value = false
}

defineExpose({ resetForm })
</script>

<template>
  <div class="grid lg:grid-cols-5 gap-8">
    <form @submit.prevent="handleSubmit" class="lg:col-span-3 space-y-6">
      <div v-if="duplicateWarning" class="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
        <Icon name="mdi:alert-outline" class="w-4 h-4 shrink-0" />{{ duplicateWarning }}
      </div>

      <div class="grid gap-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <Label class="text-xs text-muted-foreground uppercase tracking-wider">Company Name *</Label>
            <Input :model-value="form.values.advertiser" @update:model-value="(v) => form.setFieldValue('advertiser', String(v))" placeholder="e.g. CACI International" class="h-10" maxlength="100" />
            <div class="flex justify-between">
              <p v-if="formSubmitted && form.errors.value.advertiser" class="text-xs text-destructive">{{ form.errors.value.advertiser }}</p>
              <p class="text-[10px] text-muted-foreground ml-auto">{{ form.values.advertiser?.length || 0 }}/100</p>
            </div>
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs text-muted-foreground uppercase tracking-wider">Tagline *</Label>
            <Input :model-value="form.values.tagline" @update:model-value="(v) => form.setFieldValue('tagline', String(v))" placeholder="e.g. Careers for the Mission-Driven" class="h-10" maxlength="50" />
            <div class="flex justify-between">
              <p v-if="formSubmitted && form.errors.value.tagline" class="text-xs text-destructive">{{ form.errors.value.tagline }}</p>
              <p class="text-[10px] text-muted-foreground ml-auto">{{ form.values.tagline?.length || 0 }}/50</p>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Headline *</Label>
          <Input :model-value="form.values.headline" @update:model-value="(v) => form.setFieldValue('headline', String(v))" placeholder="e.g. Join 23,000+ professionals protecting national security" class="h-10" maxlength="80" />
          <div class="flex justify-between">
            <p v-if="formSubmitted && form.errors.value.headline" class="text-xs text-destructive">{{ form.errors.value.headline }}</p>
            <p class="text-[10px] text-muted-foreground ml-auto">{{ form.values.headline?.length || 0 }}/80</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Description *</Label>
          <Textarea :model-value="form.values.description" @update:model-value="(v) => form.setFieldValue('description', String(v))" placeholder="Describe your value proposition" class="min-h-24 resize-none" maxlength="200" />
          <div class="flex justify-between">
            <p v-if="formSubmitted && form.errors.value.description" class="text-xs text-destructive">{{ form.errors.value.description }}</p>
            <p class="text-[10px] text-muted-foreground ml-auto">{{ form.values.description?.length || 0 }}/200</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground uppercase tracking-wider">Industries * <span class="normal-case font-normal">(select up to 3)</span></Label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="industry in industryOptions"
              :key="industry"
              type="button"
              size="sm"
              :variant="form.values.industries?.includes(industry) ? 'default' : 'outline'"
              class="h-8 text-xs"
              :disabled="!form.values.industries?.includes(industry) && (form.values.industries?.length || 0) >= 3"
              @click="toggleIndustry(industry)"
            >
              {{ industry }}
            </Button>
          </div>
          <p v-if="formSubmitted && form.errors.value.industries" class="text-xs text-destructive">{{ form.errors.value.industries }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <Label class="text-xs text-muted-foreground uppercase tracking-wider">Button Text *</Label>
            <Input :model-value="form.values.cta_text" @update:model-value="(v) => form.setFieldValue('cta_text', String(v))" placeholder="e.g. View Open Roles" class="h-10" maxlength="25" />
            <div class="flex justify-between">
              <p v-if="formSubmitted && form.errors.value.cta_text" class="text-xs text-destructive">{{ form.errors.value.cta_text }}</p>
              <p class="text-[10px] text-muted-foreground ml-auto">{{ form.values.cta_text?.length || 0 }}/25</p>
            </div>
          </div>
          <div class="space-y-1.5">
            <Label class="text-xs text-muted-foreground uppercase tracking-wider">Destination URL *</Label>
            <div class="relative">
              <Icon name="mdi:link-variant" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input :model-value="form.values.cta_url" @update:model-value="(v) => form.setFieldValue('cta_url', String(v))" placeholder="https://careers.example.com" class="pl-10 h-10" maxlength="500" />
            </div>
            <p v-if="formSubmitted && form.errors.value.cta_url" class="text-xs text-destructive">{{ form.errors.value.cta_url }}</p>
          </div>
        </div>
      </div>

      <div class="pt-4 flex flex-col sm:flex-row gap-3">
        <Button type="submit" size="lg" class="w-full sm:w-auto" :disabled="isSubmitting">
          <Spinner v-if="isSubmitting" class="w-4 h-4 mr-2" />
          {{ isSubmitting ? 'Creating...' : 'Create Partner Spotlight' }}
        </Button>
        <Button type="button" variant="ghost" size="lg" class="w-full sm:w-auto lg:hidden" @click="showPreview = !showPreview">
          <Icon :name="showPreview ? 'mdi:eye-off' : 'mdi:eye'" class="w-4 h-4 mr-2" />{{ showPreview ? 'Hide Preview' : 'Show Preview' }}
        </Button>
      </div>
    </form>

    <div class="lg:col-span-2 hidden lg:block">
      <div class="sticky top-4">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Live Preview</p>
        <LegacyFeaturedAd :ad="previewData" :is-preview="true" />
      </div>
    </div>

    <div v-if="showPreview" class="lg:hidden">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Preview</p>
      <SponsoredAd :ad="previewData" :is-preview="true" />
    </div>
  </div>
</template>
