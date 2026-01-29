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
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Bandwidth by Time</h3>
          <p>Sample bandwidth trend based on selected range</p>
        </div>
        <span class="bandwidth-pill">Sample</span>
      </div>
      <div class="bandwidth-chart">
        <div ref="bandwidthChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Traffic by Time</h3>
          <p>Sample traffic trend based on selected range</p>
        </div>
        <span class="bandwidth-pill">Sample</span>
      </div>
      <div class="bandwidth-chart">
        <div ref="trafficChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Request / Response by Time</h3>
          <p>Sample request and response trend based on selected range</p>
        </div>
        <span class="bandwidth-pill">Sample</span>
      </div>
      <div class="bandwidth-chart">
        <div ref="requestResponseChart"></div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Status Code by Time</h3>
          <p>Sample status code trend based on selected range</p>
        </div>
        <span class="bandwidth-pill">Sample</span>
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
        <span class="bandwidth-pill">Sample</span>
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
          <p>Sample unique IP count trend based on selected range</p>
        </div>
        <span class="bandwidth-pill">Sample</span>
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
        <span class="bandwidth-pill">Sample</span>
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
        <span class="bandwidth-pill">Sample</span>
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
        <span class="bandwidth-pill">Sample</span>
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
        <span class="bandwidth-pill">Sample</span>
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
          <p>Sample method trend based on selected range</p>
        </div>
        <span class="bandwidth-pill">Sample</span>
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
        <span class="bandwidth-pill">Sample</span>
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
          <p>Sample protocol trend based on selected range</p>
        </div>
        <span class="bandwidth-pill">Sample</span>
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
        <span class="bandwidth-pill">Sample</span>
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
import { serverList } from '@/data/servers'
import { SvgMap } from 'vue-svg-map'
import world from '@svg-maps/world'

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
const ipTableRows = [
  { ip: '192.142.44.13', requests: '20326', rate: '98%' },
  { ip: '192.142.44.10', requests: '12', rate: '1%' },
  { ip: '10.0.12.5', requests: '86', rate: '1%' },
]
const statusCodeRows = [
  { code: '200', count: '120,340', rate: '54%' },
  { code: '206', count: '12,420', rate: '6%' },
  { code: '301', count: '9,840', rate: '4%' },
  { code: '302', count: '18,220', rate: '8%' },
  { code: '400', count: '6,120', rate: '3%' },
  { code: '403', count: '4,920', rate: '2%' },
  { code: '404', count: '19,440', rate: '9%' },
  { code: '444', count: '1,260', rate: '1%' },
  { code: '499', count: '2,420', rate: '1%' },
  { code: '500', count: '3,110', rate: '1%' },
  { code: '502', count: '4,020', rate: '2%' },
  { code: '503', count: '2,810', rate: '1%' },
  { code: '504', count: '1,740', rate: '1%' },
  { code: '904', count: '1,120', rate: '1%' },
  { code: '929', count: '860', rate: '0.5%' },
  { code: '978', count: '740', rate: '0.5%' },
]
const ispTableRows = [
  {
    isp: 'Logic Infotech Electrical Spare Parts Trading',
    requests: '20326',
    rate: '98%',
  },
  {
    isp: 'Joint Stock Company TransTeleCom',
    requests: '210',
    rate: '1%',
  },
]
const refererTableRows = [
  {
    referer: 'google.com',
    requests: '20326',
    rate: '98%',
  },
  {
    referer: 'bing.com',
    requests: '210',
    rate: '1%',
  },
]
const methodTableRows = [
  { method: 'GET', requests: '14012', rate: '60%' },
  { method: 'POST', requests: '4200', rate: '18%' },
  { method: 'DELETE', requests: '180', rate: '1%' },
  { method: 'PUT', requests: '860', rate: '4%' },
  { method: 'HEAD', requests: '420', rate: '2%' },
  { method: 'PATCH', requests: '310', rate: '1%' },
  { method: 'OPTIONS', requests: '1800', rate: '8%' },
  { method: 'OTHER', requests: '520', rate: '6%' },
]
const protocolTableRows = [
  { protocol: 'HTTP/1.1', requests: '16200', rate: '70%' },
  { protocol: 'HTTP/1.0', requests: '1200', rate: '5%' },
  { protocol: 'HTTP/2', requests: '4920', rate: '21%' },
  { protocol: 'HTTP/3', requests: '860', rate: '4%' },
]
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
const hoveredCountry = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })
const maxCountryCount = computed(() =>
  Math.max(...countryRequests.map((item) => item.count))
)
const mapLocationAttributes = (location) => {
  const entry = countryRequestMap.value[location.id]
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

const randomBandwidth = (base = 600) => {
  const jitter = (Math.random() - 0.5) * 120
  return Math.max(80, Math.round(base + jitter))
}

const randomTraffic = (base = 150) => {
  const jitter = (Math.random() - 0.5) * 40
  return Math.max(20, Math.round(base + jitter))
}

const randomRequests = (base = 1200) => {
  const jitter = (Math.random() - 0.5) * 220
  return Math.max(120, Math.round(base + jitter))
}

const randomResponses = (base = 1100) => {
  const jitter = (Math.random() - 0.5) * 200
  return Math.max(100, Math.round(base + jitter))
}

const randomStatusCount = (base = 300) => {
  const jitter = (Math.random() - 0.5) * 120
  return Math.max(20, Math.round(base + jitter))
}

const randomIpCount = (base = 2200) => {
  const jitter = (Math.random() - 0.5) * 300
  return Math.max(300, Math.round(base + jitter))
}

const randomMethodCount = (base = 400) => {
  const jitter = (Math.random() - 0.5) * 140
  return Math.max(40, Math.round(base + jitter))
}

const randomProtocolCount = (base = 300) => {
  const jitter = (Math.random() - 0.5) * 120
  return Math.max(30, Math.round(base + jitter))
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
    case 'custom': {
      const start = filters.customStart ? new Date(filters.customStart).getTime() : 0
      const end = filters.customEnd ? new Date(filters.customEnd).getTime() : 0
      return end > start ? end - start : 60 * 60 * 1000
    }
    default:
      return 60 * 60 * 1000
  }
}

