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
          <h3>Total Request Counts</h3>
          <p class="stat-value">{{ statsDisplay.totalRequestCounts }}</p>
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
          <p class="stat-value">{{ statsDisplay.blockRequestCounts }}</p>
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
          <p class="stat-value">{{ statsDisplay.totalIps }}</p>
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
          <p class="stat-value">{{ statsDisplay.blacklistedIps }}</p>
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
        <div class="table-card table-card--compact table-card--tight table-card--scroll">
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
                  <td>{{ formatNumber(row.count) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="table-card table-card--compact table-card--tight table-card--scroll">
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
                  <td>{{ formatNumber(row.count) }}</td>
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
                <div class="url-bar-value">{{ formatNumber(row.count) }}</div>
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
                    :style="{ width: `${refererBarWidth(row.count)}%` }"
                    :title="`${row.referer} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value">{{ formatNumber(row.count) }}</div>
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
                    :style="{ width: `${userAgentBarWidth(row.count)}%` }"
                    :title="`${row.agent} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value">{{ formatNumber(row.count) }}</div>
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ApexCharts from 'apexcharts'
import { SvgMap } from 'vue-svg-map'
import world from '@svg-maps/world'
import { fetchServers } from '@/api/servers'
import {
  fetchSecuritySummary,
  fetchSecuritySeries,
  fetchSecuritySummaryGroup,
} from '@/api/securityAnalytics'

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

const mapEmptyFill = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(148, 163, 184, 0.2)'

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

const servers = ref([])
const securityStats = ref({
  totalRequestCounts: 0,
  blockRequestCounts: 0,
  totalIps: 0,
  blacklistedIps: 0,
})

const blockCountChart = ref(null)
let blockCountChartInstance = null
const blockSeries = ref([])

const countryRequests = ref([])
const topRequestRows = ref([])
const topBlockRows = ref([])
const topUrlRows = ref([])
const topRefererRows = ref([])
const topUserAgentRows = ref([])

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
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
  totalRequestCounts: formatNumber(securityStats.value.totalRequestCounts),
  blockRequestCounts: formatNumber(securityStats.value.blockRequestCounts),
  totalIps: formatNumber(securityStats.value.totalIps),
  blacklistedIps: formatNumber(securityStats.value.blacklistedIps),
}))

