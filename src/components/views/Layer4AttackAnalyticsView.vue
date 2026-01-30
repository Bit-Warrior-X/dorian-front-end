<template>
  <div class="layer4-attack-view">
    <div class="filters-card">
      <div class="filters-row">
        <div class="filters-left">
          <span class="filter-inline-label">Server</span>
          <select id="layer4-server" v-model="selectedServer" class="inline-select">
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
          <span class="filter-inline-label">Time Range</span>
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
    <div class="view-card">
      <h2>Layer 4 Attack Analytics</h2>
      
      <div class="attack-stats">
        <div class="attack-stat-card">
          <div class="attack-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div class="attack-info">
            <h3>Total Traffic</h3>
            <p class="attack-value">2.8 Tbps</p>
            <span class="attack-change positive">+6% from last week</span>
          </div>
        </div>

        <div class="attack-stat-card">
          <div class="attack-icon success">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="attack-info">
            <h3>Allowed Traffic</h3>
            <p class="attack-value">2.1 Tbps</p>
            <span class="attack-change positive">+4% from last week</span>
          </div>
        </div>

        <div class="attack-stat-card">
          <div class="attack-icon blocked">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div class="attack-info">
            <h3>Blocked Traffic</h3>
            <p class="attack-value">0.7 Tbps</p>
            <span class="attack-change positive">+10% from last week</span>
          </div>
        </div>
      </div>

      <div class="attack-charts">
        <div class="attack-chart-card attack-chart-card--single">
          <div class="chart-header">
            <h3>Allowed vs Blocked Traffic by Time</h3>
            <span class="chart-pill">Sample</span>
          </div>
          <div class="chart-body">
            <div ref="trafficChart"></div>
          </div>
        </div>
        <div class="attack-chart-card attack-chart-card--single">
          <div class="chart-header">
            <h3>IP Protocols by Time</h3>
            <span class="chart-pill">Sample</span>
          </div>
          <div class="chart-body">
            <div ref="protocolChart"></div>
          </div>
        </div>
      </div>
      
      <div class="attack-table-card">
        <h3>Recent Attack Attempts</h3>
        <table class="attack-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source IP</th>
              <th>Attack Type</th>
              <th>Target Port</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>10:23:45</td>
              <td>203.0.113.45</td>
              <td><span class="badge attack-syn">SYN Flood</span></td>
              <td>80</td>
              <td><span class="badge status-blocked">Blocked</span></td>
              <td><button class="action-btn">View</button></td>
            </tr>
            <tr>
              <td>10:20:12</td>
              <td>198.51.100.23</td>
              <td><span class="badge attack-udp">UDP Flood</span></td>
              <td>443</td>
              <td><span class="badge status-blocked">Blocked</span></td>
              <td><button class="action-btn">View</button></td>
            </tr>
            <tr>
              <td>10:15:33</td>
              <td>192.0.2.67</td>
              <td><span class="badge attack-icmp">ICMP Flood</span></td>
              <td>22</td>
              <td><span class="badge status-blocked">Blocked</span></td>
              <td><button class="action-btn">View</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="showCustomDialog" class="dialog-overlay" @click.self="showCustomDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Custom Time Range</h3>
          <button class="dialog-close" @click="showCustomDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <label>
            Start
            <input v-model="customStartDate" type="datetime-local" class="dialog-input" />
          </label>
          <label>
            End
            <input v-model="customEndDate" type="datetime-local" class="dialog-input" />
          </label>
        </div>
        <div class="dialog-actions">
          <button type="button" class="apply-filter-btn" @click="applyCustomRange">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ApexCharts from 'apexcharts'
import { serverList } from '@/data/servers'

const selectedServer = ref(serverList?.[0]?.id ?? 'all')
const selectedTimeRange = ref('1h')
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref('')
const customEndDate = ref('')
const appliedFilters = ref({
  server: selectedServer.value,
  range: selectedTimeRange.value,
  start: null,
  end: null,
})
const trafficChart = ref(null)
const protocolChart = ref(null)
let trafficChartInstance = null
let protocolChartInstance = null

const timeRanges = [
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Today', value: 'today' },
]

const serverOptions = computed(() => [
  { label: 'All Servers', value: 'all' },
  ...serverList.map((server) => ({ label: server.name, value: server.id })),
])

const selectTimeRange = (value) => {
  selectedTimeRange.value = value
  isCustomRange.value = false
}

const applyCustomRange = () => {
  if (!customStartDate.value || !customEndDate.value) return
  isCustomRange.value = true
  selectedTimeRange.value = 'custom'
  appliedFilters.value = {
    server: selectedServer.value,
    range: 'custom',
    start: customStartDate.value,
    end: customEndDate.value,
  }
  showCustomDialog.value = false
}

const applyFilters = () => {
  appliedFilters.value = {
    server: selectedServer.value,
    range: selectedTimeRange.value,
    start: isCustomRange.value ? customStartDate.value : null,
    end: isCustomRange.value ? customEndDate.value : null,
  }
}

const selectedRangeLabel = computed(() => {
  if (isCustomRange.value && customStartDate.value && customEndDate.value) {
    return `${customStartDate.value} ~ ${customEndDate.value}`
  }
  const match = timeRanges.find((range) => range.value === selectedTimeRange.value)
  return match?.label ?? 'Custom'
})

const randomTraffic = (base = 1800) => {
  const jitter = (Math.random() - 0.5) * 500
  return Math.max(200, Math.round(base + jitter))
}

