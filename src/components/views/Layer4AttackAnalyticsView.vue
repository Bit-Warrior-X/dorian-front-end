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
          <p class="attack-value">{{ statsDisplay.totalTraffic }}</p>
          <span class="attack-change positive">{{ statsDisplay.totalTrafficTrend }}</span>
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
          <p class="attack-value">{{ statsDisplay.allowedTraffic }}</p>
          <span class="attack-change positive">{{ statsDisplay.allowedTrafficTrend }}</span>
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
          <p class="attack-value">{{ statsDisplay.blockedTraffic }}</p>
          <span class="attack-change positive">{{ statsDisplay.blockedTrafficTrend }}</span>
          </div>
        </div>
      </div>

    <div class="attack-charts">
        <div class="attack-chart-card attack-chart-card--single">
          <div class="chart-header">
            <h3>Allowed vs Blocked Traffic by Time</h3>
          </div>
          <div class="chart-body">
            <div ref="trafficChart"></div>
          </div>
        </div>
        <div class="attack-chart-card attack-chart-card--single">
          <div class="chart-header">
            <h3>IP Protocols by Time</h3>
          </div>
          <div class="chart-body">
            <div ref="protocolChart"></div>
          </div>
        </div>
      </div>
      
    <div class="attack-table-grid">
        <div class="attack-chart-card attack-table-card--scroll">
          <h3>Recent Attack Attempts</h3>
          <div class="attack-table-scroll">
            <table class="attack-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source IP</th>
                  <th>Attack Type</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in recentAttackRows" :key="`${row.sourceIp}-${row.timestamp}`">
                  <td>{{ formatDateTime(row.timestamp) }}</td>
                  <td>{{ row.sourceIp }}</td>
                  <td><span :class="['badge', attackBadgeClass(row.attackType)]">{{ row.attackType }}</span></td>
                </tr>
                <tr v-if="!recentAttackRows.length">
                  <td colspan="3">No recent attacks</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="attack-chart-card attack-table-card--scroll">
          <div class="table-header-row">
            <h3>Top Seen Attacking IPs</h3>
            <div class="table-controls">
              <span>Show</span>
              <select v-model="seenIpLimit" class="table-select">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          <div class="attack-table-scroll">
            <table class="attack-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Seen Count</th>
                  <th>Last Seen</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in visibleSeenIps" :key="row.ip">
                  <td>{{ row.ip }}</td>
                  <td>{{ formatNumber(row.count) }}</td>
                  <td>{{ formatDateTime(row.lastSeen) }}</td>
                  <td>
                    <button
                      type="button"
                      class="action-btn action-btn--danger"
                      @click="openBlacklistDialog(row.ip)"
                    >
                      Move to blacklist
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
            <FlatPickr
              v-model="customStartDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select start time"
            />
          </label>
          <label>
            End
            <FlatPickr
              v-model="customEndDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select end time"
            />
          </label>
        </div>
        <div class="dialog-actions">
          <button type="button" class="apply-filter-btn" @click="applyCustomRange">Apply</button>
        </div>
      </div>
    </div>
    <div v-if="showBlacklistDialog" class="dialog-overlay" @click.self="closeBlacklistDialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Add to Blacklist</h3>
          <button class="dialog-close" @click="closeBlacklistDialog">✕</button>
        </div>
        <div class="dialog-body">
          <label>
            Server
            <select v-model="blacklistForm.serverId" class="dialog-input">
              <option value="all">Select Server</option>
              <option v-for="server in servers" :key="server.id" :value="server.id">
                {{ server.name || `Server ${server.id}` }}
              </option>
            </select>
          </label>
          <label>
            IP Address
            <input v-model="blacklistForm.ip" type="text" class="dialog-input" readonly />
          </label>
          <label>
            Reason
            <input v-model="blacklistForm.reason" type="text" class="dialog-input" placeholder="Reason" />
          </label>
        </div>
        <div class="dialog-actions">
          <button type="button" class="apply-filter-btn" @click="submitBlacklist">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ApexCharts from 'apexcharts'
