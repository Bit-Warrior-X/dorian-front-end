<template>
  <span class="status-corner-cluster">
    <button
      v-if="refreshable"
      type="button"
      class="status-refresh-btn"
      :class="{ 'status-refresh-btn--spinning': loading }"
      :disabled="loading || refreshDisabled"
      :title="refreshTitle"
      :aria-label="refreshTitle"
      @click="$emit('refresh')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>
    </button>
    <span class="status-corner-wrap" :title="title">
      <span class="status-circle-bg" :class="dotClasses" aria-hidden="true"></span>
      <span class="status-circle" :class="dotClasses" aria-hidden="true"></span>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { runtimeStatusClass } from '@/utils/serverLayerStatus'

const props = defineProps({
  status: { type: String, default: 'unknown' },
  loading: { type: Boolean, default: false },
  title: { type: String, default: '' },
  refreshable: { type: Boolean, default: false },
  refreshDisabled: { type: Boolean, default: false },
  refreshTitle: { type: String, default: 'Refresh' },
})

defineEmits(['refresh'])

const dotClasses = computed(() => {
  if (props.loading) return ['status-dot--loading']
  return [`status-dot--${runtimeStatusClass(props.status)}`]
})
</script>

<style scoped>
.status-corner-cluster {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.status-refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}

.status-refresh-btn:hover:not(:disabled) {
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.status-refresh-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.status-refresh-btn svg {
  width: 14px;
  height: 14px;
}

.status-refresh-btn--spinning svg {
  animation: status-refresh-spin 0.9s linear infinite;
}

.status-corner-wrap {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
}

.status-circle-bg,
.status-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.status-circle-bg {
  width: 22px;
  height: 22px;
  opacity: 0.22;
}

.status-circle {
  width: 10px;
  height: 10px;
  border: 2px solid transparent;
  box-sizing: border-box;
}

.status-dot--running {
  background: #22c55e;
  border-color: #16a34a;
}

.status-circle-bg.status-dot--running {
  background: #22c55e;
}

.status-dot--stopped {
  background: #ef4444;
  border-color: #dc2626;
}

.status-circle-bg.status-dot--stopped {
  background: #ef4444;
}

.status-dot--deployed {
  background: #3b82f6;
  border-color: #2563eb;
}

.status-circle-bg.status-dot--deployed {
  background: #3b82f6;
}

.status-dot--unknown {
  background: #94a3b8;
  border-color: #64748b;
}

.status-circle-bg.status-dot--unknown {
  background: #94a3b8;
}

.status-dot--na {
  background: transparent;
  border-color: #cbd5e1;
}

.status-circle-bg.status-dot--na {
  background: #cbd5e1;
  opacity: 0.35;
}

.status-dot--loading {
  background: #cbd5e1;
  border-color: #94a3b8;
  animation: status-dot-shimmer 1.1s ease-in-out infinite;
}

.status-circle-bg.status-dot--loading {
  background: #cbd5e1;
  animation: status-dot-shimmer 1.1s ease-in-out infinite;
}

@keyframes status-dot-shimmer {
  0% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.85;
  }
  100% {
    opacity: 0.35;
  }
}

@keyframes status-refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
