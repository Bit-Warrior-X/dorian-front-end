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
        </div>
        <div class="filters-right">
          <div class="selected-range-group">
            <span class="selected-range-label">Selected</span>
            <span class="selected-range-value">{{ selectedRangeLabel }}</span>
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
          <p class="stat-value">{{ statsDisplay.totalTraffic }}</p>
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
          <p class="stat-value">{{ statsDisplay.bandwidthLast }}</p>
          <p class="stat-subvalue">{{ statsDisplay.bandwidthLastTime }}</p>
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
          <p class="stat-value">{{ statsDisplay.totalRequest }}</p>
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
          <p class="stat-value">{{ statsDisplay.totalResponse }}</p>
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
          <p class="stat-value">{{ statsDisplay.ipCount }}</p>
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
          <p class="stat-value">{{ statsDisplay.referer }}</p>
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
          <p class="stat-value">{{ statsDisplay.ispCount }}</p>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Bandwidth by Time</h3>
          <p>Bandwidth trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="bandwidthChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Traffic by Time</h3>
          <p>Traffic trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="trafficChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Request / Response by Time</h3>
          <p>Request and response trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="requestResponseChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Status Code by Time</h3>
          <p>Status code trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="statusCodeChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Status Code Summary</h3>
          <p>Pie distribution and table summary</p>
        </div>
      </div>
      <div class="ip-table-layout">
        <div class="table-card table-card--compact">
          <div class="table-title">Status Codes (Pie)</div>
          <div class="top-ips-pie">
            <div ref="statusCodePieChart"></div>
          </div>
        </div>
        <div class="table-card table-card--compact">
          <div class="table-title">Status Codes</div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Count</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in statusCodeRows" :key="row.code">
                  <td>{{ row.code }}</td>
                  <td>{{ row.count }}</td>
                  <td>{{ row.rate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>IP Count by Time</h3>
          <p>Unique IP count trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="ipCountChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Top IPs</h3>
          <p>Pie distribution and table summary</p>
        </div>
      </div>
      <div class="ip-table-layout">
        <div class="table-card table-card--compact">
          <div class="table-title">Top IPs (Pie)</div>
          <div class="top-ips-pie">
            <div ref="topIpsPieChart"></div>
          </div>
        </div>
        <div class="table-card table-card--compact">
          <div class="table-title">Top IPs</div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>IP</th>
                  <th>Requests</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in ipTableRows" :key="row.ip">
                  <td>{{ row.ip }}</td>
                  <td>{{ row.requests }}</td>
                  <td>{{ row.rate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>ISP Summary</h3>
          <p>Pie distribution and table summary</p>
        </div>
      </div>
      <div class="ip-table-layout">
        <div class="table-card table-card--compact">
          <div class="table-title">ISP (Pie)</div>
          <div class="top-ips-pie">
            <div ref="ispPieChart"></div>
          </div>
        </div>
        <div class="table-card table-card--compact">
          <div class="table-title">ISP</div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>ISP</th>
                  <th>Requests</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in ispTableRows" :key="row.isp">
                  <td>{{ row.isp }}</td>
                  <td>{{ row.requests }}</td>
                  <td>{{ row.rate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Referer Summary</h3>
          <p>Pie distribution and table summary</p>
        </div>
      </div>
      <div class="ip-table-layout">
        <div class="table-card table-card--compact">
          <div class="table-title">Referer (Pie)</div>
          <div class="top-ips-pie">
            <div ref="refererPieChart"></div>
          </div>
        </div>
        <div class="table-card table-card--compact">
          <div class="table-title">Referer</div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Referer</th>
                  <th>Requests</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in refererTableRows" :key="row.referer">
                  <td>{{ row.referer }}</td>
                  <td>{{ row.requests }}</td>
                  <td>{{ row.rate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>HTTP Method Summary</h3>
          <p>Pie distribution and table summary</p>
        </div>
      </div>
      <div class="ip-table-layout">
        <div class="table-card table-card--compact">
          <div class="table-title">Methods (Pie)</div>
          <div class="top-ips-pie">
            <div ref="methodPieChart"></div>
          </div>
        </div>
        <div class="table-card table-card--compact">
          <div class="table-title">HTTP Methods</div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Requests</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in methodTableRows" :key="row.method">
                  <td>{{ row.method }}</td>
                  <td>{{ row.requests }}</td>
                  <td>{{ row.rate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>HTTP Method by Time</h3>
          <p>Method trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="methodChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>HTTP Protocol Summary</h3>
          <p>Pie distribution and table summary</p>
        </div>
      </div>
      <div class="ip-table-layout">
        <div class="table-card table-card--compact">
          <div class="table-title">Protocols (Pie)</div>
          <div class="top-ips-pie">
            <div ref="protocolPieChart"></div>
          </div>
        </div>
        <div class="table-card table-card--compact">
          <div class="table-title">HTTP Protocols</div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Requests</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in protocolTableRows" :key="row.protocol">
                  <td>{{ row.protocol }}</td>
                  <td>{{ row.requests }}</td>
                  <td>{{ row.rate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>HTTP Protocol by Time</h3>
          <p>Protocol trend based on selected range</p>
        </div>
      </div>
      <div class="bandwidth-chart">
        <div ref="protocolChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Requests by Country</h3>
          <p>World map with request counts by country</p>
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
            <FlatPickr
              v-model="customStartDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select start time"
            />
          </div>
          <div class="dialog-form-group">
            <label>End Date & Time</label>
            <FlatPickr
              v-model="customEndDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select end time"
            />
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ApexCharts from 'apexcharts'
import { SvgMap } from 'vue-svg-map'
import world from '@svg-maps/world'
import { fetchServers } from '@/api/servers'
import { fetchAnalyticsSeries, fetchAnalyticsSummary, fetchAnalyticsSummaryGroup } from '@/api/analytics'

const selectedServer = ref('all')
const selectedTimeRange = ref('30m')
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref(null)
const customEndDate = ref(null)
const datePickerConfig = { enableTime: true, dateFormat: 'Y-m-d H:i' }
const appliedFilters = ref({
  server: 'all',
  range: '30m',
  isCustom: false,
  customStart: '',
  customEnd: '',
})
const bandwidthChart = ref(null)
const trafficChart = ref(null)
const requestResponseChart = ref(null)
const statusCodeChart = ref(null)
const ipCountChart = ref(null)
const topIpsPieChart = ref(null)
const statusCodePieChart = ref(null)
const ispPieChart = ref(null)
const refererPieChart = ref(null)
const methodPieChart = ref(null)
const methodChart = ref(null)
const protocolPieChart = ref(null)
const protocolChart = ref(null)
let bandwidthChartInstance = null
let trafficChartInstance = null
let requestResponseChartInstance = null
let statusCodeChartInstance = null
let ipCountChartInstance = null
let topIpsPieChartInstance = null
let statusCodePieChartInstance = null
let ispPieChartInstance = null
let refererPieChartInstance = null
let methodPieChartInstance = null
let methodChartInstance = null
let protocolPieChartInstance = null
let protocolChartInstance = null
const bandwidthSeries = ref([{ name: 'Bandwidth', data: [] }])
const trafficSeries = ref([{ name: 'Traffic', data: [] }])
const requestResponseSeries = ref([
  { name: 'Requests', data: [] },
  { name: 'Responses', data: [] },
])
const statusCodeSeries = ref([
  { name: '2xx', data: [] },
  { name: '3xx', data: [] },
  { name: '4xx', data: [] },
  { name: '5xx', data: [] },
])
const ipCountSeries = ref([{ name: 'IP Count', data: [] }])
const methodSeries = ref([])
const protocolSeries = ref([])
const analyticsStats = ref({
  totalTraffic: 0,
  bandwidthLast: 0,
  bandwidthLastTime: '',
  totalRequest: 0,
  totalResponse: 0,
  ipCount: 0,
  refererCount: 0,
  ispCount: 0,
})
const ipTableRows = ref([])
const statusCodeRows = ref([])
const ispTableRows = ref([])
const refererTableRows = ref([])
const methodTableRows = ref([])
const protocolTableRows = ref([])
const countryRequests = ref([])
const countryRequestMap = computed(() =>
  countryRequests.value.reduce((acc, item) => {
    acc[item.code.toLowerCase()] = item
    return acc
  }, {})
)
const hoveredCountry = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })
const maxCountryCount = computed(() =>
  Math.max(0, ...countryRequests.value.map((item) => item.count))
)
const mapLocationAttributes = (location) => {
  const entry = countryRequestMap.value[location.id.toLowerCase()]
  const ratio = entry && maxCountryCount.value ? entry.count / maxCountryCount.value : 0
  const fillColor = entry ? colorFromRate(ratio) : 'rgba(148, 163, 184, 0.2)'
  return {
    fill: fillColor,
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

const colorFromRate = (ratio) => {
  if (ratio >= 0.8) return '#ef4444'
  if (ratio >= 0.6) return '#f97316'
  if (ratio >= 0.4) return '#f59e0b'
  if (ratio >= 0.2) return '#22c55e'
  return '#60a5fa'
}

const servers = ref([])
const serverOptions = computed(() => [
  { label: 'All Servers', value: 'all' },
  ...servers.value.map((server) => ({ label: server.name || `Server ${server.id}`, value: server.id })),
])

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
}

const formatBytes = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  let current = numeric
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[index]}`
}

const formatMegabytes = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 MB'
  if (numeric >= 1024) {
    return `${(numeric / 1024).toFixed(numeric >= 10240 ? 0 : 1)} GB`
  }
  return `${numeric.toFixed(numeric >= 10 ? 0 : 1)} MB`
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

const formatDateInput = (value) => {
  if (!value) return ''
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

const statsDisplay = computed(() => ({
  totalTraffic: formatMegabytes(analyticsStats.value.totalTraffic),
  bandwidthLast: `${formatNumber(analyticsStats.value.bandwidthLast)} Mbps`,
  bandwidthLastTime: formatDateTime(analyticsStats.value.bandwidthLastTime),
  totalRequest: formatNumber(analyticsStats.value.totalRequest),
  totalResponse: formatNumber(analyticsStats.value.totalResponse),
  ipCount: formatNumber(analyticsStats.value.ipCount),
  referer: formatNumber(analyticsStats.value.refererCount),
  ispCount: formatNumber(analyticsStats.value.ispCount),
}))

const selectedRangeLabel = computed(() => {
  if (isCustomRange.value) {
    if (customStartDate.value && customEndDate.value) {
      return `${formatDateTime(customStartDate.value)} → ${formatDateTime(customEndDate.value)}`
    }
    return 'Custom'
  }
  const found = timeRanges.find((range) => range.value === selectedTimeRange.value)
  return found?.label || 'All'
})

const timeRanges = [
  { label: '1h', value: '1h' },
  { label: '2h', value: '2h' },
  { label: '4h', value: '4h' },
  { label: '6h', value: '6h' },
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
    customStart: isCustomRange.value ? formatDateInput(customStartDate.value) : '',
    customEnd: isCustomRange.value ? formatDateInput(customEndDate.value) : '',
  }
  loadAnalyticsData()
}

const resolveRangeMs = (filters) => {
  switch (filters.range) {
    case '30m':
      return 30 * 60 * 1000
    case '1h':
      return 60 * 60 * 1000
    case '2h':
      return 2 * 60 * 60 * 1000
    case '4h':
      return 4 * 60 * 60 * 1000
    case '6h':
      return 6 * 60 * 60 * 1000
    case '8h':
      return 8 * 60 * 60 * 1000
    case '12h':
      return 12 * 60 * 60 * 1000
    case '24h':
      return 24 * 60 * 60 * 1000
    case 'today': {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return now.getTime() - start.getTime()
    }
    case 'yesterday':
      return 24 * 60 * 60 * 1000
    default:
      return 60 * 60 * 1000
  }
}

const statusCodeList = [
  '200', '206', '301', '302', '400', '403', '404', '444',
  '499', '500', '502', '503', '504', '904', '929', '978',
]

const methodKeys = [
  { label: 'GET', field: 'getCount' },
  { label: 'POST', field: 'postCount' },
  { label: 'DELETE', field: 'deleteCount' },
  { label: 'PUT', field: 'putCount' },
  { label: 'HEAD', field: 'headCount' },
  { label: 'PATCH', field: 'patchCount' },
  { label: 'OPTIONS', field: 'optionsCount' },
  { label: 'OTHER', field: 'othersCount' },
]

const protocolKeys = [
  { label: 'HTTP/1.0', field: 'http1_0' },
  { label: 'HTTP/1.1', field: 'http1_1' },
  { label: 'HTTP/2', field: 'http2' },
  { label: 'HTTP/3', field: 'http3' },
]

const loadServers = async () => {
  try {
    const list = await fetchServers()
    servers.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Failed to load servers', error)
    servers.value = []
  }
}

const loadAnalyticsData = async () => {
  const params = buildAnalyticsParams()
  try {
    const [
      summary,
      bandwidth,
      traffic,
      requestResponse,
      statusSeries,
      ipCount,
      methodPoints,
      protocolPoints,
      statusSummary,
      topIps,
      topIsps,
      topReferers,
      countryRows,
      methodSummary,
      protocolSummary,
    ] = await Promise.all([
      fetchAnalyticsSummary(params),
      fetchAnalyticsSeries('bandwidth', params),
      fetchAnalyticsSeries('traffic', params),
      fetchAnalyticsSeries('request-response', params),
      fetchAnalyticsSeries('status-codes', params),
      fetchAnalyticsSeries('ip-count', params),
      fetchAnalyticsSeries('methods', params),
      fetchAnalyticsSeries('protocols', params),
      fetchAnalyticsSummaryGroup('status-codes', params),
      fetchAnalyticsSummaryGroup('top-ips', params),
      fetchAnalyticsSummaryGroup('isps', params),
      fetchAnalyticsSummaryGroup('referers', params),
      fetchAnalyticsSummaryGroup('countries', params),
      fetchAnalyticsSummaryGroup('methods', params),
      fetchAnalyticsSummaryGroup('protocols', params),
    ])

    analyticsStats.value = {
      totalTraffic: Number(summary?.totalTraffic ?? 0),
      bandwidthLast: Number(summary?.bandwidthLast ?? 0),
      bandwidthLastTime: summary?.bandwidthLastTime || '',
      totalRequest: Number(summary?.totalRequest ?? 0),
      totalResponse: Number(summary?.totalResponse ?? 0),
      ipCount: Number(summary?.ipCount ?? 0),
      refererCount: Number(summary?.refererCount ?? 0),
      ispCount: Number(summary?.ispCount ?? 0),
    }

    bandwidthSeries.value = [
      { name: 'Bandwidth', data: mapSeriesPoints(Array.isArray(bandwidth) ? bandwidth : [], 'traffic') },
    ]
    trafficSeries.value = [
      { name: 'Traffic', data: mapSeriesPoints(Array.isArray(traffic) ? traffic : [], 'traffic') },
    ]
    requestResponseSeries.value = [
      {
        name: 'Requests',
        data: mapSeriesPoints(Array.isArray(requestResponse) ? requestResponse : [], 'requestCount'),
      },
      {
        name: 'Responses',
        data: mapSeriesPoints(Array.isArray(requestResponse) ? requestResponse : [], 'responseCount'),
      },
    ]
    statusCodeSeries.value = [
      { name: '2xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'success') },
      { name: '3xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'redirect') },
      { name: '4xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'client') },
      { name: '5xx', data: mapSeriesPoints(Array.isArray(statusSeries) ? statusSeries : [], 'server') },
    ]
    ipCountSeries.value = [
      { name: 'IP Count', data: mapSeriesPoints(Array.isArray(ipCount) ? ipCount : [], 'count') },
    ]
    methodSeries.value = methodKeys.map((method) => ({
      name: method.label,
      data: mapSeriesPoints(Array.isArray(methodPoints) ? methodPoints : [], method.field),
    }))
    protocolSeries.value = protocolKeys.map((protocol) => ({
      name: protocol.label,
      data: mapSeriesPoints(Array.isArray(protocolPoints) ? protocolPoints : [], protocol.field),
    }))

    const statusRows = statusCodeList.map((code) => ({
      code,
      count: Number(statusSummary?.[`code${code}`] ?? 0),
    }))
    statusCodeRows.value = buildRateRows(statusRows)

    const topIpRows = (Array.isArray(topIps) ? topIps : []).map((row) => ({
      ip: row.ip,
      requests: Number(row.requests ?? 0),
    }))
    ipTableRows.value = buildRateRows(topIpRows)

    const ispRows = (Array.isArray(topIsps) ? topIsps : []).map((row) => ({
      isp: row.isp,
      requests: Number(row.requests ?? 0),
    }))
    ispTableRows.value = buildRateRows(ispRows)

    const refererRows = (Array.isArray(topReferers) ? topReferers : []).map((row) => ({
      referer: row.referer,
      requests: Number(row.requests ?? 0),
    }))
    refererTableRows.value = buildRateRows(refererRows)

    const countries = (Array.isArray(countryRows) ? countryRows : []).map((row) => ({
      code: String(row.countryCode || '').toUpperCase(),
      name: row.countryCode ? row.countryCode.toUpperCase() : 'Unknown',
      count: Number(row.requests ?? 0),
    }))
    countryRequests.value = countries

    const methodRows = methodKeys.map((method) => ({
      method: method.label,
      requests: Number(methodSummary?.[method.field] ?? 0),
    }))
    methodTableRows.value = buildRateRows(methodRows)

    const protocolRows = protocolKeys.map((protocol) => ({
      protocol: protocol.label,
      requests: Number(protocolSummary?.[protocol.field] ?? 0),
    }))
    protocolTableRows.value = buildRateRows(protocolRows)

    renderBandwidthChart()
    renderTrafficChart()
    renderRequestResponseChart()
    renderStatusCodeChart()
    renderIpCountChart()
    renderMethodChart()
    renderProtocolChart()
    renderTopIpsPie()
    renderStatusCodePie()
    renderIspPie()
    renderRefererPie()
    renderMethodPie()
    renderProtocolPie()
  } catch (error) {
    console.error('Failed to load analytics data', error)
  }
}

const resolveRangeWindow = (filters) => {
  const now = new Date()
  if (filters.isCustom && filters.customStart && filters.customEnd) {
    return {
      start: new Date(filters.customStart),
      end: new Date(filters.customEnd),
    }
  }
  if (filters.range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) }
  }
  if (filters.range === 'yesterday') {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { start: new Date(end.getTime() - 24 * 60 * 60 * 1000), end }
  }
  const duration = resolveRangeMs(filters)
  return { start: new Date(now.getTime() - duration), end: now }
}

const buildAnalyticsParams = () => {
  const filters = appliedFilters.value
  const params = { serverId: filters.server }
  if (filters.isCustom && filters.customStart && filters.customEnd) {
    params.start = filters.customStart
    params.end = filters.customEnd
  } else {
    params.range = filters.range
  }
  return params
}

const mapSeriesPoints = (points, field) =>
  points
    .map((point) => ({
      x: new Date(point.timestamp).getTime(),
      y: Number(point[field] ?? 0),
    }))
    .filter((point) => !Number.isNaN(point.x))

const buildRateRows = (rows) => {
  const total = rows.reduce((sum, row) => sum + Number(row.count ?? row.requests ?? 0), 0)
  return rows.map((row) => {
    const value = Number(row.count ?? row.requests ?? 0)
    const rate = total ? `${((value / total) * 100).toFixed(1)}%` : '0%'
    return {
      ...row,
      value,
      count: formatNumber(value),
      requests: formatNumber(value),
      rate,
    }
  })
}

const renderBandwidthChart = () => {
  if (!bandwidthChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = bandwidthSeries.value
  const options = {
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: ['#2563eb'],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)} Mbps`,
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)} Mbps`,
      },
    },
    series,
  }

  if (bandwidthChartInstance) {
    bandwidthChartInstance.updateOptions(options, true, true)
  } else {
    bandwidthChartInstance = new ApexCharts(bandwidthChart.value, options)
    bandwidthChartInstance.render()
  }
}

const renderTrafficChart = () => {
  if (!trafficChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = trafficSeries.value
  const options = {
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: ['#16a34a'],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => formatMegabytes(val),
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => formatMegabytes(val),
      },
    },
    series,
  }

  if (trafficChartInstance) {
    trafficChartInstance.updateOptions(options, true, true)
  } else {
    trafficChartInstance = new ApexCharts(trafficChart.value, options)
    trafficChartInstance.render()
  }
}

const renderRequestResponseChart = () => {
  if (!requestResponseChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = requestResponseSeries.value
  const options = {
    chart: {
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#6366f1', '#f59e0b'],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    series,
  }

  if (requestResponseChartInstance) {
    requestResponseChartInstance.updateOptions(options, true, true)
  } else {
    requestResponseChartInstance = new ApexCharts(requestResponseChart.value, options)
    requestResponseChartInstance.render()
  }
}

const renderStatusCodeChart = () => {
  if (!statusCodeChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = statusCodeSeries.value
  const options = {
    chart: {
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '10px',
      itemMargin: { horizontal: 6, vertical: 2 },
    },
    series,
  }

  if (statusCodeChartInstance) {
    statusCodeChartInstance.updateOptions(options, true, true)
  } else {
    statusCodeChartInstance = new ApexCharts(statusCodeChart.value, options)
    statusCodeChartInstance.render()
  }
}

const renderIpCountChart = () => {
  if (!ipCountChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = ipCountSeries.value
  const options = {
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: ['#8b5cf6'],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)} IPs`,
      },
    },
    series,
  }

  if (ipCountChartInstance) {
    ipCountChartInstance.updateOptions(options, true, true)
  } else {
    ipCountChartInstance = new ApexCharts(ipCountChart.value, options)
    ipCountChartInstance.render()
  }
}

const renderMethodChart = () => {
  if (!methodChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = methodSeries.value
  const options = {
    chart: {
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '10px',
      itemMargin: { horizontal: 6, vertical: 2 },
    },
    series,
  }

  if (methodChartInstance) {
    methodChartInstance.updateOptions(options, true, true)
  } else {
    methodChartInstance = new ApexCharts(methodChart.value, options)
    methodChartInstance.render()
  }
}

const renderProtocolPie = () => {
  if (!protocolPieChart.value) return
  const labels = protocolTableRows.value.map((row) => row.protocol || 'Unknown')
  const series = protocolTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const safeLabels = hasData ? labels : ['No data']
  const safeSeries = hasData ? series : [1]
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels: safeLabels,
    series: safeSeries,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
  }

  if (protocolPieChartInstance) {
    protocolPieChartInstance.updateOptions(
      {
        labels: safeLabels,
        colors: options.colors,
        tooltip: options.tooltip,
        dataLabels: options.dataLabels,
        legend: options.legend,
      },
      false,
      true,
    )
    protocolPieChartInstance.updateSeries(safeSeries, true)
  } else {
    protocolPieChartInstance = new ApexCharts(protocolPieChart.value, options)
    protocolPieChartInstance.render()
  }
}

const renderProtocolChart = () => {
  if (!protocolChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = protocolSeries.value
  const options = {
    chart: {
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
      zoom: { enabled: false },
      selection: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 20,
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '10px',
      itemMargin: { horizontal: 6, vertical: 2 },
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

const renderTopIpsPie = () => {
  if (!topIpsPieChart.value) return
  const labels = ipTableRows.value.map((row) => row.ip || 'Unknown')
  const series = ipTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const safeLabels = hasData ? labels : ['No data']
  const safeSeries = hasData ? series : [1]
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels: safeLabels,
    series: safeSeries,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: hasData
      ? ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9']
      : ['#e2e8f0'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
  }

  if (topIpsPieChartInstance) {
    topIpsPieChartInstance.updateOptions(
      {
        labels: safeLabels,
        colors: options.colors,
        tooltip: options.tooltip,
        dataLabels: options.dataLabels,
        legend: options.legend,
      },
      false,
      true,
    )
    topIpsPieChartInstance.updateSeries(safeSeries, true)
  } else {
    topIpsPieChartInstance = new ApexCharts(topIpsPieChart.value, options)
    topIpsPieChartInstance.render()
  }
}

const renderStatusCodePie = () => {
  if (!statusCodePieChart.value) return
  const labels = statusCodeRows.value.map((row) => row.code || 'Unknown')
  const series = statusCodeRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const safeLabels = hasData ? labels : ['No data']
  const safeSeries = hasData ? series : [1]
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels: safeLabels,
    series: safeSeries,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: [
      '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#a855f7',
      '#22c55e', '#f97316', '#e11d48', '#1d4ed8', '#14b8a6', '#9333ea',
      '#f43f5e', '#64748b', '#0f766e', '#b91c1c',
    ],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
  }

  if (statusCodePieChartInstance) {
    statusCodePieChartInstance.updateOptions(
      {
        labels: safeLabels,
        colors: options.colors,
        tooltip: options.tooltip,
        dataLabels: options.dataLabels,
        legend: options.legend,
      },
      false,
      true,
    )
    statusCodePieChartInstance.updateSeries(safeSeries, true)
  } else {
    statusCodePieChartInstance = new ApexCharts(statusCodePieChart.value, options)
    statusCodePieChartInstance.render()
  }
}

const renderIspPie = () => {
  if (!ispPieChart.value) return
  const labels = ispTableRows.value.map((row) => row.isp || 'Unknown')
  const series = ispTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const safeLabels = hasData ? labels : ['No data']
  const safeSeries = hasData ? series : [1]
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels: safeLabels,
    series: safeSeries,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: hasData ? ['#22c55e', '#f59e0b', '#e2e8f0'] : ['#e2e8f0'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
  }

  if (ispPieChartInstance) {
    ispPieChartInstance.updateOptions(
      {
        labels: safeLabels,
        colors: options.colors,
        tooltip: options.tooltip,
        dataLabels: options.dataLabels,
        legend: options.legend,
      },
      false,
      true,
    )
    ispPieChartInstance.updateSeries(safeSeries, true)
  } else {
    ispPieChartInstance = new ApexCharts(ispPieChart.value, options)
    ispPieChartInstance.render()
  }
}

const renderRefererPie = () => {
  if (!refererPieChart.value) return
  const labels = refererTableRows.value.map((row) => row.referer || 'Unknown')
  const series = refererTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const safeLabels = hasData ? labels : ['No data']
  const safeSeries = hasData ? series : [1]
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels: safeLabels,
    series: safeSeries,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: hasData ? ['#3b82f6', '#f59e0b', '#e2e8f0'] : ['#e2e8f0'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
  }

  if (refererPieChartInstance) {
    refererPieChartInstance.updateOptions(
      {
        labels: safeLabels,
        colors: options.colors,
        tooltip: options.tooltip,
        dataLabels: options.dataLabels,
        legend: options.legend,
      },
      false,
      true,
    )
    refererPieChartInstance.updateSeries(safeSeries, true)
  } else {
    refererPieChartInstance = new ApexCharts(refererPieChart.value, options)
    refererPieChartInstance.render()
  }
}

const renderMethodPie = () => {
  if (!methodPieChart.value) return
  const labels = methodTableRows.value.map((row) => row.method || 'Unknown')
  const series = methodTableRows.value.map((row) => Number(row.value ?? 0))
  const hasData = series.some((value) => value > 0)
  const safeLabels = hasData ? labels : ['No data']
  const safeSeries = hasData ? series : [1]
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels: safeLabels,
    series: safeSeries,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['#2563eb', '#16a34a', '#ef4444', '#f59e0b', '#0ea5e9', '#8b5cf6', '#22c55e', '#64748b'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}`,
      },
    },
  }

  if (methodPieChartInstance) {
    methodPieChartInstance.updateOptions(
      {
        labels: safeLabels,
        colors: options.colors,
        tooltip: options.tooltip,
        dataLabels: options.dataLabels,
        legend: options.legend,
      },
      false,
      true,
    )
    methodPieChartInstance.updateSeries(safeSeries, true)
  } else {
    methodPieChartInstance = new ApexCharts(methodPieChart.value, options)
    methodPieChartInstance.render()
  }
}

onMounted(() => {
  loadServers()
  loadAnalyticsData()
  renderTopIpsPie()
  renderIspPie()
  renderRefererPie()
})

onBeforeUnmount(() => {
  if (bandwidthChartInstance) {
    bandwidthChartInstance.destroy()
    bandwidthChartInstance = null
  }
  if (trafficChartInstance) {
    trafficChartInstance.destroy()
    trafficChartInstance = null
  }
  if (requestResponseChartInstance) {
    requestResponseChartInstance.destroy()
    requestResponseChartInstance = null
  }
  if (statusCodeChartInstance) {
    statusCodeChartInstance.destroy()
    statusCodeChartInstance = null
  }
  if (ipCountChartInstance) {
    ipCountChartInstance.destroy()
    ipCountChartInstance = null
  }
  if (topIpsPieChartInstance) {
    topIpsPieChartInstance.destroy()
    topIpsPieChartInstance = null
  }
  if (statusCodePieChartInstance) {
    statusCodePieChartInstance.destroy()
    statusCodePieChartInstance = null
  }
  if (ispPieChartInstance) {
    ispPieChartInstance.destroy()
    ispPieChartInstance = null
  }
  if (refererPieChartInstance) {
    refererPieChartInstance.destroy()
    refererPieChartInstance = null
  }
  if (methodPieChartInstance) {
    methodPieChartInstance.destroy()
    methodPieChartInstance = null
  }
  if (methodChartInstance) {
    methodChartInstance.destroy()
    methodChartInstance = null
  }
  if (protocolPieChartInstance) {
    protocolPieChartInstance.destroy()
    protocolPieChartInstance = null
  }
  if (protocolChartInstance) {
    protocolChartInstance.destroy()
    protocolChartInstance = null
  }
})
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
  flex: 1 1 420px;
  gap: 12px;
}

.filters-right {
  flex: 0 1 auto;
  justify-content: flex-end;
  margin-left: auto;
  gap: 12px;
}

.selected-range-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-weight: 600;
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
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.apply-filter-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(239, 68, 68, 0.45);
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

.bandwidth-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bandwidth-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.bandwidth-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f2937;
}

.bandwidth-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.bandwidth-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f766e;
  background: rgba(20, 184, 166, 0.15);
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

.world-map {
  width: 100%;
  height: fit-content;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: #f8fafc;
  padding: 12px;
  position: relative;
}

.world-map :deep(.svg-map) {
  width: 70%;
  height: auto;
  display: block;
  margin: 0 auto;
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

.table-card {
  background: rgba(248, 250, 252, 0.9);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.table-card--compact {
  height: 260px;
  display: flex;
  flex-direction: column;
}

.ip-table-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: 16px;
}

.top-ips-pie {
  width: 100%;
  height: 220px;
  margin-bottom: 12px;
}

.top-ips-pie div {
  width: 100%;
  height: 100%;
}

.table-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.table-wrap {
  overflow-x: auto;
  flex: 1;
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

