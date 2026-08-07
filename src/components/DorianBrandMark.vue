<template>
  <component :is="wordmark ? 'div' : 'span'" :class="rootClasses">
    <span :class="markClasses" :style="markStyle" aria-hidden="true">
      <svg v-if="variant === 'badge'" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="22" fill="#2E9E6C" />
        <path
          d="M9,50 S27,22 50,22 S91,50 91,50 S73,78 50,78 S9,50 9,50 Z"
          fill="#0B0F0D"
        />
        <rect x="45" y="32" width="10" height="36" rx="5" fill="#C9A24A" />
      </svg>
      <svg v-else viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4,50 S24,16 50,16 S96,50 96,50 S76,84 50,84 S4,50 4,50 Z"
          :fill="monoFill"
        />
        <rect x="44" y="28" width="12" height="44" rx="6" :fill="pupilFill" />
      </svg>
    </span>
    <span v-if="wordmark" :class="wordmarkClasses">DORIAN</span>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'badge',
    validator: (value) => ['badge', 'mark'].includes(value)
  },
  size: {
    type: [String, Number],
    default: 'md'
  },
  wordmark: {
    type: Boolean,
    default: false
  },
  tone: {
    type: String,
    default: 'dark',
    validator: (value) => ['dark', 'light'].includes(value)
  },
  wordmarkClass: {
    type: String,
    default: ''
  },
  markClass: {
    type: String,
    default: ''
  }
})

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 30,
  lg: 36,
  xl: 48
}

const resolvedSize = computed(() => {
  if (typeof props.size === 'number') return props.size
  return sizeMap[props.size] ?? sizeMap.md
})

const monoFill = computed(() => (props.tone === 'light' ? '#1F6E4A' : '#2E9E6C'))
const pupilFill = computed(() => (props.tone === 'light' ? '#F4F1E9' : '#0B0F0D'))

const rootClasses = computed(() => [
  'dorian-brand',
  props.wordmark ? 'dorian-brand--with-wordmark' : null
])

const markClasses = computed(() => [
  'dorian-brand__mark',
  props.variant === 'badge' ? 'dorian-brand__mark--badge' : 'dorian-brand__mark--mono',
  props.markClass
])

const wordmarkClasses = computed(() => [
  'dorian-brand__wordmark',
  props.wordmarkClass
])

const markStyle = computed(() => ({
  width: `${resolvedSize.value}px`,
  height: `${resolvedSize.value}px`
}))
</script>

