<template>
  <div class="usage-metric">
    <div class="usage-metric-header">
      <span class="usage-metric-label">{{ label }}</span>
      <span class="usage-metric-value">{{ displayValue }}</span>
    </div>
    <div
      class="usage-bar"
      :class="{ 'usage-bar--loading': loading, 'usage-bar--empty': percent == null }"
      role="progressbar"
      :aria-valuenow="percent != null ? Math.round(percent) : undefined"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`${label} usage`"
    >
      <div
        v-if="percent != null"
        class="usage-bar-fill"
        :class="levelClass"
        :style="{ width: `${Math.min(100, Math.max(0, percent))}%` }"
      ></div>
    </div>
    <p v-if="detail" class="usage-metric-detail">{{ detail }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  percent: { type: Number, default: null },
  displayValue: { type: String, default: '—' },
  detail: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

const levelClass = computed(() => {
  if (props.percent == null) return 'usage-bar-fill--unknown'
  if (props.percent >= 85) return 'usage-bar-fill--high'
  if (props.percent >= 70) return 'usage-bar-fill--medium'
  return 'usage-bar-fill--low'
})
</script>

<style scoped>
.usage-metric {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.usage-metric-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.usage-metric-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.usage-metric-value {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 650;
  color: var(--app-heading);
  white-space: nowrap;
}

.usage-bar {
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-border) 85%, transparent);
  overflow: hidden;
}

.usage-bar--empty {
  opacity: 0.6;
}

.usage-bar--loading {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--app-border) 60%, transparent) 0%,
    var(--app-border-strong) 50%,
    color-mix(in srgb, var(--app-border) 60%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: usage-bar-shimmer 1.2s ease-in-out infinite;
}

.usage-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.35s ease;
}

.usage-bar-fill--low {
  background: var(--dorian-viper-400, #3fbd85);
}

.usage-bar-fill--medium {
  background: var(--dorian-warn, #e0a83f);
}

.usage-bar-fill--high {
  background: var(--dorian-danger, #e15241);
}

.usage-bar-fill--unknown {
  background: var(--app-border-strong);
}

.usage-metric-detail {
  margin: 0;
  font-size: 11px;
  color: var(--app-text-muted);
  line-height: 1.35;
}

@keyframes usage-bar-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>