const countryRequestMap = computed(() =>
  countryRequests.value.reduce((acc, item) => {
    acc[item.code.toLowerCase()] = item
    return acc
  }, {})
)
const maxCountryCount = computed(() =>
  Math.max(0, ...countryRequests.value.map((item) => Number(item.count) || 0))
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
  const entry = countryRequestMap.value[location.id.toLowerCase()]
  const ratio = entry && maxCountryCount.value ? entry.count / maxCountryCount.value : 0
  return {
    fill: entry ? colorFromRate(ratio) : mapEmptyFill(),
    stroke: 'rgba(100, 116, 139, 0.6)',
    'stroke-width': 0.5,
    title: entry
      ? `${entry.name} — ${formatNumber(entry.count)} requests`
      : location.name,
    onMouseenter: () => {
      hoveredCountry.value = entry
        ? `${entry.name} — ${formatNumber(entry.count)} requests`
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

const urlMaxCount = computed(() => {
  const values = topUrlRows.value.map((row) => Number(row.count) || 0)
  return Math.max(...values, 1)
})
const urlBarWidth = (count) => {
  const numeric = Number(count) || 0
  return Math.round((numeric / urlMaxCount.value) * 100)
}

const refererMaxCount = computed(() => {
  const values = topRefererRows.value.map((row) => Number(row.count) || 0)
  return Math.max(...values, 1)
})
const refererBarWidth = (count) => {
  const numeric = Number(count) || 0
  return Math.round((numeric / refererMaxCount.value) * 100)
}

const userAgentMaxCount = computed(() => {
  const values = topUserAgentRows.value.map((row) => Number(row.count) || 0)
  return Math.max(...values, 1)
})
const userAgentBarWidth = (count) => {
  const numeric = Number(count) || 0
  return Math.round((numeric / userAgentMaxCount.value) * 100)
}

const mapBlockPoints = (points) =>
  (Array.isArray(points) ? points : [])
    .map((point) => {
      const timestamp = point.timestamp ?? point.time ?? point.x
      const timeValue =
        typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()
      return {
        x: timeValue,
        y: Number(point.count ?? point.value ?? point.y ?? 0),
      }
    })
    .filter((point) => Number.isFinite(point.x))

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

const renderBlockCountChart = () => {
  if (!blockCountChart.value) return
  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const series = [{ name: 'Blocked', data: mapBlockPoints(blockSeries.value) }]
  const options = {
    chart: {
      type: 'area',
      height: 400,
      toolbar: { show: false },
      animations: { enabled: true },
      foreColor: chartLabelColor(),
      zoom: {
        enabled: false,
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: ['#ef4444'],
    xaxis: {
      type: 'datetime',
      min: start.getTime(),
      max: end.getTime(),
      tickAmount: 24,
      labels: { style: { colors: chartLabelColor() } },
    },
    yaxis: {
      labels: {
        style: { colors: chartLabelColor() },
        formatter: (val) => `${Math.round(val)}`,
      },
    },
    grid: { borderColor: chartGridColor() },
    tooltip: {
      theme: chartTooltipTheme(),
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

watch(blockSeries, () => {
  renderBlockCountChart()
}, { deep: true })

const rerenderBlockCountChart = () => {
  renderBlockCountChart()
}

onMounted(() => {
  loadServers()
  loadSecurityAnalytics()
  renderBlockCountChart()
  window.addEventListener('cdnproxy-theme-change', rerenderBlockCountChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', rerenderBlockCountChart)
  if (blockCountChartInstance) {
    blockCountChartInstance.destroy()
    blockCountChartInstance = null
  }
})

const serverOptions = computed(() => [
  { label: 'All Servers', value: 'all' },
  ...servers.value.map((server) => ({ label: server.name || `Server ${server.id}`, value: server.id })),
])

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

const buildSecurityParams = () => {
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

const loadServers = async () => {
  try {
    const list = await fetchServers()
    servers.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Failed to load servers', error)
    servers.value = []
  }
}

const loadSecurityAnalytics = async () => {
  const params = buildSecurityParams()
  try {
    const [
      summary,
      blockCounts,
      countries,
      topRequests,
      topBlocks,
      topUrls,
      topReferers,
      topUserAgents,
    ] = await Promise.all([
      fetchSecuritySummary(params),
      fetchSecuritySeries('block-count', params),
      fetchSecuritySummaryGroup('countries', params),
      fetchSecuritySummaryGroup('top-requests', params),
      fetchSecuritySummaryGroup('top-blocks', params),
      fetchSecuritySummaryGroup('top-urls', params),
      fetchSecuritySummaryGroup('top-referers', params),
      fetchSecuritySummaryGroup('top-user-agents', params),
    ])

    securityStats.value = {
      totalRequestCounts: Number(summary?.totalRequestCounts ?? 0),
      blockRequestCounts: Number(summary?.blockRequestCounts ?? 0),
      totalIps: Number(summary?.totalIps ?? 0),
      blacklistedIps: Number(summary?.blacklistedIps ?? 0),
    }
    blockSeries.value = Array.isArray(blockCounts) ? blockCounts : []
    countryRequests.value = Array.isArray(countries) ? countries : []
    topRequestRows.value = Array.isArray(topRequests) ? topRequests : []
    topBlockRows.value = Array.isArray(topBlocks) ? topBlocks : []
    topUrlRows.value = Array.isArray(topUrls) ? topUrls : []
    topRefererRows.value = Array.isArray(topReferers) ? topReferers : []
    topUserAgentRows.value = Array.isArray(topUserAgents) ? topUserAgents : []

    renderBlockCountChart()
  } catch (error) {
    console.error('Failed to load security analytics', error)
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
  loadSecurityAnalytics()
}
</script>

<style scoped>
.security-analytics-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filters-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.filters-header h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--app-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border-strong);
  border-radius: 16px;
  box-shadow: 0 20px 60px var(--app-shadow);
  width: 90%;
  max-width: 500px;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--app-border-strong);
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--app-heading);
}

.dialog-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-muted);
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
  color: var(--app-text-secondary);
}

.dialog-input {
  padding: 10px 12px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  background: var(--app-input-bg);
  color: var(--app-text);
}

.dialog-input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--app-border-strong);
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
  background: var(--app-surface-hover);
  color: var(--app-text-secondary);
}

.apply-btn {
  /* primary fill from theme.css */
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px var(--app-shadow), 0 0 0 1px var(--app-accent-soft);
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
  color: var(--app-text-muted);
  margin: 0 0 8px 0;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--app-heading);
  margin: 0;
}

.stat-subvalue {
  margin: 6px 0 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #10b981;
}

.world-map {
  width: 100%;
  height: fit-content;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted);
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

.top-tables {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.table-card {
  background: var(--app-surface-muted);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid var(--app-border);
}

.table-card--compact {
  background: var(--app-surface-muted);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid var(--app-border);
}

.table-card--tight {
  padding: 12px;
}

.table-card--tight .table-title {
  font-size: 0.88rem;
  margin-bottom: 8px;
}

.table-card--tight .ip-table th,
.table-card--tight .ip-table td {
  padding: 8px 10px;
  font-size: 0.82rem;
}

.table-card--scroll .table-wrap {
  max-height: 240px;
  overflow-y: auto;
}

.table-card--scroll .ip-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--app-surface-muted);
  box-shadow: 0 1px 0 var(--app-border-strong);
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
  color: var(--app-heading);
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
  border-bottom: 1px solid var(--app-border-strong);
  color: var(--app-text);
}

.ip-table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--app-text-muted);
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
  background: var(--app-border-strong);
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
  border: 1px solid var(--app-border);
  background: var(--chart-surface, var(--app-surface-elevated));
}

.bandwidth-chart div {
  width: 100%;
  height: 100%;
  display: block;
}

.bandwidth-chart :deep(.apexcharts-canvas),
.bandwidth-chart :deep(.apexcharts-svg),
.bandwidth-chart :deep(.apexcharts-inner) {
  background: transparent !important;
}

.bandwidth-chart--tall {
  height: 420px;
}

.url-bar-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--app-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.url-bar-value {
  font-size: 0.8rem;
  color: var(--app-text-muted);
  font-weight: 600;
}

[data-theme='dark'] .world-map :deep(.svg-map__location:hover) {
  fill: rgba(168, 85, 247, 0.85);
}

[data-theme='dark'] .stat-subvalue {
  color: #4ade80;
}
</style>

