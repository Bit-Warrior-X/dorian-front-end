<template>
  <section class="status-card">
    <header class="status-card-header">
      <h4 class="status-card-title">{{ title }}</h4>
      <StatusCornerDot
        refreshable
        :status="status"
        :loading="busy"
        :title="busy ? 'Working…' : statusLabel"
        :refresh-title="busy ? 'Refreshing…' : 'Refresh status'"
        @refresh="$emit('refresh')"
      />
    </header>
    <div class="status-card-body">
      <div class="status-details">
        <div v-for="row in detailRows" :key="row.label" class="status-detail-row">
          <span class="status-detail-label">{{ row.label }}</span>
          <span class="status-detail-value">{{ row.value }}</span>
        </div>
      </div>
    </div>
    <footer class="status-card-actions status-card-actions--row">
      <button
        type="button"
        class="service-action-btn service-action-btn--start"
        :disabled="busy || status === 'running'"
        @click="$emit('start')"
      >
        Start
      </button>
      <button
        type="button"
        class="service-action-btn service-action-btn--stop"
        :disabled="busy || status === 'stopped'"
        @click="$emit('stop')"
      >
        Stop
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { serviceStatusDetailRows } from '@/utils/serverLayerStatus'
import StatusCornerDot from '../StatusCornerDot.vue'

const props = defineProps({
  title: { type: String, required: true },
  service: {
    type: String,
    required: true,
    validator: (value) => ['angelos', 'sparta', 'athens'].includes(value),
  },
  server: { type: Object, default: null },
  status: { type: String, default: 'unknown' },
  statusLabel: { type: String, default: 'Unknown' },
  lastCheckedAt: { type: [Date, String, Number], default: null },
  busy: { type: Boolean, default: false },
})

defineEmits(['start', 'stop', 'refresh'])

const detailRows = computed(() =>
  serviceStatusDetailRows(props.service, props.server, props.status, props.lastCheckedAt)
)
</script>

<style scoped>
.status-card {
  display: flex;
  flex-direction: column;
  min-height: 320px;
  border: 1px solid var(--app-border-strong);
  border-radius: 14px;
  background: var(--app-surface-solid);
  overflow: hidden;
}

.status-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--app-border-strong);
}

.status-card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
  line-height: 1.2;
}

.status-card-body {
  flex: 1;
  padding: 14px 16px;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-detail-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.status-detail-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-detail-value {
  font-size: 0.84rem;
  color: var(--app-text-secondary);
  line-height: 1.4;
  word-break: break-word;
}

.status-card-actions--row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--app-border-strong);
}

.service-action-btn {
  flex: 1 1 0;
  min-width: 0;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.service-action-btn--start {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface);
  color: var(--app-text-secondary);
}

.service-action-btn--start:hover:not(:disabled) {
  background: var(--app-surface-hover);
  border-color: var(--app-border-strong);
  color: var(--app-text);
}

.service-action-btn--stop {
  border: 1px solid #dc2626;
  background: #dc2626;
  color: #fff;
}

.service-action-btn--stop:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}

.service-action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
