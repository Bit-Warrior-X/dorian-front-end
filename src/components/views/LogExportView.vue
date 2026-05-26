<template>
  <div class="log-export-view">
    <div class="view-card">
      <h2>Log Export</h2>
      
      <div class="export-form">
        <div class="form-section">
          <h3>Export Configuration</h3>
          <div class="form-group">
            <label>Date Range</label>
            <div class="date-inputs">
              <input type="date" v-model="startDate" />
              <span>to</span>
              <input type="date" v-model="endDate" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Log Type</label>
            <select v-model="logType" class="form-select">
              <option value="access">Access Logs</option>
              <option value="error">Error Logs</option>
              <option value="security">Security Logs</option>
              <option value="all">All Logs</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Export Format</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="format" value="csv" />
                <span>CSV</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="format" value="json" />
                <span>JSON</span>
              </label>
              <label class="radio-label">
                <input type="radio" v-model="format" value="txt" />
                <span>TXT</span>
              </label>
            </div>
          </div>
          
          <button class="export-button" @click="handleExport">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Logs
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const startDate = ref('')
const endDate = ref('')
const logType = ref('access')
const format = ref('csv')

const handleExport = () => {
  alert(`Exporting ${logType.value} logs from ${startDate.value} to ${endDate.value} as ${format.value.toUpperCase()}`)
}
</script>

<style scoped>
.log-export-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: var(--space-card, 14px 16px);
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.view-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--app-heading);
  margin: 0 0 28px 0;
  letter-spacing: -0.5px;
}

.export-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--app-heading);
  margin: 0 0 20px 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--app-text-secondary);
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-inputs input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--app-input-bg);
  color: var(--app-text);
}

.form-select {
  padding: 12px 16px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--app-input-bg);
  color: var(--app-text);
  cursor: pointer;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--app-text-secondary);
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.export-button {
  align-self: flex-start;
}
</style>