import { createL4BlacklistEntry } from '@/api/l4'
import { fetchServers } from '@/api/servers'
import { fetchL4Summary, fetchL4Series, fetchL4Attacks } from '@/api/l4Analytics'
import { notifyError, notifySuccess } from '@/utils/notify'

const L4_DDOS_TITLE = 'L4 DDoS Defense'

const chartGridColor = () => {
  if (typeof document === 'undefined') return 'rgba(148, 163, 184, 0.2)'
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() ||
    'rgba(148, 163, 184, 0.2)'
  )
}

const chartLabelColor = () => {
  if (typeof document === 'undefined') return '#64748b'
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--chart-label').trim() ||
    '#64748b'
  )
}

const chartTooltipTheme = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light'

const chartDatetimeXaxis = () => ({
  type: 'datetime',
  tickAmount: 6,
  axisBorder: { show: true, color: chartGridColor() },
  axisTicks: { show: true, color: chartGridColor() },
  labels: {
    show: true,
    datetimeUTC: false,
    format: 'HH:mm',
    hideOverlappingLabels: false,
    rotate: 0,
    style: { colors: chartLabelColor(), fontSize: '11px' },
  },
})

const selectedServer = ref('all')
const selectedTimeRange = ref('1h')
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref(null)
const customEndDate = ref(null)
const datePickerConfig = { enableTime: true, dateFormat: 'Y-m-d H:i' }
const appliedFilters = ref({
  server: selectedServer.value,
  range: selectedTimeRange.value,
  isCustom: false,
  start: null,
  end: null,
})
const trafficChart = ref(null)
const protocolChart = ref(null)
let trafficChartInstance = null
let protocolChartInstance = null
const seenIpLimit = ref('10')
const servers = ref([])
const l4Summary = ref({
  totalTraffic: 0,
  allowedTraffic: 0,
  blockedTraffic: 0,
})
const trafficPoints = ref([])
const protocolPoints = ref([])
const recentAttackRows = ref([])
const seenIpRows = ref([])
const showBlacklistDialog = ref(false)
const blacklistForm = ref({
  ip: '',
  reason: '',
  serverId: 'all',
  triggerRule: 'manual',
  customTriggerRule: '',
  ttl: '24h',
  customTtl: '',
})

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
  ...servers.value.map((server) => ({ label: server.name || `Server ${server.id}`, value: server.id })),
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
    isCustom: true,
    start: formatDateInput(customStartDate.value),
    end: formatDateInput(customEndDate.value),
  }
  showCustomDialog.value = false
  loadL4Analytics()
}

const applyFilters = () => {
  appliedFilters.value = {
    server: selectedServer.value,
    range: selectedTimeRange.value,
    isCustom: isCustomRange.value,
    start: isCustomRange.value ? formatDateInput(customStartDate.value) : null,
    end: isCustomRange.value ? formatDateInput(customEndDate.value) : null,
  }
  loadL4Analytics()
}

const selectedRangeLabel = computed(() => {
  if (isCustomRange.value && customStartDate.value && customEndDate.value) {
    return `${formatDateTime(customStartDate.value)} → ${formatDateTime(customEndDate.value)}`
  }
  const match = timeRanges.find((range) => range.value === selectedTimeRange.value)
  return match?.label ?? 'Custom'
})

const visibleSeenIps = computed(() => {
  const limit = Number(seenIpLimit.value) || 10
  return seenIpRows.value.slice(0, limit)
})

const openBlacklistDialog = (ip) => {
  blacklistForm.value = {
    ip,
    reason: '',
    serverId: selectedServer.value || 'all',
    triggerRule: 'manual',
    customTriggerRule: '',
    ttl: '24h',
    customTtl: '',
  }
  showBlacklistDialog.value = true
}

const closeBlacklistDialog = () => {
  showBlacklistDialog.value = false
}

