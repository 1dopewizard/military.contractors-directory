<script setup lang="ts">
import { CalendarDate, CalendarDateTime, toCalendarDateTime, parseAbsoluteToLocal, getLocalTimeZone } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

interface Props {
  modelValue?: string | null
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select date and time',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)

// Convert ISO string to CalendarDateTime for the calendar
const calendarValue = computed<DateValue | undefined>({
  get() {
    if (!props.modelValue) return undefined
    try {
      const date = new Date(props.modelValue)
      if (isNaN(date.getTime())) return undefined
      return new CalendarDateTime(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes()
      )
    } catch {
      return undefined
    }
  },
  set(val) {
    if (!val) return
    // Convert CalendarDateTime back to ISO string in local time
    const jsDate = new Date(val.year, val.month - 1, val.day, hours.value, minutes.value)
    emit('update:modelValue', jsDate.toISOString())
  }
})

// Separate time inputs
const hours = computed({
  get() {
    if (!props.modelValue) return 0
    const date = new Date(props.modelValue)
    return isNaN(date.getTime()) ? 0 : date.getHours()
  },
  set(val: number) {
    updateTime(val, minutes.value)
  }
})

const minutes = computed({
  get() {
    if (!props.modelValue) return 0
    const date = new Date(props.modelValue)
    return isNaN(date.getTime()) ? 0 : date.getMinutes()
  },
  set(val: number) {
    updateTime(hours.value, val)
  }
})

const updateTime = (h: number, m: number) => {
  if (!props.modelValue) return
  const date = new Date(props.modelValue)
  if (isNaN(date.getTime())) return
  date.setHours(h, m)
  emit('update:modelValue', date.toISOString())
}

const handleDateSelect = (val: DateValue | undefined) => {
  if (!val) return
  const jsDate = new Date(val.year, val.month - 1, val.day, hours.value, minutes.value)
  emit('update:modelValue', jsDate.toISOString())
}

// Format display value
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const date = new Date(props.modelValue)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
})

// Pad numbers for display
const padNumber = (n: number, len = 2) => String(n).padStart(len, '0')
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :disabled="disabled"
        :class="[
          'w-full justify-start text-left font-normal',
          !modelValue && 'text-muted-foreground'
        ]"
      >
        <Icon name="mdi:calendar-clock" class="mr-2 h-4 w-4" />
        <span v-if="displayValue">{{ displayValue }}</span>
        <span v-else>{{ placeholder }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <div class="p-3">
        <Calendar
          :model-value="calendarValue"
          @update:model-value="handleDateSelect"
          initial-focus
        />
        <Separator class="my-3" />
        <div class="flex items-center gap-2">
          <Label class="text-xs text-muted-foreground shrink-0">Time:</Label>
          <div class="flex items-center gap-1">
            <Input
              type="number"
              :model-value="hours"
              @update:model-value="(v: string | number) => hours = Number(v)"
              min="0"
              max="23"
              class="w-14 h-8 text-center"
            />
            <span class="text-muted-foreground">:</span>
            <Input
              type="number"
              :model-value="minutes"
              @update:model-value="(v: string | number) => minutes = Number(v)"
              min="0"
              max="59"
              class="w-14 h-8 text-center"
            />
          </div>
          <span class="text-xs text-muted-foreground ml-auto">
            {{ hours >= 12 ? 'PM' : 'AM' }}
          </span>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
