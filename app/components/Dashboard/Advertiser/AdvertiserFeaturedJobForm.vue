<!--
  @file Dashboard/Advertiser/AdvertiserFeaturedJobForm.vue
  @description Form for creating featured job ads
-->

<script setup lang="ts">
import { z } from "zod";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import type {
  AdLocationType,
  SponsorCategory,
  FeaturedJob,
  FeaturedJobInput,
  AdPlacementTier,
} from "@/app/types/ad.types";

interface Props {
  isSubmitting: boolean;
  duplicateWarning: string | null;
  selectedTier: AdPlacementTier;
}

interface Emits {
  (e: "submit", input: FeaturedJobInput): void;
  (e: "checkDuplicate", name: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const locationTypes: Array<{ label: string; value: AdLocationType }> = [
  { label: "OCONUS (Overseas)", value: "OCONUS" },
  { label: "Remote", value: "Remote" },
  { label: "Hybrid", value: "Hybrid" },
];

const clearanceLevels = [
  { label: "None Required", value: "None" },
  { label: "Public Trust", value: "Public Trust" },
  { label: "Secret", value: "Secret" },
  { label: "Top Secret", value: "Top Secret" },
  { label: "TS/SCI", value: "TS/SCI" },
  { label: "TS/SCI w/ Poly", value: "TS/SCI w/ Poly" },
];

const sponsorCategories: Array<{ label: string; value: SponsorCategory }> = [
  { label: "Not Specified", value: "NOT_SPECIFIED" },
  { label: "Will Sponsor Clearance", value: "WILL_SPONSOR" },
  { label: "Eligible to Obtain", value: "ELIGIBLE_TO_OBTAIN" },
  { label: "Active Clearance Only", value: "ACTIVE_ONLY" },
];

const salaryPeriods = [
  { value: "annual", label: "Per Year" },
  { value: "hourly", label: "Per Hour" },
  { value: "contract", label: "Contract" },
] as const;

type SalaryPeriod = (typeof salaryPeriods)[number]["value"];

const jobSchema = toTypedSchema(
  z.object({
    title: z
      .string()
      .min(5, "Job title is required")
      .max(60, "Title must be under 60 characters"),
    company: z
      .string()
      .min(2, "Company name is required")
      .max(60, "Company must be under 60 characters"),
    location_type: z.enum(["CONUS", "OCONUS", "Remote", "Hybrid"]),
    location: z
      .string()
      .min(2, "Location is required")
      .max(100, "Location must be under 100 characters"),
    clearance: z.string().min(1, "Select a clearance level"),
    sponsor_category: z.string().optional(),
    salary_min: z.number().min(1, "Minimum salary is required"),
    salary_max: z.number().min(1, "Maximum salary is required"),
    salary_period: z.enum(["annual", "hourly", "contract"]),
    pitch: z
      .string()
      .min(20, "Pitch is required")
      .max(120, "Pitch must be under 120 characters"),
    apply_url: z.string().url("Please enter a valid URL"),
  }),
);

const form = useForm({
  validationSchema: jobSchema,
  initialValues: {
    title: "",
    company: "",
    location_type: undefined as AdLocationType | undefined,
    location: "",
    clearance: "",
    sponsor_category: "",
    salary_min: undefined as number | undefined,
    salary_max: undefined as number | undefined,
    salary_period: "annual" as SalaryPeriod,
    pitch: "",
    apply_url: "",
  },
  validateOnMount: false,
});

const formSubmitted = ref(false);
const showPreview = ref(false);

const formatSalary = (
  min?: number,
  max?: number,
  period?: SalaryPeriod,
): string => {
  if (!min && !max) return "$XXK - $XXK";
  const formatAmount = (amount: number, p: SalaryPeriod) => {
    if (p === "hourly") return `$${amount}`;
    if (p === "contract")
      return `$${amount >= 1000 ? `${(amount / 1000).toFixed(0)}K` : amount}`;
    return amount >= 1000 ? `$${(amount / 1000).toFixed(0)}K` : `$${amount}K`;
  };
  const p = period || "annual";
  const suffix = p === "hourly" ? "/hr" : p === "contract" ? "" : "/yr";
  if (min && max)
    return `${formatAmount(min, p)} - ${formatAmount(max, p)}${suffix}`;
  if (min) return `${formatAmount(min, p)}+${suffix}`;
  if (max) return `Up to ${formatAmount(max, p)}${suffix}`;
  return "$XXK - $XXK";
};

const formattedSalary = computed(() =>
  formatSalary(
    form.values.salary_min,
    form.values.salary_max,
    form.values.salary_period,
  ),
);

const previewData = computed(() => ({
  id: "preview",
  title: form.values.title || "Job Title",
  company: form.values.company || "Company Name",
  location: form.values.location || "Location",
  location_type: form.values.location_type || null,
  clearance: form.values.clearance || "Clearance",
  salary: formattedSalary.value,
  pitch: form.values.pitch || "Your pitch will appear here...",
  apply_url: "#",
  status: "draft" as const,
  impressions: 0,
  clicks: 0,
  starts_at: null,
  ends_at: null,
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  sponsor_category: "NOT_SPECIFIED" as const,
  reviewed_by: null,
  reviewed_at: null,
  rejection_reason: null,
}));

watch(
  () => form.values.company,
  (val) => {
    if (val) emit("checkDuplicate", val);
  },
);

const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return `https://${trimmed}`;
};

const handleSubmit = async () => {
  formSubmitted.value = true;
  const { valid } = await form.validate();
  if (!valid) return;

  const values = form.values;
  const input: FeaturedJobInput = {
    title: values.title!,
    company: values.company!,
    location: values.location!,
    location_type: values.location_type as AdLocationType,
    clearance: values.clearance!,
    sponsor_category:
      (values.sponsor_category as SponsorCategory) || "NOT_SPECIFIED",
    salary: formatSalary(
      values.salary_min,
      values.salary_max,
      values.salary_period,
    ),
    pitch: values.pitch!,
    apply_url: normalizeUrl(values.apply_url!),
    priority: props.selectedTier === "premium" ? 2 : 1,
  };

  emit("submit", input);
};

const resetForm = () => {
  form.resetForm();
  formSubmitted.value = false;
  showPreview.value = false;
};

defineExpose({ resetForm });
</script>

<template>
  <div class="grid gap-8 lg:grid-cols-5">
    <form @submit.prevent="handleSubmit" class="space-y-6 lg:col-span-3">
      <div
        v-if="duplicateWarning"
        class="flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400"
      >
        <Icon name="mdi:alert-outline" class="h-4 w-4 shrink-0" />{{
          duplicateWarning
        }}
      </div>

