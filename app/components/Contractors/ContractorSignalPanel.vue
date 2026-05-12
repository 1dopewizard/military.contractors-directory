<!--
  @file ContractorSignalPanel
  @description Source-backed contractor intelligence signal cards
-->

<script setup lang="ts">
import { computed } from "vue";
import type { ContractorSignal } from "@/app/types/intelligence.types";

const props = defineProps<{
  signals: ContractorSignal[];
  warnings?: string[];
}>();

const statusLabels: Record<ContractorSignal["status"], string> = {
  healthy: "Healthy",
  watch: "Watch",
  concentrated: "Concentrated",
  growing: "Growing",
  declining: "Declining",
  stable: "Stable",
  fresh: "Fresh",
  stale: "Stale",
  unavailable: "Unavailable",
};

const statusClasses: Record<ContractorSignal["status"], string> = {
  healthy:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  watch:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  concentrated:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  growing: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  declining:
    "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  stable: "border-border bg-muted/40 text-muted-foreground",
  fresh:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  stale:
    "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  unavailable: "border-border bg-muted/40 text-muted-foreground",
};

const publicSignals = computed(() => props.signals ?? []);
</script>

<template>
  <section
    class="border-border border-t pt-10"
    aria-labelledby="contractor-signals-heading"
  >
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p
          class="text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase"
        >
          Contractor intelligence
        </p>
        <h2
          id="contractor-signals-heading"
          class="text-foreground mt-2 text-2xl font-semibold tracking-tight"
        >
          Transparent public-data signals
        </h2>
      </div>
      <p class="text-muted-foreground max-w-2xl text-sm leading-relaxed">
        Signals summarize USAspending-backed activity with caveats and source
        fields. They are not grades, responsibility determinations, or paid
        rankings.
      </p>
    </div>

    <div
      v-if="warnings?.length"
      class="border-border bg-muted/20 mt-6 border-l-2 px-4 py-3"
    >
      <p class="text-foreground text-sm font-medium">Source warnings</p>
      <ul class="text-muted-foreground mt-2 space-y-1 text-sm">
        <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
      </ul>
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="signal in publicSignals"
        :key="signal.key"
        class="border-border bg-card/40 hover:bg-card/70 flex min-h-full flex-col border p-5 transition-colors"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-foreground font-medium">{{ signal.label }}</h3>
            <p
              v-if="signal.value"
              class="text-foreground mt-2 text-2xl font-semibold tracking-tight"
            >
              {{ signal.value }}
            </p>
          </div>
          <span
            class="inline-flex shrink-0 items-center border px-2 py-1 text-xs font-medium"
            :class="statusClasses[signal.status]"
          >
            {{ statusLabels[signal.status] }}
          </span>
        </div>

        <p class="text-muted-foreground mt-4 text-sm leading-relaxed">
          {{ signal.explanation }}
        </p>

        <dl class="mt-5 space-y-3 text-xs">
          <div>
            <dt class="text-muted-foreground tracking-wide uppercase">
              Window
            </dt>
            <dd class="text-foreground mt-1">{{ signal.calculationWindow }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground tracking-wide uppercase">
              Source fields
            </dt>
            <dd class="text-foreground mt-1">
              {{ signal.sourceFields.join(", ") }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground tracking-wide uppercase">
              Confidence
            </dt>
            <dd class="text-foreground mt-1 capitalize">
              {{ signal.confidence }}
            </dd>
          </div>
        </dl>

        <ul
          v-if="signal.caveats.length"
          class="text-muted-foreground mt-5 space-y-1 text-xs leading-relaxed"
        >
          <li v-for="caveat in signal.caveats" :key="caveat">{{ caveat }}</li>
        </ul>

        <div v-if="signal.sourceLinks.length" class="mt-auto pt-5">
          <NuxtLink
            :to="signal.sourceLinks[0]?.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            View source
            <Icon name="mdi:open-in-new" class="h-3 w-3" />
          </NuxtLink>
        </div>
      </article>
    </div>
  </section>
</template>
