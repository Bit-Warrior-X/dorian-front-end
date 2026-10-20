<template>
  <section class="status-card" :class="`status-card--${status}`">
    <header class="status-card-header">
      <h4 class="status-card-title info-hint-heading">
        <span>{{ title }}</span>
        <InfoHint v-if="roleHint" :text="roleHint" :aria-label="`${title} help`" />
      </h4>
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
        <div
          v-for="row in detailRows"
          :key="row.label"
          class="status-detail-row"
          :class="{
            'status-detail-row--warning': row.tone === 'warning',
            'status-detail-row--muted': row.tone === 'muted',
          }"
        >
          <span class="status-detail-label">{{ row.label }}</span>
          <span class="status-detail-value" :title="row.title || undefined">{{ row.value }}</span>
        </div>
      </div>
    </div>
    <footer class="status-card-actions status-card-actions--row">
      <button
        type="button"
        class="service-action-btn service-action-btn--start"
        :disabled="busy || status === 'running' || status === 'na'"
        :title="status === 'na' ? 'This feature is disabled because the license does not include it' : undefined"
        @click="$emit('start')"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3.5v9l7-4.5-7-4.5z" /></svg>
        Start
      </button>
      <button
        type="button"
        class="service-action-btn service-action-btn--stop"
        :disabled="busy || status === 'stopped' || status === 'na'"
        :title="status === 'na' ? 'This feature is disabled because the license does not include it' : undefined"
        @click="$emit('stop')"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="4" y="4" width="8" height="8" rx="1.5" /></svg>
        Stop
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { serviceStatusDetailRows, serviceStatusRoleHint } from '@/utils/serverLayerStatus'
import InfoHint from '../InfoHint.vue'
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

const now = ref(Date.now())
let clockTimer

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  window.clearInterval(clockTimer)
})

const detailRows = computed(() =>
  serviceStatusDetailRows(props.service, props.server, props.status, props.lastCheckedAt, now.value)
)

const roleHint = computed(() => serviceStatusRoleHint(props.service))
</script>

<style scoped>
.status-card {
  --svc-tone: var(--app-text-muted);
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 0.5px solid var(--app-border);
  border-radius: 12px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--svc-tone) 7%, transparent) 0%, transparent 42%),
    var(--app-surface-muted);
  overflow: hidden;
}

.status-card--running { --svc-tone: var(--dorian-viper-400, #3fbd85); }
.status-card--stopped { --svc-tone: var(--dorian-danger, #e15241); }
.status-card--deployed { --svc-tone: var(--dorian-l4, #6b9fd4); }
.status-card--unknown { --svc-tone: var(--dorian-warn, #e0a83f); }

.status-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 0.5px solid var(--app-border);
}

.status-card-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.2;
}

.status-card-body {
  flex: 1;
  padding: 6px 14px;
}

.status-details {
  display: flex;
  flex-direction: column;
}

.status-detail-row {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: baseline;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 0.5px solid color-mix(in srgb, var(--app-border) 70%, transparent);
}

.status-detail-row:last-child { border-bottom: 0; }

.status-detail-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-detail-value {
  font-size: 12.5px;
  color: var(--app-text);
  line-height: 1.4;
  word-break: break-word;
}

.status-detail-row--warning .status-detail-value {
  color: var(--dorian-warn, #e0a83f);
  font-weight: 600;
}

.status-detail-row--muted .status-detail-value {
  color: var(--app-text-muted);
}

.status-card-actions--row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 10px 14px 12px;
  border-top: 0.5px solid var(--app-border);
}

.service-action-btn {
  flex: 1 1 0;
  min-width: 0;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  padding: 6px 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.service-action-btn svg { width: 11px; height: 11px; }

.service-action-btn--start {
  border: 0.5px solid color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 45%, transparent);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 10%, transparent);
  color: var(--dorian-viper-400, #3fbd85);
}

.service-action-btn--start:hover:not(:disabled) {
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 18%, transparent);
}

.service-action-btn--stop {
  border: 0.5px solid color-mix(in srgb, var(--dorian-danger, #e15241) 45%, transparent);
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 10%, transparent);
  color: var(--dorian-danger, #e15241);
}

.service-action-btn--stop:hover:not(:disabled) {
  background: var(--dorian-danger, #e15241);
  border-color: var(--dorian-danger, #e15241);
  color: #fff;
}

.service-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--app-border);
  background: transparent;
  color: var(--app-text-muted);
}
</style>
