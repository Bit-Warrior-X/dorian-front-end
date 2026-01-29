<template>
  <div class="security-analytics-view">
    <div class="filters-card">
      <div class="filters-row">
        <div class="filters-left">
          <span class="filter-inline-label">Server</span>
          <select id="security-server" v-model="selectedServer" class="inline-select">
            <option v-for="server in serverOptions" :key="server.value" :value="server.value">
              {{ server.label }}
            </option>
          </select>
        </div>
        <div class="filters-center">
          <span class="selected-range-label">Selected</span>
          <span class="selected-range-value">{{ selectedRangeLabel }}</span>
        </div>
        <div class="filters-right">
          <span class="filter-inline-label">Time Range  </span>
          <div class="time-buttons">
            <button
              v-for="range in timeRanges"
              :key="range.value"
              type="button"
              class="time-btn"
              :class="{ active: selectedTimeRange === range.value && !isCustomRange }"
              @click="selectTimeRange(range.value)"
            >
              {{ range.label }}
            </button>
            <button
              type="button"
              class="time-btn custom-btn"
              :class="{ active: isCustomRange }"
              @click="showCustomDialog = true"
            >
              Custom
            </button>
          </div>
          <button type="button" class="apply-filter-btn" @click="applyFilters">
            Apply
          </button>
        </div>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon security">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="M7 13l4-4 4 4 5-6"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total Traffic</h3>
          <p class="stat-value">{{ sampleStats.totalTraffic }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4v16h16"></path>
            <path d="M4 14h4l4-6 4 3 4-5"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Bandwidth (Last)</h3>
          <p class="stat-value">{{ sampleStats.bandwidthLast }}</p>
          <p class="stat-subvalue">{{ sampleStats.bandwidthLastTime }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12h18"></path>
            <path d="M7 8h10"></path>
            <path d="M7 16h10"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total Request</h3>
          <p class="stat-value">{{ sampleStats.totalRequest }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon security">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18"></path>
            <path d="M3 12h18"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total Response</h3>
          <p class="stat-value">{{ sampleStats.totalResponse }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M8 12h8"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>IP Count</h3>
          <p class="stat-value">{{ sampleStats.ipCount }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7h16"></path>
            <path d="M4 12h10"></path>
            <path d="M4 17h7"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Referer</h3>
          <p class="stat-value">{{ sampleStats.referer }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon security">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 11h18"></path>
            <path d="M5 7h14"></path>
            <path d="M7 15h10"></path>
            <circle cx="12" cy="19" r="2"></circle>
          </svg>
        </div>
        <div class="stat-info">
          <h3>ISP Count</h3>
          <p class="stat-value">{{ sampleStats.ispCount }}</p>
        </div>
      </div>
    </div>
    <div v-if="showCustomDialog" class="dialog-overlay" @click.self="showCustomDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Custom Time Range</h3>
          <button class="dialog-close" @click="showCustomDialog = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <div class="dialog-form-group">
            <label>Start Date & Time</label>
            <input type="datetime-local" v-model="customStartDate" class="dialog-input" />
          </div>
          <div class="dialog-form-group">
            <label>End Date & Time</label>
            <input type="datetime-local" v-model="customEndDate" class="dialog-input" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn cancel-btn" @click="showCustomDialog = false">Cancel</button>
          <button class="dialog-btn apply-btn" @click="applyCustomRange">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { serverList } from '@/data/servers'

const selectedServer = ref('all')
const selectedTimeRange = ref('30m')
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref('')
const customEndDate = ref('')
const appliedFilters = ref({
  server: 'all',
  range: '30m',
  isCustom: false,
  customStart: '',
  customEnd: '',
})
const sampleStats = {
  totalTraffic: '128.4 GB',
  bandwidthLast: '842 Mbps',
  bandwidthLastTime: '2025/1/29 12:23:12',
  totalRequest: '1,284,992',
  totalResponse: '1,273,110',
  ipCount: '12,430',
  referer: '126',
  ispCount: '214',
}

const serverOptions = computed(() => [
  { label: 'All Servers', value: 'all' },
  ...serverList.map((server) => ({ label: server.name, value: server.id })),
])

const selectedRangeLabel = computed(() => {
  if (isCustomRange.value) {
    if (customStartDate.value && customEndDate.value) {
      return `${customStartDate.value.replace('T', ' ')} → ${customEndDate.value.replace('T', ' ')}`
    }
    return 'Custom'
  }
  const found = timeRanges.find((range) => range.value === selectedTimeRange.value)
  return found?.label || 'All'
})

const timeRanges = [
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '2h', value: '2h' },
  { label: '4h', value: '4h' },
  { label: '6h', value: '6h' },
  { label: '8h', value: '8h' },
  { label: '12h', value: '12h' },
  { label: '24h', value: '24h' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Today', value: 'today' },
]

const selectTimeRange = (value) => {
  selectedTimeRange.value = value
  isCustomRange.value = false
}

const applyCustomRange = () => {
  if (customStartDate.value && customEndDate.value) {
    isCustomRange.value = true
    selectedTimeRange.value = 'custom'
    showCustomDialog.value = false
  }
}

const applyFilters = () => {
  appliedFilters.value = {
    server: selectedServer.value,
    range: selectedTimeRange.value,
    isCustom: isCustomRange.value,
    customStart: customStartDate.value,
    customEnd: customEndDate.value,
  }
}
</script>

<style scoped>
.security-analytics-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filters-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.filters-header h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.filters-left,
.filters-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filters-left {
  flex: 1 1 240px;
}

.filters-center {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 1 auto;
  justify-content: center;
  color: #475569;
  font-weight: 600;
}

.filters-right {
  flex: 2 1 360px;
  justify-content: flex-end;
  margin-left: auto;
}

.filter-inline-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.inline-select {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.95rem;
  background: white;
  color: #1a202c;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-width: 200px;
}

.inline-select:focus {
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.selected-range-label {
  font-size: 0.85rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.selected-range-value {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
  font-size: 0.85rem;
  font-weight: 600;
}

.time-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-btn {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #374151;
  transition: all 0.2s ease;
}

.time-btn:hover {
  border-color: #cbd5f5;
}

.time-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.custom-btn {
  border-left: 2px solid #e5e7eb;
  margin-left: 4px;
}

.custom-btn.active {
  border-left-color: transparent;
}

.apply-filter-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.apply-filter-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a202c;
}

.dialog-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border-radius: 6px;
}

.dialog-body {
  padding: 20px 24px;
}

.dialog-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.dialog-form-group label {
  font-size: 0.85rem;
  color: #4b5563;
}

.dialog-input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
}

.dialog-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.apply-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(102, 126, 234, 0.2);
}

.stat-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.stat-icon.security {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon svg {
  width: 36px;
  height: 36px;
}

.stat-info h3 {
  font-size: 0.875rem;
  color: #718096;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.stat-subvalue {
  margin: 6px 0 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #10b981;
}

</style>

