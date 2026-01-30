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
          <h3>Total Request Counts</h3>
          <p class="stat-value">{{ sampleStats.totalRequestCounts }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Block Request Counts</h3>
          <p class="stat-value">{{ sampleStats.blockRequestCounts }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M8 12h8"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total IPs</h3>
          <p class="stat-value">{{ sampleStats.totalIps }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon security">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Blacklisted IPs</h3>
          <p class="stat-value">{{ sampleStats.blacklistedIps }}</p>
        </div>
      </div>
    </div>
    <div class="filters-card">
      <div class="filters-row">
        <label class="table-title">Block Count by Time</label>
      </div>
      <div class="bandwidth-chart bandwidth-chart--tall">
        <div ref="blockCountChart"></div>
      </div>
    </div>
    <div class="filters-card">
      <div class="filters-row">
        <div class="filters-left">
          <span class="filter-inline-label">Requests by Country</span>
        </div>
      </div>
      <div class="world-map">
        <SvgMap :map="world" :location-attributes="mapLocationAttributes" />
        <div
          v-if="hoveredCountry"
          class="map-tooltip"
          :style="{ left: `${tooltipPosition.x}px`, top: `${tooltipPosition.y}px` }"
        >
          {{ hoveredCountry }}
        </div>
      </div>
    </div>
    <div class="filters-card">
      <div class="filters-row">
        <label class="table-title">Top Requests</label>
      </div>
      <div class="top-tables">
        <div class="table-card table-card--compact">
          <div class="table-title">Requests Top30</div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Request Counts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in topRequestRows" :key="row.area">
                  <td>{{ row.area }}</td>
                  <td>{{ row.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="table-card table-card--compact">
          <div class="table-title">BlockCounts Top30</div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Request Counts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in topBlockRows" :key="row.area">
                  <td>{{ row.area }}</td>
                  <td>{{ row.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="top-bars top-bars--stacked">
        <div class="table-card table-card--compact table-card--full table-card--spaced">
          <div class="table-title">URLRequests Top10</div>
          <div class="url-bars url-bars--horizontal">
            <div v-for="row in topUrlRows" :key="row.url" class="url-bar-row">
              <div class="url-bar-label">{{ row.url }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill"
                    :style="{ width: `${urlBarWidth(row.count)}%` }"
                    :title="`${row.url} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value">{{ row.count }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="table-card table-card--compact table-card--full table-card--spaced">
          <div class="table-title">Referer Top10</div>
          <div class="url-bars url-bars--horizontal">
            <div v-for="row in topRefererRows" :key="row.referer" class="url-bar-row">
              <div class="url-bar-label">{{ row.referer }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill url-bar-fill--teal"
                    :style="{ width: `${urlBarWidth(row.count)}%` }"
                    :title="`${row.referer} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value">{{ row.count }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="table-card table-card--compact table-card--full table-card--spaced">
          <div class="table-title">User Agent Top10</div>
          <div class="url-bars url-bars--horizontal">
            <div v-for="row in topUserAgentRows" :key="row.agent" class="url-bar-row">
              <div class="url-bar-label">{{ row.agent }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill url-bar-fill--purple"
                    :style="{ width: `${urlBarWidth(row.count)}%` }"
                    :title="`${row.agent} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value">{{ row.count }}</div>
              </div>
            </div>
          </div>
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ApexCharts from 'apexcharts'
import { SvgMap } from 'vue-svg-map'
import world from '@svg-maps/world'
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
  totalRequestCounts: '1,284,992',
  blockRequestCounts: '83,210',
  totalIps: '12,430',
  blacklistedIps: '214',
}
const blockCountChart = ref(null)
let blockCountChartInstance = null
const countryRequests = [
  { code: 'US', name: 'United States', count: 120340 },
  { code: 'BR', name: 'Brazil', count: 53420 },
  { code: 'GB', name: 'United Kingdom', count: 40210 },
  { code: 'DE', name: 'Germany', count: 38200 },
  { code: 'RU', name: 'Russia', count: 44890 },
  { code: 'IN', name: 'India', count: 61200 },
  { code: 'CN', name: 'China', count: 72800 },
  { code: 'JP', name: 'Japan', count: 29110 },
  { code: 'AU', name: 'Australia', count: 18420 },
  { code: 'ZA', name: 'South Africa', count: 12600 },
]
const countryRequestMap = computed(() =>
  countryRequests.reduce((acc, item) => {
    acc[item.code.toLowerCase()] = item
    return acc
  }, {})
)
const maxCountryCount = computed(() =>
  Math.max(...countryRequests.map((item) => item.count))
)
const hoveredCountry = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })
const colorFromRate = (ratio) => {
  if (ratio >= 0.8) return '#ef4444'
  if (ratio >= 0.6) return '#f97316'
  if (ratio >= 0.4) return '#f59e0b'
  if (ratio >= 0.2) return '#22c55e'
  return '#60a5fa'
}
const mapLocationAttributes = (location) => {
  const entry = countryRequestMap.value[location.id]
  const ratio = entry && maxCountryCount.value ? entry.count / maxCountryCount.value : 0
  return {
    fill: entry ? colorFromRate(ratio) : 'rgba(148, 163, 184, 0.2)',
    stroke: 'rgba(100, 116, 139, 0.6)',
    'stroke-width': 0.5,
    title: entry
      ? `${entry.name} — ${entry.count.toLocaleString()} requests`
      : location.name,
    onMouseenter: () => {
      hoveredCountry.value = entry
        ? `${entry.name} — ${entry.count.toLocaleString()} requests`
        : location.name
    },
    onMousemove: (event) => {
      tooltipPosition.value = {
        x: event.offsetX + 12,
        y: event.offsetY + 12,
      }
    },
    onMouseleave: () => {
      hoveredCountry.value = ''
    },
  }
}

const topRequestRows = [
  { area: 'United States', count: '120,340' },
  { area: 'China', count: '72,800' },
  { area: 'India', count: '61,200' },
  { area: 'Brazil', count: '53,420' },
  { area: 'Russia', count: '44,890' },
  { area: 'Germany', count: '38,200' },
]

const topBlockRows = [
  { area: 'United States', count: '12,480' },
  { area: 'China', count: '8,920' },
  { area: 'India', count: '6,110' },
  { area: 'Brazil', count: '5,320' },
  { area: 'Russia', count: '4,980' },
  { area: 'Germany', count: '3,740' },
]
const topUrlRows = [
  { url: '/api/login', count: '18,402' },
  { url: '/api/search', count: '12,980' },
  { url: '/api/orders', count: '9,440' },
  { url: '/api/users', count: '8,110' },
  { url: '/api/config', count: '6,790' },
  { url: '/api/report', count: '5,340' },
  { url: '/api/items', count: '4,980' },
  { url: '/api/metrics', count: '4,210' },
  { url: '/api/alerts', count: '3,860' },
  { url: '/api/status', count: '3,420' },
]
const topRefererRows = [
  { referer: 'google.com', count: '18,240' },
  { referer: 'bing.com', count: '12,560' },
  { referer: 'yahoo.com', count: '9,310' },
  { referer: 'duckduckgo.com', count: '7,840' },
  { referer: 'facebook.com', count: '6,420' },
  { referer: 'twitter.com', count: '5,980' },
  { referer: 'linkedin.com', count: '4,760' },
  { referer: 'reddit.com', count: '4,210' },
  { referer: 'github.com', count: '3,740' },
  { referer: 'direct', count: '3,120' },
]
const topUserAgentRows = [
  { agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', count: '16,820' },
  { agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', count: '12,440' },
  { agent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)', count: '9,210' },
  { agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X)', count: '8,320' },
  { agent: 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X)', count: '6,980' },
  { agent: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64)', count: '5,740' },
  { agent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64)', count: '4,960' },
  { agent: 'Mozilla/5.0 (Linux; Android 12; SM-G991B)', count: '4,120' },
  { agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_7_10)', count: '3,880' },
  { agent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', count: '3,110' },
]
const urlMaxCount = computed(() => {
  const values = topUrlRows.map((row) => Number(row.count.replace(/,/g, '')) || 0)
  return Math.max(...values, 1)
})
const urlBarWidth = (count) => {
  const numeric = Number(String(count).replace(/,/g, '')) || 0
  return Math.round((numeric / urlMaxCount.value) * 100)
}

const randomBlockCount = (base = 600) => {
  const jitter = (Math.random() - 0.5) * 200
  return Math.max(50, Math.round(base + jitter))
}

const buildBlockCountSeries = () => {
  const points = 24
  const now = Date.now()
  const interval = 5 * 60 * 1000
  const data = Array.from({ length: points }, (_, index) => ({
    x: now - (points - 1 - index) * interval,
    y: randomBlockCount(),
  }))
  return [{ name: 'Blocked', data }]
}

const renderBlockCountChart = () => {
  if (!blockCountChart.value) return
  const series = buildBlockCountSeries()
  const options = {
    chart: {
      type: 'area',
      height: 400,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: ['#ef4444'],
    xaxis: { type: 'datetime' },
    yaxis: {
      labels: { formatter: (val) => `${Math.round(val)}` },
    },
    grid: { borderColor: 'rgba(148, 163, 184, 0.2)' },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: { formatter: (val) => `${Math.round(val)}` },
    },
    series,
  }

  if (blockCountChartInstance) {
    blockCountChartInstance.updateOptions(options, true, true)
  } else {
    blockCountChartInstance = new ApexCharts(blockCountChart.value, options)
    blockCountChartInstance.render()
  }
}

watch(appliedFilters, () => {
  renderBlockCountChart()
})

onMounted(() => {
  renderBlockCountChart()
})

onBeforeUnmount(() => {
  if (blockCountChartInstance) {
    blockCountChartInstance.destroy()
    blockCountChartInstance = null
  }
})

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

.world-map {
  margin-top: 16px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: #f8fafc;
  padding: 12px;
  position: relative;
}

.world-map :deep(.svg-map) {
  width: 100%;
  height: auto;
  display: block;
}

.world-map :deep(.svg-map__location) {
  transition: fill 0.2s ease;
}

.world-map :deep(.svg-map__location:hover) {
  fill: rgba(37, 99, 235, 0.85);
}

.map-tooltip {
  position: absolute;
  z-index: 5;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  font-size: 0.85rem;
  font-weight: 600;
  pointer-events: none;
  white-space: nowrap;
}

.top-tables {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.table-card--compact {
  background: rgba(248, 250, 252, 0.9);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.table-card--spaced {
  margin-top: 16px;
}

.table-card--full {
  width: 100%;
}

.table-card--full {
  width: 100%;
}
.table-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.table-wrap {
  overflow-x: auto;
}

.ip-table {
  width: 100%;
  border-collapse: collapse;
}

.ip-table th,
.ip-table td {
  text-align: left;
  padding: 10px 12px;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  color: #1f2937;
}

.ip-table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.ip-table--nowrap th,
.ip-table--nowrap td {
  white-space: nowrap;
}

.url-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-bars {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.top-bars--stacked {
  grid-template-columns: minmax(0, 1fr);
}
.url-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.url-bar-line {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
}

.url-bar-track {
  width: 100%;
  height: 16px;
  background: rgba(226, 232, 240, 0.6);
  border-radius: 999px;
  overflow: hidden;
}

.url-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
  transition: width 0.3s ease;
}

.url-bar-fill--teal {
  background: linear-gradient(90deg, #14b8a6 0%, #0f766e 100%);
}

.url-bar-fill--purple {
  background: linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%);
}

.bandwidth-chart {
  width: 100%;
  height: 280px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: #ffffff;
}

.bandwidth-chart div {
  width: 100%;
  height: 100%;
  display: block;
}

.bandwidth-chart--tall {
  height: 420px;
}

.url-bar-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.url-bar-value {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}
</style>

