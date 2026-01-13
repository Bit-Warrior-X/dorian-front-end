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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.view-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1a202c 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  color: #1a202c;
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
  color: #374151;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-inputs input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
}

.form-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
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
  color: #374151;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.export-button {
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  align-self: flex-start;
}

.export-button svg {
  width: 20px;
  height: 20px;
}

.export-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}
</style>