const submitBlacklist = async () => {
  const selectedId = blacklistForm.value.serverId || selectedServer.value
  const serverId = Number(selectedId)
  if (!serverId) {
    notifyError(L4_DDOS_TITLE, 'Please select a server first.')
    return
  }

  const ipAddress = String(blacklistForm.value.ip || '').trim()
  if (!ipAddress) {
    notifyError(L4_DDOS_TITLE, 'The IP address is missing.')
    return
  }

  const reason = blacklistForm.value.reason.trim() || 'Manual block'

  try {
    await createL4BlacklistEntry(serverId, {
      ipAddress,
      reason,
    })
    notifySuccess(L4_DDOS_TITLE, 'The IP address is successfully added to the L4 DDoS blacklist.')
    closeBlacklistDialog()
  } catch (error) {
    notifyError(L4_DDOS_TITLE, error?.message || 'The IP address could not be added to the L4 DDoS blacklist.')
  }
}

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
}

const formatThroughput = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 bytes'
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  let current = numeric
  while (current >= 1000 && index < units.length - 1) {
    current /= 1000
    index += 1
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[index]}`
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

const attackBadgeClass = (value) => {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('syn')) return 'attack-syn'
  if (normalized.includes('udp')) return 'attack-udp'
  if (normalized.includes('icmp')) return 'attack-icmp'
  return 'attack-other'
}

const statsDisplay = computed(() => ({
  totalTraffic: formatThroughput(l4Summary.value.totalTraffic),
  allowedTraffic: formatThroughput(l4Summary.value.allowedTraffic),
  blockedTraffic: formatThroughput(l4Summary.value.blockedTraffic),
  totalTrafficTrend: '—',
  allowedTrafficTrend: '—',
  blockedTrafficTrend: '—',
}))

const resolveRangeMs = (filters) => {
  switch (filters.range) {
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

const resolveRangeWindow = (filters) => {
  const now = new Date()
  if (filters.isCustom && filters.start && filters.end) {
    return { start: new Date(filters.start), end: new Date(filters.end) }
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

const mapSeriesPoints = (points, field) =>
  (Array.isArray(points) ? points : [])
    .map((point) => ({
      x: new Date(point.timestamp).getTime(),
      y: Number(point[field] ?? 0),
    }))
    .filter((point) => !Number.isNaN(point.x))

const buildL4Params = () => {
  const filters = appliedFilters.value
  const params = { serverId: filters.server }
  if (filters.isCustom && filters.start && filters.end) {
    params.start = filters.start
    params.end = filters.end
  } else {
    params.range = filters.range
  }
  return params
}

const loadServers = async () => {
  try {
    const list = await fetchServers()
    servers.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Failed to load servers', error)
    servers.value = []
  }
}

const loadL4Analytics = async () => {
  const params = buildL4Params()
  try {
    const [summary, trafficSeries, protocolSeries, recentAttacks, topIps] = await Promise.all([
      fetchL4Summary(params),
      fetchL4Series('traffic', params),
      fetchL4Series('protocols', params),
      fetchL4Attacks('recent', { ...params, limit: 10 }),
      fetchL4Attacks('top-ips', { ...params, limit: 50 }),
    ])

    l4Summary.value = {
      totalTraffic: Number(summary?.totalTraffic ?? 0),
      allowedTraffic: Number(summary?.allowedTraffic ?? 0),
      blockedTraffic: Number(summary?.blockedTraffic ?? 0),
    }
    trafficPoints.value = Array.isArray(trafficSeries) ? trafficSeries : []
    protocolPoints.value = Array.isArray(protocolSeries) ? protocolSeries : []
    recentAttackRows.value = Array.isArray(recentAttacks) ? recentAttacks : []
    seenIpRows.value = Array.isArray(topIps) ? topIps : []

    renderTrafficChart()
    renderProtocolChart()
  } catch (error) {
    console.error('Failed to load l4 analytics', error)
  }
}

const renderTrafficChart = () => {
  if (!trafficChart.value) return

  const allowedSeries = mapSeriesPoints(trafficPoints.value, 'allowedTraffic')
  const blockedSeries = mapSeriesPoints(trafficPoints.value, 'blockedTraffic')

  // Derive x‑axis bounds from actual data for consistency
  // with the protocol chart and to avoid empty renders when
  // the backend window differs slightly from the frontend.
  const allPoints = [...allowedSeries, ...blockedSeries]
  const hasPoints = allPoints.length > 0
  const minX = hasPoints ? Math.min(...allPoints.map((p) => p.x)) : null
  const maxX = hasPoints ? Math.max(...allPoints.map((p) => p.x)) : null

  const options = {
    chart: {
      type: 'line',
      height: 420,
      toolbar: { show: false },
      animations: { enabled: true },
      foreColor: chartLabelColor(),
      zoom: { enabled: false },
      selection: { enabled: false },
      pan: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#10b981', '#ef4444'],
    xaxis: {
      ...chartDatetimeXaxis(),
      ...(hasPoints && { min: minX, max: maxX }),
    },
    yaxis: {
      labels: {
        style: { colors: chartLabelColor() },
        formatter: (val) => formatThroughput(val),
      },
    },
    grid: { borderColor: chartGridColor() },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: { formatter: (val) => formatThroughput(val) },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      labels: { colors: chartLabelColor() },
    },
    series: [
      { name: 'Allowed', data: allowedSeries },
      { name: 'Blocked', data: blockedSeries },
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

  const series = [
    { name: 'TCP', data: mapSeriesPoints(protocolPoints.value, 'tcp') },
    { name: 'UDP', data: mapSeriesPoints(protocolPoints.value, 'udp') },
    { name: 'ICMP', data: mapSeriesPoints(protocolPoints.value, 'icmp') },
    { name: 'GRE', data: mapSeriesPoints(protocolPoints.value, 'gre') },
    { name: 'OTHER', data: mapSeriesPoints(protocolPoints.value, 'other') },
  ]

  // Derive x‑axis bounds from actual data so the chart
  // always renders even if the frontend/backend windows differ.
  const allPoints = series.flatMap((s) => s.data)
  const hasPoints = allPoints.length > 0
  const minX = hasPoints ? Math.min(...allPoints.map((p) => p.x)) : null
  const maxX = hasPoints ? Math.max(...allPoints.map((p) => p.x)) : null

  const options = {
    chart: {
      type: 'line',
      height: 420,
      toolbar: { show: false },
      animations: { enabled: true },
      foreColor: chartLabelColor(),
      zoom: { enabled: false },
      selection: { enabled: false },
      pan: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'],
    xaxis: {
      ...chartDatetimeXaxis(),
      ...(hasPoints && { min: minX, max: maxX }),
    },
    yaxis: {
      labels: {
        style: { colors: chartLabelColor() },
        formatter: (val) => formatThroughput(val),
      },
    },
    grid: { borderColor: chartGridColor() },
    tooltip: {
      theme: chartTooltipTheme(),
      x: { format: 'yyyy/MM/dd HH:mm' },
      y: { formatter: (val) => formatThroughput(val) },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      labels: { colors: chartLabelColor() },
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
}, { deep: true })

const rerenderCharts = () => {
  renderTrafficChart()
  renderProtocolChart()
}

onMounted(() => {
  loadServers()
  loadL4Analytics()
  window.addEventListener('cdnproxy-theme-change', rerenderCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', rerenderCharts)
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
  gap: var(--space-gap-lg, 14px);
}

.filters-card {
  background: var(--app-surface);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
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
  gap: 12px;
  flex-wrap: wrap;
}

.filters-left {
  flex: 1 1 420px;
}

.filters-center {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 1 auto;
  justify-content: center;
  color: var(--app-text-secondary);
  font-weight: 600;
}

.filters-right {
  flex: 0 1 auto;
  justify-content: flex-end;
  margin-left: auto;
}

.selected-range-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-text-secondary);
  font-weight: 600;
}

.filter-inline-label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.inline-select {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 0.95rem;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-width: 200px;
}

.inline-select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.selected-range-label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.selected-range-value {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 0.85rem;
  font-weight: 600;
}

.time-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-btn {
  border: 1px solid var(--app-border-strong);
  cursor: pointer;
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  transition: all 0.2s ease;
}

.time-btn:hover {
  border-color: var(--app-accent);
  background: var(--app-surface-hover);
  color: var(--app-text);
}

.time-btn.active {
  /* primary fill from theme.css */
}

.custom-btn {
  border-left: 2px solid var(--app-border-strong);
  margin-left: 4px;
}

.custom-btn.active {
  border-left-color: transparent;
}

.apply-filter-btn {
  cursor: pointer;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--app-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.dialog-content {
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border-strong);
  padding: 20px;
  border-radius: 16px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 60px var(--app-shadow);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  color: var(--app-heading);
}

.dialog-body {
  display: grid;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--app-text-secondary);
}

.dialog-body label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-input {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--app-input-border);
  background: var(--app-input-bg);
  color: var(--app-text);
}

.dialog-input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
  outline: none;
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
  color: var(--app-text-muted);
}

.attack-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-gap-lg, 14px);
}

.attack-stat-card {
  background: var(--app-surface);
  border-radius: 16px;
  padding: var(--space-card, 14px 16px);
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--app-border);
  box-shadow: 0 4px 20px var(--app-shadow);
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
  color: var(--app-text-muted);
  margin: 0 0 6px 0;
  font-weight: 500;
}

.attack-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--app-heading);
  margin: 0 0 6px 0;
}

.attack-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.attack-change.positive {
  color: #10b981;
}

.attack-chart-card h3,
.attack-table-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--app-heading);
  margin: 0 0 20px 0;
}

.table-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.table-header-row h3 {
  margin: 0;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--app-text-secondary);
  font-weight: 600;
}

.table-select {
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.85rem;
  background: var(--app-input-bg);
  color: var(--app-text);
}

.attack-table {
  width: 100%;
  border-collapse: collapse;
}

.attack-table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-gap-lg, 14px);
}

.attack-table-card--scroll {
  height: 420px;
}

.attack-table-scroll {
  overflow-y: auto;
  max-height: 320px;
  padding-right: 4px;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

.attack-table-scroll .attack-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--app-surface-muted);
  box-shadow: 0 1px 0 var(--app-border-strong);
}

.attack-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-gap-lg, 14px);
}

.attack-chart-card--single {
  grid-column: 1 / -1;
}

.attack-chart-card {
  background: var(--app-surface-muted);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid var(--app-border);
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
  color: var(--app-heading);
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
  border: 1px solid var(--app-border);
  background: var(--chart-surface, var(--app-surface-elevated));
  overflow: hidden;
}

.chart-body div {
  width: 100%;
  height: 100%;
}

.chart-body :deep(.apexcharts-canvas),
.chart-body :deep(.apexcharts-svg),
.chart-body :deep(.apexcharts-inner) {
  background: transparent !important;
}

.attack-table thead {
  background: var(--app-surface-muted);
}

.attack-table th {
  padding: 16px;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--app-text-secondary);
  border-bottom: 2px solid var(--app-border-strong);
}

.attack-table td {
  padding: 16px;
  border-bottom: 1px solid var(--app-border-strong);
  color: var(--app-text);
  font-size: 0.9rem;
}

.attack-table tbody tr:hover {
  background: var(--app-surface-hover);
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

.badge.attack-other {
  background: rgba(148, 163, 184, 0.2);
  color: #64748b;
}

.badge.status-blocked {
  background: #d1fae5;
  color: #065f46;
}

.action-btn {
  padding: 6px 14px;
  background: var(--app-surface-hover);
  border: 1px solid var(--app-border-strong);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--app-text-secondary);
}

.action-btn--danger {
  color: var(--app-btn-danger-bg);
}

[data-theme='dark'] .badge.attack-syn {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

[data-theme='dark'] .badge.attack-udp {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

[data-theme='dark'] .badge.attack-icmp {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

[data-theme='dark'] .badge.attack-other {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
}

[data-theme='dark'] .chart-pill {
  color: #5eead4;
  background: rgba(20, 184, 166, 0.2);
}

[data-theme='dark'] .chart-pill.danger {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.2);
}

[data-theme='dark'] .attack-change.positive {
  color: #4ade80;
}
</style>