const buildBandwidthSeries = (rangeMs) => {
  const points = 24
  const now = Date.now()
  const interval = rangeMs / (points - 1)
  const data = Array.from({ length: points }, (_, index) => ({
    x: now - (points - 1 - index) * interval,
    y: randomBandwidth(),
  }))
  return [{ name: 'Bandwidth', data }]
}

const buildTrafficSeries = (rangeMs) => {
  const points = 24
  const now = Date.now()
  const interval = rangeMs / (points - 1)
  const data = Array.from({ length: points }, (_, index) => ({
    x: now - (points - 1 - index) * interval,
    y: randomTraffic(),
  }))
  return [{ name: 'Traffic', data }]
}

const buildRequestResponseSeries = (rangeMs) => {
  const points = 24
  const now = Date.now()
  const interval = rangeMs / (points - 1)
  const requests = Array.from({ length: points }, (_, index) => ({
    x: now - (points - 1 - index) * interval,
    y: randomRequests(),
  }))
  const responses = Array.from({ length: points }, (_, index) => ({
    x: now - (points - 1 - index) * interval,
    y: randomResponses(),
  }))
  return [
    { name: 'Requests', data: requests },
    { name: 'Responses', data: responses },
  ]
}

const statusCodeList = [
  '200', '206', '301', '302', '400', '403', '404', '444',
  '499', '500', '502', '503', '504', '904', '929', '978',
]

const buildStatusCodeSeries = (rangeMs) => {
  const points = 24
  const now = Date.now()
  const interval = rangeMs / (points - 1)
  return statusCodeList.map((code, idx) => {
    const base = 120 + (idx % 6) * 40
    const data = Array.from({ length: points }, (_, index) => ({
      x: now - (points - 1 - index) * interval,
      y: randomStatusCount(base),
    }))
    return { name: code, data }
  })
}