const buildTrafficSeries = (base) => {
  const points = 24
  const now = Date.now()
  const interval = 5 * 60 * 1000
  const data = Array.from({ length: points }, (_, index) => ({
    x: now - (points - 1 - index) * interval,
    y: randomTraffic(base),
  }))
  return [{ name: 'Traffic', data }]
}

const protocolSeriesNames = ['TCP', 'UDP', 'ICMP', 'GRE', 'OTHER']
const buildProtocolSeries = () => {
  const points = 24
  const now = Date.now()
  const interval = 5 * 60 * 1000
  return protocolSeriesNames.map((name, index) => {
    const base = 900 - index * 140
    const data = Array.from({ length: points }, (_, idx) => ({
      x: now - (points - 1 - idx) * interval,
      y: randomTraffic(base),
    }))
    return { name, data }
  })
}

const renderTrafficChart = () => {
  if (!trafficChart.value) return
  const allowedSeries = buildTrafficSeries(1800)
  const blockedSeries = buildTrafficSeries(700)
  const options = {
    chart: {
      type: 'line',
      height: 420,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#10b981', '#ef4444'],
    xaxis: {
      type: 'datetime',
      tickAmount: 6,
      axisBorder: { show: true, color: '#e2e8f0' },
      axisTicks: { show: true, color: '#e2e8f0' },
      labels: {
        show: true,
        datetimeUTC: false,
        format: 'HH:mm',
        hideOverlappingLabels: false,
        rotate: 0,
        style: { colors: '#64748b', fontSize: '11px' },
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)} Mbps`,
      },
    },
    grid: { borderColor: 'rgba(148, 163, 184, 0.2)' },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: { formatter: (val) => `${Math.round(val)} Mbps` },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
    },
    series: [
      { name: 'Allowed', data: allowedSeries[0].data },
      { name: 'Blocked', data: blockedSeries[0].data },
    ],
  }

  if (trafficChartInstance) {
    trafficChartInstance.updateOptions(options, true, true)
  } else {
    trafficChartInstance = new ApexCharts(trafficChart.value, options)
    trafficChartInstance.render()
  }
}

const renderProtocolChart = () => {
  if (!protocolChart.value) return
  const series = buildProtocolSeries()
  const options = {
    chart: {
      type: 'line',
      height: 420,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'],
    xaxis: {
      type: 'datetime',
      tickAmount: 6,
      axisBorder: { show: true, color: '#e2e8f0' },
      axisTicks: { show: true, color: '#e2e8f0' },
      labels: {
        show: true,
        datetimeUTC: false,
        format: 'HH:mm',
        hideOverlappingLabels: false,
        rotate: 0,
        style: { colors: '#64748b', fontSize: '11px' },
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)} Mbps`,
      },
    },
    grid: { borderColor: 'rgba(148, 163, 184, 0.2)' },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: { formatter: (val) => `${Math.round(val)} Mbps` },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
    },
    series,
  }

  if (protocolChartInstance) {
    protocolChartInstance.updateOptions(options, true, true)
  } else {
    protocolChartInstance = new ApexCharts(protocolChart.value, options)
    protocolChartInstance.render()
  }
}

watch(appliedFilters, () => {
  renderTrafficChart()
  renderProtocolChart()
})

onMounted(() => {
  renderTrafficChart()
  renderProtocolChart()
})

onBeforeUnmount(() => {
  if (trafficChartInstance) {
    trafficChartInstance.destroy()
    trafficChartInstance = null
  }
  if (protocolChartInstance) {
    protocolChartInstance.destroy()
    protocolChartInstance = null
  }
})
</script>

<style scoped>
.layer4-attack-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filters-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
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
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.dialog-content {
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
}

.dialog-body {
  display: grid;
  gap: 12px;
  font-size: 0.85rem;
  color: #475569;
}

.dialog-body label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-input {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.5);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
}

.dialog-close {
  border: none;
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
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

.attack-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.attack-stat-card {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e5e7eb;
}

.attack-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.attack-icon.blocked {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.attack-icon.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.attack-icon svg {
  width: 30px;
  height: 30px;
}

.attack-info h3 {
  font-size: 0.875rem;
  color: #718096;
  margin: 0 0 6px 0;
  font-weight: 500;
}

.attack-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 6px 0;
}

.attack-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.attack-change.positive {
  color: #10b981;
}

.attack-table-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 20px 0;
}

.attack-table {
  width: 100%;
  border-collapse: collapse;
}

.attack-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.attack-chart-card--single {
  grid-column: 1 / -1;
}

.attack-chart-card {
  background: rgba(248, 250, 252, 0.9);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.chart-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.chart-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #0f766e;
  background: rgba(20, 184, 166, 0.15);
}

.chart-pill.danger {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.15);
}

.chart-body {
  width: 100%;
  height: 440px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: #ffffff;
  overflow: hidden;
}

.chart-body div {
  width: 100%;
  height: 100%;
}

.attack-table thead {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
}

.attack-table th {
  padding: 16px;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.attack-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1a202c;
  font-size: 0.9rem;
}

.attack-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.02);
}

.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

.badge.attack-syn {
  background: #fee2e2;
  color: #991b1b;
}

.badge.attack-udp {
  background: #fef3c7;
  color: #92400e;
}

.badge.attack-icmp {
  background: #dbeafe;
  color: #1e40af;
}

.badge.status-blocked {
  background: #d1fae5;
  color: #065f46;
}

.action-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
}

.action-btn:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #cbd5e0 100%);
  transform: translateY(-1px);
}
</style>

