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
  gap: 6px;
}

.usage-metric-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.usage-metric-label {
  font-size: 0.9rem;
  color: var(--app-text-muted);
  font-weight: 600;
}

.usage-metric-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--app-text);
  white-space: nowrap;
}

.usage-bar {
  position: relative;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.22);
  overflow: hidden;
}

.usage-bar--empty {
  background: rgba(148, 163, 184, 0.16);
}

.usage-bar--loading {
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.14) 0%,
    rgba(148, 163, 184, 0.32) 50%,
    rgba(148, 163, 184, 0.14) 100%
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
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.usage-bar-fill--medium {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.usage-bar-fill--high {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.usage-bar-fill--unknown {
  background: #94a3b8;
}

.usage-metric-detail {
  margin: 0;
  font-size: 0.76rem;
  color: var(--app-text-muted);
  line-height: 1.3;
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