      <div class="grid gap-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <Label
              for="job-title"
              class="text-muted-foreground text-xs tracking-wider uppercase"
              >Job Title *</Label
            >
            <Input
              id="job-title"
              :model-value="form.values.title"
              @update:model-value="
                (v) => form.setFieldValue('title', String(v))
              "
              placeholder="e.g. Senior Cyber Threat Analyst"
              class="h-10"
              maxlength="60"
            />
            <div class="flex justify-between">
              <p
                v-if="formSubmitted && form.errors.value.title"
                class="text-destructive text-xs"
              >
                {{ form.errors.value.title }}
              </p>
              <p class="text-muted-foreground ml-auto text-[10px]">
                {{ form.values.title?.length || 0 }}/60
              </p>
            </div>
          </div>
          <div class="space-y-1.5">
            <Label
              for="job-company"
              class="text-muted-foreground text-xs tracking-wider uppercase"
              >Company *</Label
            >
            <Input
              id="job-company"
              :model-value="form.values.company"
              @update:model-value="
                (v) => form.setFieldValue('company', String(v))
              "
              placeholder="e.g. Booz Allen Hamilton"
              class="h-10"
              maxlength="60"
            />
            <div class="flex justify-between">
              <p
                v-if="formSubmitted && form.errors.value.company"
                class="text-destructive text-xs"
              >
                {{ form.errors.value.company }}
              </p>
              <p class="text-muted-foreground ml-auto text-[10px]">
                {{ form.values.company?.length || 0 }}/60
              </p>
            </div>
          </div>
        </div>

