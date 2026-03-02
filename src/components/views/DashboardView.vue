<template>
  <div class="dashboard-view">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total Users</h3>
          <p class="stat-value">{{ formatNumber(dashboardStats.totalUsers) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon servers">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="8" rx="2"></rect>
            <rect x="2" y="13" width="20" height="8" rx="2"></rect>
            <line x1="6" y1="7" x2="6.01" y2="7"></line>
            <line x1="6" y1="17" x2="6.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Total Servers</h3>
          <p class="stat-value">{{ formatNumber(dashboardStats.totalServers) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active-servers">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l7 3v6c0 5-7 9-7 9s-7-4-7-9V5l7-3z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Active Servers</h3>
          <p class="stat-value">{{ formatNumber(dashboardStats.activeServers) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blocked">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Blocked IPs</h3>
          <p class="stat-value">{{ formatNumber(dashboardStats.blockedIps) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon connections">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l7 3v6c0 5-7 9-7 9s-7-4-7-9V5l7-3z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>L4 Attacks This Month</h3>
          <p class="stat-value">{{ formatNumber(dashboardStats.l4AttacksThisMonth) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon connections">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4v16h16"></path>
            <path d="M20 7l-4 4-3-3-5 5"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>L4 Attacks Previous Month</h3>
          <p class="stat-value">{{ formatNumber(dashboardStats.l4AttacksPreviousMonth) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon connections">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M8 12h8"></path>
            <path d="M12 8v8"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>L7 Threats This Month</h3>
          <p class="stat-value">{{ formatNumber(dashboardStats.l7ThreatsThisMonth) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon connections">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <div class="stat-info">
          <h3>L7 Threats Previous Month</h3>
          <p class="stat-value">{{ formatNumber(dashboardStats.l7ThreatsPreviousMonth) }}</p>
        </div>
      </div>
    </div>
    <div class="analytics-card">
      <h2>Security Events Timeline</h2>
      <div class="timeline">
        <div v-if="!securityEvents.length" class="timeline-item">
          <div class="timeline-marker success"></div>
          <div class="timeline-content">
            <h4>No security events</h4>
            <p>New events will appear here as they are recorded.</p>
          </div>
        </div>
        <div v-for="(event, index) in securityEvents" :key="event.id" class="timeline-item">
          <div class="timeline-marker" :class="eventMarkerClass(event, index)"></div>
          <div class="timeline-content">
            <h4>{{ event.title }}</h4>
            <p>{{ event.description }}</p>
            <span class="timeline-time">{{ formatEventTime(event.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="bandwidth-card">
      <div class="bandwidth-header">
        <div>
          <h3>Realtime Bandwidth by Server</h3>
          <p>Live throughput updated every 5 minutes (Mbps)</p>
        </div>
        <div class="bandwidth-controls">
          <select v-model="bandwidthRange" class="chart-select">
            <option v-for="option in bandwidthRangeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <span class="bandwidth-pill">Live</span>
        </div>
      </div>
      <div class="bandwidth-sections-row">
        <div class="bandwidth-section">
          <div class="bandwidth-subheader">
            <h4>NIC RX</h4>
          </div>
          <div class="bandwidth-chart">
            <div ref="bandwidthNicRxChart"></div>
          </div>
        </div>
        <div class="bandwidth-section">
          <div class="bandwidth-subheader">
            <h4>NIC TX</h4>
          </div>
          <div class="bandwidth-chart">
            <div ref="bandwidthNicTxChart"></div>
          </div>
        </div>
      </div>
      <div class="bandwidth-sections-row">
        <div class="bandwidth-section">
          <div class="bandwidth-subheader">
            <h4>L7 RX</h4>
          </div>
          <div class="bandwidth-chart">
            <div ref="bandwidthL7RxChart"></div>
          </div>
        </div>
        <div class="bandwidth-section">
          <div class="bandwidth-subheader">
            <h4>L7 TX</h4>
          </div>
          <div class="bandwidth-chart">
            <div ref="bandwidthL7TxChart"></div>
          </div>
        </div>
      </div>
      <div class="bandwidth-legend">
        <button
          v-for="(server, index) in bandwidthServers"
          :key="server.id"
          class="legend-item"
          type="button"
          :class="{ 'legend-item--hidden': hiddenServers.has(server.id) }"
          @click="toggleServerSeries(server)"
        >
          <span class="legend-swatch" :style="{ background: server.color }"></span>
          <span class="legend-label">{{ server.label }}</span>
          <span class="legend-value">
            {{
              hiddenServers.has(server.id)
                ? 'Hidden'
                : `NIC: ${latestValuesNicRx[index]} / ${latestValuesNicTx[index]} Mbps · L7: ${latestValuesL7Rx[index]} / ${latestValuesL7Tx[index]} Mbps`
            }}
          </span>
        </button>
      </div>
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <h3>Request Count & Response</h3>
            <p>Requests and responses per second</p>
          </div>
          <div class="chart-controls">
            <select v-model="requestRange" class="chart-select">
              <option v-for="option in bandwidthRangeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <select v-model="requestServer" class="chart-select">
              <option v-for="option in serverOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="bandwidth-chart">
          <div ref="requestResponseChart"></div>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <h3>Status Code</h3>
            <p>Response distribution per second</p>
          </div>
          <div class="chart-controls">
            <select v-model="statusRange" class="chart-select">
              <option v-for="option in bandwidthRangeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <select v-model="statusServer" class="chart-select">
              <option v-for="option in serverOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="bandwidth-chart">
          <div ref="statusCodeChart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ApexCharts from 'apexcharts'
import {
  fetchBandwidthL7RxSeries,
  fetchBandwidthL7TxSeries,
  fetchBandwidthNicRxSeries,
  fetchBandwidthNicTxSeries,
  fetchDashboardSummary,
  fetchRequestResponseSeries,
  fetchSecurityEvents,
  fetchStatusCodeSeries,
} from '@/api/dashboard'
import { fetchServers } from '@/api/servers'

const bandwidthNicRxChart = ref(null)
const bandwidthNicTxChart = ref(null)
const bandwidthL7RxChart = ref(null)
const bandwidthL7TxChart = ref(null)
const requestResponseChart = ref(null)
const statusCodeChart = ref(null)
const securityEvents = ref([])
const dashboardStats = ref({
  totalUsers: 0,
  totalServers: 0,
  activeServers: 0,
  blockedIps: 0,
  l4AttacksThisMonth: 0,
  l4AttacksPreviousMonth: 0,
  l7ThreatsThisMonth: 0,
  l7ThreatsPreviousMonth: 0,
})
const palette = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#0ea5e9', '#a855f7']
const bandwidthServers = ref([])
const bandwidthRefreshMs = 60 * 1000
const trafficRefreshMs = 60 * 1000

let nicRxChartInstance = null
let nicTxChartInstance = null
let l7RxChartInstance = null
let l7TxChartInstance = null
let bandwidthTimer = null
let trafficTimer = null
let requestResponseChartInstance = null
let statusCodeChartInstance = null

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
}

const loadDashboardSummary = async () => {
  try {
    const payload = await fetchDashboardSummary()
    dashboardStats.value = {
      totalUsers: Number(payload?.totalUsers ?? 0),
      totalServers: Number(payload?.totalServers ?? 0),
      activeServers: Number(payload?.activeServers ?? 0),
      blockedIps: Number(payload?.blockedIps ?? 0),
      l4AttacksThisMonth: Number(payload?.l4AttacksThisMonth ?? 0),
      l4AttacksPreviousMonth: Number(payload?.l4AttacksPreviousMonth ?? 0),
      l7ThreatsThisMonth: Number(payload?.l7ThreatsThisMonth ?? 0),
      l7ThreatsPreviousMonth: Number(payload?.l7ThreatsPreviousMonth ?? 0),
    }
  } catch (error) {
    console.error('Failed to load dashboard summary', error)
  }
}

const loadSecurityEvents = async () => {
  try {
    const payload = await fetchSecurityEvents(10)
    securityEvents.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    console.error('Failed to load security events', error)
    securityEvents.value = []
  }
}

const loadBandwidthServers = async () => {
  try {
    const payload = await fetchServers()
    const list = Array.isArray(payload) ? payload : []
    bandwidthServers.value = list.map((server, index) => ({
      id: server.id,
      label: server.name || `Server ${server.id}`,
      color: palette[index % palette.length],
    }))
    bandwidthNicRxSeries.value = createEmptyBandwidthSeries()
    bandwidthNicTxSeries.value = createEmptyBandwidthSeries()
    bandwidthL7RxSeries.value = createEmptyBandwidthSeries()
    bandwidthL7TxSeries.value = createEmptyBandwidthSeries()
    latestValuesNicRx.value = bandwidthNicRxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    latestValuesNicTx.value = bandwidthNicTxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    latestValuesL7Rx.value = bandwidthL7RxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    latestValuesL7Tx.value = bandwidthL7TxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    hiddenServers.value = new Set()
    if (nicRxChartInstance) {
      nicRxChartInstance.destroy()
      nicRxChartInstance = null
    }
    if (nicTxChartInstance) {
      nicTxChartInstance.destroy()
      nicTxChartInstance = null
    }
    if (l7RxChartInstance) {
      l7RxChartInstance.destroy()
      l7RxChartInstance = null
    }
    if (l7TxChartInstance) {
      l7TxChartInstance.destroy()
      l7TxChartInstance = null
    }
    createBandwidthCharts()
  } catch (error) {
    console.error('Failed to load servers for bandwidth', error)
    bandwidthServers.value = []
    bandwidthNicRxSeries.value = []
    bandwidthNicTxSeries.value = []
    bandwidthL7RxSeries.value = []
    bandwidthL7TxSeries.value = []
    latestValuesNicRx.value = []
    latestValuesNicTx.value = []
    latestValuesL7Rx.value = []
    latestValuesL7Tx.value = []
  }
}

const formatEventTime = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const eventMarkerClass = (event, index) => {
  const title = String(event?.title || '').toLowerCase()
  if (title.includes('attack') || title.includes('ddos')) return 'threat'
  if (title.includes('suspicious') || title.includes('warning')) return 'warning'
  if (title.includes('resolved') || title.includes('completed')) return 'success'
  return ['threat', 'warning', 'success'][index % 3]
}

const bandwidthRangeOptions = [
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '2h', value: '2h' },
  { label: '4h', value: '4h' },
  { label: '8h', value: '8h' },
  { label: '12h', value: '12h' },
  { label: '24h', value: '24h' },
  { label: '48h', value: '48h' },
]
const serverOptions = computed(() => [
  { label: 'All Servers', value: 'all' },
  ...bandwidthServers.value.map((server) => ({ label: server.label, value: server.id })),
])
const bandwidthRange = ref(bandwidthRangeOptions[0].value)
const requestRange = ref(bandwidthRangeOptions[0].value)
const statusRange = ref(bandwidthRangeOptions[0].value)
const requestServer = ref('all')
const statusServer = ref('all')

const getBandwidthRangeMs = (value) => {
  switch (value) {
    case '1h':
      return 60 * 60 * 1000
    case '2h':
      return 2 * 60 * 60 * 1000
    case '4h':
      return 4 * 60 * 60 * 1000
    case '8h':
      return 8 * 60 * 60 * 1000
    case '12h':
      return 12 * 60 * 60 * 1000
    case '24h':
      return 24 * 60 * 60 * 1000
    case '48h':
      return 48 * 60 * 60 * 1000
    default:
      return 30 * 60 * 1000
  }
}

const createEmptyBandwidthSeries = () =>
  bandwidthServers.value.map((server) => ({
    name: server.label,
    data: [],
  }))

const bandwidthNicRxSeries = ref([])
const bandwidthNicTxSeries = ref([])
const bandwidthL7RxSeries = ref([])
const bandwidthL7TxSeries = ref([])
const latestValuesNicRx = ref([])
const latestValuesNicTx = ref([])
const latestValuesL7Rx = ref([])
const latestValuesL7Tx = ref([])
const hiddenServers = ref(new Set())

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

const mapPayloadToSeries = (payload) => {
  const seriesMap = new Map()
  if (Array.isArray(payload)) {
    payload.forEach((entry) => {
      const points = Array.isArray(entry?.points) ? entry.points : []
      seriesMap.set(Number(entry?.serverId), points)
    })
  }
  return bandwidthServers.value.map((server) => {
    const points = seriesMap.get(server.id) || []
    const data = points
      .map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: Number(point.bandwidth ?? 0),
      }))
      .filter((point) => !Number.isNaN(point.x))
    return { name: server.label, data }
  })
}

/** Max Y across multiple series arrays; returns a nice axis max (min 10). */
const getSharedYMax = (...seriesArrays) => {
  let max = 0
  for (const arr of seriesArrays) {
    for (const s of arr) {
      for (const p of s.data || []) {
        if (typeof p.y === 'number' && p.y > max) max = p.y
      }
    }
  }
  if (max <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(max))
  const normalized = max / magnitude
  const nice = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude
  return Math.ceil(max / nice) * nice || 10
}

const loadBandwidthSeries = async () => {
  if (!bandwidthServers.value.length) {
    return
  }
  try {
    const [payloadNicRx, payloadNicTx, payloadL7Rx, payloadL7Tx] = await Promise.all([
      fetchBandwidthNicRxSeries(bandwidthRange.value),
      fetchBandwidthNicTxSeries(bandwidthRange.value),
      fetchBandwidthL7RxSeries(bandwidthRange.value),
      fetchBandwidthL7TxSeries(bandwidthRange.value),
    ])

    bandwidthNicRxSeries.value = mapPayloadToSeries(payloadNicRx)
    bandwidthNicTxSeries.value = mapPayloadToSeries(payloadNicTx)
    bandwidthL7RxSeries.value = mapPayloadToSeries(payloadL7Rx)
    bandwidthL7TxSeries.value = mapPayloadToSeries(payloadL7Tx)
    latestValuesNicRx.value = bandwidthNicRxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    latestValuesNicTx.value = bandwidthNicTxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    latestValuesL7Rx.value = bandwidthL7RxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    latestValuesL7Tx.value = bandwidthL7TxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)

    const xaxisOpts = {
      range: getBandwidthRangeMs(bandwidthRange.value),
      min: Date.now() - getBandwidthRangeMs(bandwidthRange.value),
      max: Date.now(),
      tickAmount: 20,
    }
    const nicYMax = getSharedYMax(bandwidthNicRxSeries.value, bandwidthNicTxSeries.value)
    const l7YMax = getSharedYMax(bandwidthL7RxSeries.value, bandwidthL7TxSeries.value)
    const rangeOptsNic = {
      xaxis: xaxisOpts,
      yaxis: { min: 0, max: nicYMax },
    }
    const rangeOptsL7 = {
      xaxis: xaxisOpts,
      yaxis: { min: 0, max: l7YMax },
    }

    const applyHidden = (chartInstance) => {
      if (!chartInstance) return
      hiddenServers.value.forEach((serverId) => {
        const server = bandwidthServers.value.find((item) => item.id === serverId)
        if (server) chartInstance.hideSeries(server.label)
      })
    }

    if (nicRxChartInstance) {
      nicRxChartInstance.updateSeries(bandwidthNicRxSeries.value, true)
      nicRxChartInstance.updateOptions(rangeOptsNic, false, true)
      applyHidden(nicRxChartInstance)
    }
    if (nicTxChartInstance) {
      nicTxChartInstance.updateSeries(bandwidthNicTxSeries.value, true)
      nicTxChartInstance.updateOptions(rangeOptsNic, false, true)
      applyHidden(nicTxChartInstance)
    }
    if (l7RxChartInstance) {
      l7RxChartInstance.updateSeries(bandwidthL7RxSeries.value, true)
      l7RxChartInstance.updateOptions(rangeOptsL7, false, true)
      applyHidden(l7RxChartInstance)
    }
    if (l7TxChartInstance) {
      l7TxChartInstance.updateSeries(bandwidthL7TxSeries.value, true)
      l7TxChartInstance.updateOptions(rangeOptsL7, false, true)
      applyHidden(l7TxChartInstance)
    }
  } catch (error) {
    console.error('Failed to load bandwidth series', error)
    bandwidthNicRxSeries.value = createEmptyBandwidthSeries()
    bandwidthNicTxSeries.value = createEmptyBandwidthSeries()
    bandwidthL7RxSeries.value = createEmptyBandwidthSeries()
    bandwidthL7TxSeries.value = createEmptyBandwidthSeries()
    latestValuesNicRx.value = bandwidthNicRxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    latestValuesNicTx.value = bandwidthNicTxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    latestValuesL7Rx.value = bandwidthL7RxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    latestValuesL7Tx.value = bandwidthL7TxSeries.value.map((s) => s.data[s.data.length - 1]?.y ?? 0)
    const resetY = { yaxis: { min: 0, max: 10 } }
    if (nicRxChartInstance) {
      nicRxChartInstance.updateSeries(bandwidthNicRxSeries.value, true)
      nicRxChartInstance.updateOptions(resetY, false, true)
    }
    if (nicTxChartInstance) {
      nicTxChartInstance.updateSeries(bandwidthNicTxSeries.value, true)
      nicTxChartInstance.updateOptions(resetY, false, true)
    }
    if (l7RxChartInstance) {
      l7RxChartInstance.updateSeries(bandwidthL7RxSeries.value, true)
      l7RxChartInstance.updateOptions(resetY, false, true)
    }
    if (l7TxChartInstance) {
      l7TxChartInstance.updateSeries(bandwidthL7TxSeries.value, true)
      l7TxChartInstance.updateOptions(resetY, false, true)
    }
  }
}

const updateRequestResponseAxis = () => {
  if (!requestResponseChartInstance) {
    return
  }
  const rangeMs = getBandwidthRangeMs(requestRange.value)
  requestResponseChartInstance.updateOptions(
    {
      xaxis: {
        range: rangeMs,
        min: Date.now() - rangeMs,
        max: Date.now(),
        tickAmount: 36,
      },
    },
    false,
    true,
  )
}

const updateStatusCodeAxis = () => {
  if (!statusCodeChartInstance) {
    return
  }
  const rangeMs = getBandwidthRangeMs(statusRange.value)
  statusCodeChartInstance.updateOptions(
    {
      xaxis: {
        range: rangeMs,
        min: Date.now() - rangeMs,
        max: Date.now(),
        tickAmount: 36,
      },
    },
    false,
    true,
  )
}

const loadRequestResponseSeries = async () => {
  try {
    const payload = await fetchRequestResponseSeries(requestRange.value, requestServer.value)
    const points = Array.isArray(payload) ? payload : []
    const requests = points
      .map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: Number(point.requestCount ?? 0),
      }))
      .filter((point) => !Number.isNaN(point.x))
    const responses = points
      .map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: Number(point.responseCount ?? 0),
      }))
      .filter((point) => !Number.isNaN(point.x))
    requestResponseSeries.value = [
      { name: 'Requests', data: requests },
      { name: 'Responses', data: responses },
    ]
    if (requestResponseChartInstance) {
      requestResponseChartInstance.updateSeries(requestResponseSeries.value, true)
      updateRequestResponseAxis()
    }
  } catch (error) {
    console.error('Failed to load request response series', error)
    requestResponseSeries.value = [
      { name: 'Requests', data: [] },
      { name: 'Responses', data: [] },
    ]
    if (requestResponseChartInstance) {
      requestResponseChartInstance.updateSeries(requestResponseSeries.value, true)
      updateRequestResponseAxis()
    }
  }
}

const loadStatusCodeSeries = async () => {
  try {
    const payload = await fetchStatusCodeSeries(statusRange.value, statusServer.value)
    const points = Array.isArray(payload) ? payload : []
    const success = points
      .map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: Number(point.success ?? 0),
      }))
      .filter((point) => !Number.isNaN(point.x))
    const redirect = points
      .map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: Number(point.redirect ?? 0),
      }))
      .filter((point) => !Number.isNaN(point.x))
    const client = points
      .map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: Number(point.client ?? 0),
      }))
      .filter((point) => !Number.isNaN(point.x))
    const server = points
      .map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: Number(point.server ?? 0),
      }))
      .filter((point) => !Number.isNaN(point.x))
    statusCodeSeries.value = [
      { name: '2xx', data: success },
      { name: '3xx', data: redirect },
      { name: '4xx', data: client },
      { name: '5xx', data: server },
    ]
    if (statusCodeChartInstance) {
      statusCodeChartInstance.updateSeries(statusCodeSeries.value, true)
      updateStatusCodeAxis()
    }
  } catch (error) {
    console.error('Failed to load status code series', error)
    statusCodeSeries.value = [
      { name: '2xx', data: [] },
      { name: '3xx', data: [] },
      { name: '4xx', data: [] },
      { name: '5xx', data: [] },
    ]
    if (statusCodeChartInstance) {
      statusCodeChartInstance.updateSeries(statusCodeSeries.value, true)
      updateStatusCodeAxis()
    }
  }
}

