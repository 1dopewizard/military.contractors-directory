<script setup lang="ts">
import { ref, watch } from "vue";
import { Calendar as CalendarIcon } from "lucide-vue-next";
import {
  DateFormatter,
  type DateValue,
  getLocalTimeZone,
  parseDate,
  today,
} from "@internationalized/date";
import { cn } from "@/app/lib/utils";

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const df = new DateFormatter("en-US", {
  dateStyle: "long",
});

const value = ref<DateValue>();

watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      value.value = undefined;
      return;
    }
    const normalizedValue: string = newVal ?? "";
    try {
      // Handle ISO string (YYYY-MM-DDTHH:mm:ss.sssZ) -> YYYY-MM-DD
      const datePart = normalizedValue.includes("T")
        ? normalizedValue.split("T")[0]
        : normalizedValue;
      value.value = parseDate(datePart as string);
    } catch (e) {
      console.error("Invalid date format:", normalizedValue);
    }
  },
  { immediate: true },
);

watch(value, (newVal) => {
  if (newVal) {
    // Return generic ISO date string (YYYY-MM-DD)
    // Note: We aren't handling time here, assuming start of day
    emit("update:modelValue", newVal.toString());
  } else {
    emit("update:modelValue", ""); // Clear
  }
});
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="ghost"
        :class="
          cn(
            'bg-muted/30 border-border/50 h-10 w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )
        "
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{
          value
            ? df.format(value.toDate(getLocalTimeZone()))
            : placeholder || "Pick a date"
        }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar v-model="value" initial-focus />
    </PopoverContent>
  </Popover>
</template>