        <!-- Location Section -->
        <div class="border-border/50 bg-muted/20 space-y-4 border p-4">
          <h3
            class="text-muted-foreground text-xs font-medium tracking-wider uppercase"
          >
            Location
          </h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label class="text-muted-foreground text-xs"
                >Work Location Type *</Label
              >
              <Select
                :model-value="form.values.location_type ?? ''"
                @update:model-value="
                  (v) =>
                    form.setFieldValue(
                      'location_type',
                      v as AdLocationType | undefined,
                    )
                "
              >
                <SelectTrigger class="h-10"
                  ><SelectValue placeholder="Select location type"
                /></SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="lt in locationTypes"
                    :key="lt.value"
                    :value="lt.value"
                    >{{ lt.label }}</SelectItem
                  >
                </SelectContent>
              </Select>
              <p
                v-if="formSubmitted && form.errors.value.location_type"
                class="text-destructive text-xs"
              >
                {{ form.errors.value.location_type }}
              </p>
            </div>
            <div class="space-y-1.5">
              <Label class="text-muted-foreground text-xs">Location *</Label>
              <Input
                :model-value="form.values.location"
                @update:model-value="
                  (v) => form.setFieldValue('location', String(v))
                "
                placeholder="e.g. Arlington, VA or Kuwait City"
                class="h-10"
                maxlength="100"
              />
              <div class="flex justify-between">
                <p
                  v-if="formSubmitted && form.errors.value.location"
                  class="text-destructive text-xs"
                >
                  {{ form.errors.value.location }}
                </p>
                <p class="text-muted-foreground ml-auto text-[10px]">
                  {{ form.values.location?.length || 0 }}/100
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <Label
              class="text-muted-foreground text-xs tracking-wider uppercase"
              >Clearance *</Label
            >
            <Select
              :model-value="form.values.clearance"
              @update:model-value="
                (v) => form.setFieldValue('clearance', String(v ?? ''))
              "
            >
              <SelectTrigger class="h-10"
                ><SelectValue placeholder="Select clearance level"
              /></SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="level in clearanceLevels"
                  :key="level.value"
                  :value="level.value"
                  >{{ level.label }}</SelectItem
                >
              </SelectContent>
            </Select>
            <p
              v-if="formSubmitted && form.errors.value.clearance"
              class="text-destructive text-xs"
            >
              {{ form.errors.value.clearance }}
            </p>
          </div>
          <div class="space-y-1.5">
            <Label
              class="text-muted-foreground text-xs tracking-wider uppercase"
              >Sponsor Category</Label
            >
            <Select
              :model-value="form.values.sponsor_category"
              @update:model-value="
                (v) =>
                  form.setFieldValue(
                    'sponsor_category',
                    String(v ?? 'NOT_SPECIFIED'),
                  )
              "
            >
              <SelectTrigger class="h-10"
                ><SelectValue placeholder="Select sponsor category"
              /></SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="cat in sponsorCategories"
                  :key="cat.value"
                  :value="cat.value"
                  >{{ cat.label }}</SelectItem
                >
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label class="text-muted-foreground text-xs tracking-wider uppercase"
            >Salary Range *</Label
          >
          <div class="grid grid-cols-5 gap-2">
            <div class="relative col-span-2">
              <span
                class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm"
                >$</span
              >
              <Input
                type="number"
                :model-value="form.values.salary_min"
                @update:model-value="
                  (v) =>
                    form.setFieldValue('salary_min', v ? Number(v) : undefined)
                "
                placeholder="Min"
                class="h-10 pl-7"
                min="0"
              />
            </div>
            <div class="relative col-span-2">
              <span
                class="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm"
                >$</span
              >
              <Input
                type="number"
                :model-value="form.values.salary_max"
                @update:model-value="
                  (v) =>
                    form.setFieldValue('salary_max', v ? Number(v) : undefined)
                "
                placeholder="Max"
                class="h-10 pl-7"
                min="0"
              />
            </div>
            <Select
              :model-value="form.values.salary_period"
              @update:model-value="
                (v) => form.setFieldValue('salary_period', v as SalaryPeriod)
              "
            >
              <SelectTrigger class="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="period in salaryPeriods"
                  :key="period.value"
                  :value="period.value"
                  >{{ period.label }}</SelectItem
                >
              </SelectContent>
            </Select>
          </div>
          <div class="flex justify-between">
            <p
              v-if="
                formSubmitted &&
                (form.errors.value.salary_min || form.errors.value.salary_max)
              "
              class="text-destructive text-xs"
            >
              {{ form.errors.value.salary_min || form.errors.value.salary_max }}
            </p>
            <p class="text-muted-foreground ml-auto text-[10px]">
              Preview: {{ formattedSalary }}
            </p>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label class="text-muted-foreground text-xs tracking-wider uppercase"
            >Pitch / Selling Point *</Label
          >
          <Textarea
            :model-value="form.values.pitch"
            @update:model-value="(v) => form.setFieldValue('pitch', String(v))"
            placeholder="What makes this role special?"
            class="min-h-20 resize-none"
            maxlength="120"
          />
          <div class="flex justify-between">
            <p
              v-if="formSubmitted && form.errors.value.pitch"
              class="text-destructive text-xs"
            >
              {{ form.errors.value.pitch }}
            </p>
            <p class="text-muted-foreground ml-auto text-[10px]">
              {{ form.values.pitch?.length || 0 }}/120
            </p>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label class="text-muted-foreground text-xs tracking-wider uppercase"
            >Apply URL *</Label
          >
          <div class="relative">
            <Icon
              name="mdi:link-variant"
              class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            />
            <Input
              :model-value="form.values.apply_url"
              @update:model-value="
                (v) => form.setFieldValue('apply_url', String(v))
              "
              placeholder="https://careers.example.com/job/123"
              class="h-10 pl-10"
              maxlength="500"
            />
          </div>
          <p
            v-if="formSubmitted && form.errors.value.apply_url"
            class="text-destructive text-xs"
          >
            {{ form.errors.value.apply_url }}
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-3 pt-4 sm:flex-row">
        <Button
          type="submit"
          size="lg"
          class="w-full sm:w-auto"
          :disabled="isSubmitting"
        >
          <Spinner v-if="isSubmitting" class="mr-2 h-4 w-4" />
          {{ isSubmitting ? "Creating..." : "Create Featured Job" }}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          class="w-full sm:w-auto lg:hidden"
          @click="showPreview = !showPreview"
        >
          <Icon
            :name="showPreview ? 'mdi:eye-off' : 'mdi:eye'"
            class="mr-2 h-4 w-4"
          />{{ showPreview ? "Hide Preview" : "Show Preview" }}
        </Button>
      </div>
    </form>

    <div class="hidden lg:col-span-2 lg:block">
      <div class="sticky top-4">
        <p
          class="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase"
        >
          Live Preview
        </p>
        <LegacyFeaturedJobCard :job="previewData" :is-preview="true" />
      </div>
    </div>

    <div v-if="showPreview" class="lg:hidden">
      <p
        class="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase"
      >
        Preview
      </p>
      <LegacyFeaturedJobCard :job="previewData" :is-preview="true" />
    </div>
  </div>
</template>
