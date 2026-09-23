<template>
  <div class="dashboard-view log-export-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Log export</h2>
        <p>Download edge access, error, and security logs for offline analysis.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <section class="dash-grid12">
      <div class="dash-panel c-8 dash-chart-panel dash-chart-panel--info">
        <div class="dash-panel-head">
          <div>
            <h3>Export configuration</h3>
            <p class="dash-panel-desc">Choose a date range, log type, and download format</p>
          </div>
        </div>

        <form class="export-form" @submit.prevent="handleExport">
          <div class="export-field">
            <label for="export-start">Date range</label>
            <div class="export-date-row">
              <input id="export-start" v-model="startDate" type="date" class="dash-input" />
              <span class="export-date-sep">to</span>
              <input id="export-end" v-model="endDate" type="date" class="dash-input" />
            </div>
          </div>

          <div class="export-field">
            <label for="export-type">Log type</label>
            <select id="export-type" v-model="logType" class="dash-select">
              <option value="access">Access logs</option>
              <option value="error">Error logs</option>
              <option value="security">Security logs</option>
              <option value="all">All logs</option>
            </select>
          </div>

          <div class="export-field">
            <span class="export-field__label">Export format</span>
            <div class="export-format-row" role="radiogroup" aria-label="Export format">
              <label
                v-for="option in formatOptions"
                :key="option.value"
                class="export-format"
                :class="{ active: format === option.value }"
              >
                <input v-model="format" type="radio" :value="option.value" />
                <span>{{ option.label }}</span>
              </label>
            </div>
          </div>

          <div class="export-actions">
            <button type="submit" class="dash-filter-apply" :disabled="!canExport">
              Export logs
            </button>
          </div>
        </form>
      </div>

      <div class="dash-panel c-4">
        <div class="dash-panel-head">
          <div>
            <h3>Summary</h3>
            <p class="dash-panel-desc">Current selection</p>
          </div>
        </div>
        <div class="dash-kpi-strip export-summary">
          <article class="dash-kpi dash-kpi--info">
            <span class="dash-kpi__label">Log type</span>
            <span class="dash-kpi__value">{{ logTypeLabel }}</span>
          </article>
          <article class="dash-kpi dash-kpi--total">
            <span class="dash-kpi__label">Format</span>
            <span class="dash-kpi__value">{{ format.toUpperCase() }}</span>
          </article>
          <article class="dash-kpi dash-kpi--ok">
            <span class="dash-kpi__label">Range</span>
            <span class="dash-kpi__value export-summary__range">{{ rangeLabel }}</span>
            <span class="dash-kpi__hint">{{ rangeHint }}</span>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { notifyError, notifySuccess } from '@/utils/notify'

const EXPORT_TITLE = 'Log Export'

const startDate = ref('')
const endDate = ref('')
const logType = ref('access')
const format = ref('csv')

const formatOptions = [
  { label: 'CSV', value: 'csv' },
  { label: 'JSON', value: 'json' },
  { label: 'TXT', value: 'txt' },
]

const logTypeLabel = computed(() => {
  const map = {
    access: 'Access',
    error: 'Error',
    security: 'Security',
    all: 'All',
  }
  return map[logType.value] || logType.value
})

const canExport = computed(() => Boolean(startDate.value && endDate.value))

const rangeLabel = computed(() => {
  if (!startDate.value && !endDate.value) return '—'
  if (!startDate.value || !endDate.value) return 'Incomplete'
  return `${startDate.value} → ${endDate.value}`
})

const rangeHint = computed(() =>
  canExport.value ? 'Ready to export' : 'Select start and end dates',
)

const handleExport = () => {
  if (!canExport.value) {
    notifyError(EXPORT_TITLE, 'Select both a start and end date.')
    return
  }
  notifySuccess(
    EXPORT_TITLE,
    `Export queued for ${logTypeLabel.value.toLowerCase()} logs (${format.value.toUpperCase()}).`,
  )
}
</script>

<style scoped>
.log-export-view {
  max-width: 1680px;
  margin: 0 auto;
}

.export-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.export-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-field > label,
.export-field__label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.export-date-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.export-date-row .dash-input {
  flex: 1 1 160px;
  min-width: 0;
}

.export-date-sep {
  font-size: 12px;
  color: var(--app-text-muted);
}

.dash-input {
  background: var(--app-input-bg);
  border: 0.5px solid var(--app-border-strong);
  color: var(--app-text);
  font-size: var(--type-caption);
  padding: 8px 10px;
  border-radius: 6px;
}

.export-format-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.export-format {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted, var(--app-surface));
  color: var(--app-text-muted);
  cursor: pointer;
  font-size: 13px;
  font-weight: 550;
}

.export-format input {
  accent-color: var(--dorian-viper-500, var(--app-accent));
}

.export-format.active {
  color: var(--dorian-viper-400, var(--app-accent));
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 40%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 10%, var(--app-surface));
}

.export-actions {
  display: flex;
  justify-content: flex-start;
  padding-top: 4px;
}

.export-summary {
  grid-template-columns: 1fr;
}

.export-summary__range {
  font-size: 14px !important;
  word-break: break-word;
}

@media (max-width: 1100px) {
  .c-4,
  .c-8 {
    grid-column: span 12;
  }
}
</style>