const toggleServerSeries = (server) => {
  if (nicRxChartInstance) nicRxChartInstance.toggleSeries(server.label)
  if (nicTxChartInstance) nicTxChartInstance.toggleSeries(server.label)
  if (l7RxChartInstance) l7RxChartInstance.toggleSeries(server.label)
  if (l7TxChartInstance) l7TxChartInstance.toggleSeries(server.label)
  const next = new Set(hiddenServers.value)
  if (next.has(server.id)) {
    next.delete(server.id)
  } else {
    next.add(server.id)
  }
  hiddenServers.value = next
  if (nicRxChartInstance) nicRxChartInstance.updateOptions({}, false, true)
  if (nicTxChartInstance) nicTxChartInstance.updateOptions({}, false, true)
  if (l7RxChartInstance) l7RxChartInstance.updateOptions({}, false, true)
  if (l7TxChartInstance) l7TxChartInstance.updateOptions({}, false, true)
}

const defaultBandwidthChartOptions = () => {
  const now = Date.now()
  return {
    chart: {
      type: 'line',
      height: 280,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 1500,
        dynamicAnimation: { speed: 1500 },
      },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 0, hover: { size: 4 } },
    colors: bandwidthServers.value.map((s) => s.color),
    xaxis: {
      type: 'datetime',
      labels: {
        show: true,
        datetimeUTC: false,
        style: { colors: '#94a3b8', fontSize: '13px' },
        formatter: (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      range: getBandwidthRangeMs(bandwidthRange.value),
      min: now - getBandwidthRangeMs(bandwidthRange.value),
      max: now,
      tickAmount: 12,
    },
    yaxis: {
      min: 0,
      max: 10,
      opposite: true,
      labels: {
        formatter: (value) => `${Math.round(value)} Mbps`,
        style: { colors: '#94a3b8', fontSize: '13px' },
      },
    },
    grid: { borderColor: 'rgba(148, 163, 184, 0.35)', strokeDashArray: 6 },
    tooltip: {
      x: { format: 'HH:mm:ss' },
      y: { formatter: (value) => `${Math.round(value)} Mbps` },
      theme: 'light',
    },
    legend: { show: false },
  }
}

const createBandwidthCharts = () => {
  if (
    !bandwidthNicRxChart.value ||
    !bandwidthNicTxChart.value ||
    !bandwidthL7RxChart.value ||
    !bandwidthL7TxChart.value ||
    !bandwidthServers.value.length
  ) {
    return
  }
  const opts = defaultBandwidthChartOptions()
  nicRxChartInstance = new ApexCharts(bandwidthNicRxChart.value, {
    ...opts,
    series: bandwidthNicRxSeries.value,
  })
  nicTxChartInstance = new ApexCharts(bandwidthNicTxChart.value, {
    ...opts,
    series: bandwidthNicTxSeries.value,
  })
  l7RxChartInstance = new ApexCharts(bandwidthL7RxChart.value, {
    ...opts,
    series: bandwidthL7RxSeries.value,
  })
  l7TxChartInstance = new ApexCharts(bandwidthL7TxChart.value, {
    ...opts,
    series: bandwidthL7TxSeries.value,
  })
  nicRxChartInstance.render()
  nicTxChartInstance.render()
  l7RxChartInstance.render()
  l7TxChartInstance.render()
}

const createRequestResponseChart = () => {
  if (!requestResponseChart.value) {
    return
  }

  const now = Date.now()
  const rangeMs = getBandwidthRangeMs(requestRange.value)
  requestResponseChartInstance = new ApexCharts(requestResponseChart.value, {
    chart: {
      type: 'line',
      height: 320,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 1500,
        dynamicAnimation: {
          speed: 1500,
        },
      },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 0,
      hover: { size: 4 },
    },
    colors: ['#22c55e', '#0ea5e9'],
    series: requestResponseSeries.value,
    xaxis: {
      type: 'datetime',
      labels: {
        show: true,
        datetimeUTC: false,
        style: { colors: '#94a3b8' },
        formatter: (value) => {
          const date = new Date(value)
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      range: rangeMs,
      min: now - rangeMs,
      max: now,
      tickAmount: 36,
    },
    yaxis: {
      opposite: true,
      labels: {
        formatter: (value) => `${Math.round(value)} rps`,
        style: { colors: '#94a3b8' },
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.35)',
      strokeDashArray: 6,
    },
    tooltip: {
      x: { format: 'HH:mm' },
      y: { formatter: (value) => `${Math.round(value)} rps` },
      theme: 'light',
    },
    legend: { show: false },
  })

  requestResponseChartInstance.render()
}

const createStatusCodeChart = () => {
  if (!statusCodeChart.value) {
    return
  }

  const now = Date.now()
  const rangeMs = getBandwidthRangeMs(statusRange.value)
  statusCodeChartInstance = new ApexCharts(statusCodeChart.value, {
    chart: {
      type: 'line',
      height: 320,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 1500,
        dynamicAnimation: {
          speed: 1500,
        },
      },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 0,
      hover: { size: 4 },
    },
    colors: ['#22c55e', '#38bdf8', '#f59e0b', '#ef4444'],
    series: statusCodeSeries.value,
    xaxis: {
      type: 'datetime',
      labels: {
        show: true,
        datetimeUTC: false,
        style: { colors: '#94a3b8' },
        formatter: (value) => {
          const date = new Date(value)
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      range: rangeMs,
      min: now - rangeMs,
      max: now,
      tickAmount: 36,
    },
    yaxis: {
      opposite: true,
      labels: {
        formatter: (value) => `${Math.round(value)}`,
        style: { colors: '#94a3b8' },
      },
    },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.35)',
      strokeDashArray: 6,
    },
    tooltip: {
      x: { format: 'HH:mm' },
      y: { formatter: (value) => `${Math.round(value)}` },
      theme: 'light',
    },
    legend: { show: false },
  })

  statusCodeChartInstance.render()
}

onMounted(() => {
  loadDashboardSummary()
  loadSecurityEvents()
  loadBandwidthServers().then(() => {
    if (bandwidthServers.value.length) {
      loadBandwidthSeries()
      bandwidthTimer = window.setInterval(loadBandwidthSeries, bandwidthRefreshMs)
    }
  })
  createRequestResponseChart()
  createStatusCodeChart()
  loadRequestResponseSeries()
  loadStatusCodeSeries()
  trafficTimer = window.setInterval(() => {
    loadRequestResponseSeries()
    loadStatusCodeSeries()
  }, trafficRefreshMs)
})

onBeforeUnmount(() => {
  if (bandwidthTimer) {
    window.clearInterval(bandwidthTimer)
  }
  if (trafficTimer) {
    window.clearInterval(trafficTimer)
  }
  if (nicRxChartInstance) {
    nicRxChartInstance.destroy()
    nicRxChartInstance = null
  }
  if (nicTxChartInstance) {
    nicTxChartInstance.destroy()
    nicTxChartInstance = null
  }
  if (l7RxChartInstance) {
    l7RxChartInstance.destroy()
    l7RxChartInstance = null
  }
  if (l7TxChartInstance) {
    l7TxChartInstance.destroy()
    l7TxChartInstance = null
  }
  if (requestResponseChartInstance) {
    requestResponseChartInstance.destroy()
    requestResponseChartInstance = null
  }
  if (statusCodeChartInstance) {
    statusCodeChartInstance.destroy()
    statusCodeChartInstance = null
  }
})

watch(bandwidthRange, () => {
  const rangeMs = getBandwidthRangeMs(bandwidthRange.value)
  const rangeOpts = {
    xaxis: {
      range: rangeMs,
      min: Date.now() - rangeMs,
      max: Date.now(),
      tickAmount: 20,
    },
  }
  if (nicRxChartInstance) nicRxChartInstance.updateOptions(rangeOpts, false, true)
  if (nicTxChartInstance) nicTxChartInstance.updateOptions(rangeOpts, false, true)
  if (l7RxChartInstance) l7RxChartInstance.updateOptions(rangeOpts, false, true)
  if (l7TxChartInstance) l7TxChartInstance.updateOptions(rangeOpts, false, true)
  loadBandwidthSeries()
})

watch([requestRange, requestServer], () => {
  updateRequestResponseAxis()
  loadRequestResponseSeries()
})

watch([statusRange, statusServer], () => {
  updateStatusCodeAxis()
  loadStatusCodeSeries()
})
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 20px;
}

