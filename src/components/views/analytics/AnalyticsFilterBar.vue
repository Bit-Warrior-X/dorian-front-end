<template>
  <div class="dash-filterbar">
    <div class="dash-filter-field">
      <label :for="`${idPrefix}-server`">Edge</label>
      <select :id="`${idPrefix}-server`" v-model="filters.selectedServer" class="dash-select" :disabled="loading">
        <option v-for="server in filters.serverOptions" :key="server.value" :value="server.value">
          {{ server.label }}
        </option>
      </select>
    </div>
    <div class="dash-filter-field">
      <label :for="`${idPrefix}-site`">Site</label>
      <select :id="`${idPrefix}-site`" v-model="filters.selectedSite" class="dash-select" :disabled="loading">
        <option v-for="site in filters.siteOptions" :key="site.value" :value="site.value">
          {{ site.label }}
        </option>
      </select>
    </div>
    <div class="dash-filter-field">
      <label>Time range</label>
      <div class="dash-range-pills">
        <button
          v-for="range in filters.timeRanges"
          :key="range.value"
          type="button"
          class="dash-range-pill"
          :class="{ active: filters.selectedTimeRange === range.value && !filters.isCustomRange }"
          :disabled="loading"
          @click="filters.selectTimeRange(range.value)"
        >
          {{ range.label }}
        </button>
        <button
          type="button"
          class="dash-range-pill dash-range-pill--custom"
          :class="{ active: filters.isCustomRange }"
          :disabled="loading"
          @click="filters.showCustomDialog = true"
        >
          Custom
        </button>
      </div>
    </div>
    <div class="dash-filter-summary">
      <span class="dash-live-dot" aria-hidden="true"></span>
      {{ filters.rangeLabel }}
    </div>
    <button type="button" class="dash-filter-apply" :disabled="loading" @click="filters.apply()">
      <span v-if="loading" class="dash-spinner dash-spinner--btn" aria-hidden="true"></span>
      {{ loading ? 'Loading…' : 'Apply' }}
    </button>

    <div v-if="filters.showCustomDialog" class="afb-overlay" @click.self="filters.showCustomDialog = false">
      <div class="afb-dialog" role="dialog" aria-modal="true" aria-label="Custom time range">
        <div class="afb-dialog__head">
          <h3>Custom time range</h3>
          <button type="button" class="afb-dialog__close" aria-label="Close" @click="filters.showCustomDialog = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="afb-dialog__body">
          <label>
            <span>Start</span>
            <FlatPickr v-model="filters.customStartDate" :config="pickerConfig" class="afb-input" placeholder="Select start time" />
          </label>
          <label>
            <span>End</span>
            <FlatPickr v-model="filters.customEndDate" :config="pickerConfig" class="afb-input" placeholder="Select end time" />
          </label>
        </div>
        <div class="afb-dialog__foot">
          <button type="button" class="secondary-btn" @click="filters.showCustomDialog = false">Cancel</button>
          <button
            type="button"
            class="primary-btn"
            :disabled="!filters.customStartDate || !filters.customEndDate"
            @click="filters.applyCustomRange()"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  filters: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  idPrefix: { type: String, default: 'analytics' },
})

const pickerConfig = { enableTime: true, time_24hr: true, dateFormat: 'Y-m-d H:i' }
</script>

<style scoped>
.afb-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(4px);
}

.afb-dialog {
  display: flex;
  flex-direction: column;
  width: min(440px, 100%);
  overflow: hidden;
  border-radius: 14px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}

.afb-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 0.5px solid var(--app-border);
}

.afb-dialog__head h3 {
  margin: 0;
  font-size: 15px !important;
  font-weight: 650;
  color: var(--app-heading);
}

.afb-dialog__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
}

.afb-dialog__close svg {
  width: 15px;
  height: 15px;
}

.afb-dialog__close:hover {
  background: var(--app-surface-muted);
  color: var(--app-heading);
}

.afb-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
}

.afb-dialog__body label {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.afb-dialog__body label > span {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.afb-input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: 13px;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
}

.afb-dialog__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}
</style>