const buildIpCountSeries = (rangeMs) => {
  const points = 24
  const now = Date.now()
  const interval = rangeMs / (points - 1)
  const data = Array.from({ length: points }, (_, index) => ({
    x: now - (points - 1 - index) * interval,
    y: randomIpCount(),
  }))
  return [{ name: 'IP Count', data }]
}

const buildMethodSeries = (rangeMs) => {
  const points = 24
  const now = Date.now()
  const interval = rangeMs / (points - 1)
  return methodTableRows.map((row, idx) => {
    const base = 160 + (idx % 6) * 60
    const data = Array.from({ length: points }, (_, index) => ({
      x: now - (points - 1 - index) * interval,
      y: randomMethodCount(base),
    }))
    return { name: row.method, data }
  })
}

const buildProtocolSeries = (rangeMs) => {
  const points = 24
  const now = Date.now()
  const interval = rangeMs / (points - 1)
  return protocolTableRows.map((row, idx) => {
    const base = 140 + (idx % 4) * 70
    const data = Array.from({ length: points }, (_, index) => ({
      x: now - (points - 1 - index) * interval,
      y: randomProtocolCount(base),
    }))
    return { name: row.protocol, data }
  })
}

const renderBandwidthChart = () => {
  if (!bandwidthChart.value) return
  const rangeMs = resolveRangeMs(appliedFilters.value)
  const series = buildBandwidthSeries(rangeMs)
  const options = {
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: ['#2563eb'],
    xaxis: { type: 'datetime' },
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
  const rangeMs = resolveRangeMs(appliedFilters.value)
  const series = buildTrafficSeries(rangeMs)
  const options = {
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: ['#16a34a'],
    xaxis: { type: 'datetime' },
    yaxis: {
      labels: {
        formatter: (val) => `${Math.round(val)} GB`,
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    tooltip: {
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: {
        formatter: (val) => `${Math.round(val)} GB`,
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
  const rangeMs = resolveRangeMs(appliedFilters.value)
  const series = buildRequestResponseSeries(rangeMs)
  const options = {
    chart: {
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#6366f1', '#f59e0b'],
    xaxis: { type: 'datetime' },
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
        formatter: (val) => `${Math.round(val)} req/s`,
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
  const rangeMs = resolveRangeMs(appliedFilters.value)
  const series = buildStatusCodeSeries(rangeMs)
  const options = {
    chart: {
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { type: 'datetime' },
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
  const rangeMs = resolveRangeMs(appliedFilters.value)
  const series = buildIpCountSeries(rangeMs)
  const options = {
    chart: {
      type: 'area',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: ['#8b5cf6'],
    xaxis: { type: 'datetime' },
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
  const rangeMs = resolveRangeMs(appliedFilters.value)
  const series = buildMethodSeries(rangeMs)
  const options = {
    chart: {
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { type: 'datetime' },
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
  const labels = protocolTableRows.map((row) => row.protocol)
  const series = protocolTableRows.map((row) => Number(row.rate.replace('%', '')) || 0)
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels,
    series,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}%`,
      },
    },
  }

  if (protocolPieChartInstance) {
    protocolPieChartInstance.updateOptions(options, true, true)
  } else {
    protocolPieChartInstance = new ApexCharts(protocolPieChart.value, options)
    protocolPieChartInstance.render()
  }
}

const renderProtocolChart = () => {
  if (!protocolChart.value) return
  const rangeMs = resolveRangeMs(appliedFilters.value)
  const series = buildProtocolSeries(rangeMs)
  const options = {
    chart: {
      type: 'line',
      height: 280,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { type: 'datetime' },
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
  const labels = ipTableRows.map((row) => row.ip)
  const series = ipTableRows.map((row) => Number(row.rate.replace('%', '')) || 0)
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels,
    series,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}%`,
      },
    },
  }

  if (topIpsPieChartInstance) {
    topIpsPieChartInstance.updateOptions(options, true, true)
  } else {
    topIpsPieChartInstance = new ApexCharts(topIpsPieChart.value, options)
    topIpsPieChartInstance.render()
  }
}

const renderStatusCodePie = () => {
  if (!statusCodePieChart.value) return
  const labels = statusCodeRows.map((row) => row.code)
  const series = statusCodeRows.map((row) => Number(row.rate.replace('%', '')) || 0)
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels,
    series,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: [
      '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#a855f7',
      '#22c55e', '#f97316', '#e11d48', '#1d4ed8', '#14b8a6', '#9333ea',
      '#f43f5e', '#64748b', '#0f766e', '#b91c1c',
    ],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}%`,
      },
    },
  }

  if (statusCodePieChartInstance) {
    statusCodePieChartInstance.updateOptions(options, true, true)
  } else {
    statusCodePieChartInstance = new ApexCharts(statusCodePieChart.value, options)
    statusCodePieChartInstance.render()
  }
}

const renderIspPie = () => {
  if (!ispPieChart.value) return
  const labels = ispTableRows.map((row) => row.isp)
  const series = ispTableRows.map((row) => Number(row.rate.replace('%', '')) || 0)
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels,
    series,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['#22c55e', '#f59e0b', '#e2e8f0'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}%`,
      },
    },
  }

  if (ispPieChartInstance) {
    ispPieChartInstance.updateOptions(options, true, true)
  } else {
    ispPieChartInstance = new ApexCharts(ispPieChart.value, options)
    ispPieChartInstance.render()
  }
}

const renderRefererPie = () => {
  if (!refererPieChart.value) return
  const labels = refererTableRows.map((row) => row.referer)
  const series = refererTableRows.map((row) => Number(row.rate.replace('%', '')) || 0)
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels,
    series,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['#3b82f6', '#f59e0b', '#e2e8f0'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}%`,
      },
    },
  }

  if (refererPieChartInstance) {
    refererPieChartInstance.updateOptions(options, true, true)
  } else {
    refererPieChartInstance = new ApexCharts(refererPieChart.value, options)
    refererPieChartInstance.render()
  }
}

const renderMethodPie = () => {
  if (!methodPieChart.value) return
  const labels = methodTableRows.map((row) => row.method)
  const series = methodTableRows.map((row) => Number(row.rate.replace('%', '')) || 0)
  const options = {
    chart: {
      type: 'pie',
      height: 220,
      toolbar: { show: false },
    },
    labels,
    series,
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['#2563eb', '#16a34a', '#ef4444', '#f59e0b', '#0ea5e9', '#8b5cf6', '#22c55e', '#64748b'],
    tooltip: {
      y: {
        formatter: (val) => `${Math.round(val)}%`,
      },
    },
  }

  if (methodPieChartInstance) {
    methodPieChartInstance.updateOptions(options, true, true)
  } else {
    methodPieChartInstance = new ApexCharts(methodPieChart.value, options)
    methodPieChartInstance.render()
  }
}

watch(appliedFilters, () => {
  renderBandwidthChart()
  renderTrafficChart()
  renderRequestResponseChart()
  renderStatusCodeChart()
  renderIpCountChart()
  renderTopIpsPie()
  renderStatusCodePie()
  renderIspPie()
  renderRefererPie()
  renderMethodPie()
  renderMethodChart()
  renderProtocolPie()
  renderProtocolChart()
})

onMounted(() => {
  renderBandwidthChart()
  renderTrafficChart()
  renderRequestResponseChart()
  renderStatusCodeChart()
  renderIpCountChart()
  renderTopIpsPie()
  renderStatusCodePie()
  renderIspPie()
  renderRefererPie()
  renderMethodPie()
  renderMethodChart()
  renderProtocolPie()
  renderProtocolChart()
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