.analytics-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
}

.analytics-card h2 {
  margin: 0 0 18px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 6px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 11px;
  top: 40px;
  width: 2px;
  height: calc(100% + 4px);
  background: #e5e7eb;
}

.timeline-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-marker.threat {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.timeline-marker.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.timeline-marker.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.timeline-content {
  flex: 1;
  background: #f7fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.timeline-content h4 {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.timeline-content p {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: #718096;
}

.timeline-time {
  font-size: 0.75rem;
  color: #9ca3af;
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

.bandwidth-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bandwidth-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.bandwidth-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.bandwidth-section {
  margin-top: 0px;
  flex: 1 1 0;
}

.bandwidth-sections-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.bandwidth-subheader {
  margin-bottom: 10px;
}

.bandwidth-subheader h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
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
  height: 320px;
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

.bandwidth-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 20px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chart-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1f2937;
}

.chart-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.88rem;
}

.chart-controls {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.range-buttons {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.range-btn {
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: white;
  color: #334155;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.range-btn.active,
.range-btn:hover {
  border-color: rgba(99, 102, 241, 0.5);
  color: #4338ca;
  background: rgba(99, 102, 241, 0.1);
}

.chart-select {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.8rem;
  color: #1f2937;
  background: white;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  font-size: 0.85rem;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s ease;
}

.legend-item--hidden {
  opacity: 0.55;
  border-style: dashed;
}

.legend-item:hover {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(224, 231, 255, 0.25);
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-label {
  font-weight: 600;
}

.legend-value {
  color: #64748b;
  font-size: 0.8rem;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.3);
}

.stat-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-icon.connections {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.stat-icon.users {
  background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
  box-shadow: 0 4px 15px rgba(20, 184, 166, 0.3);
}

.stat-icon.servers {
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.stat-icon.active-servers {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}

.stat-icon.blocked {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

</style>

