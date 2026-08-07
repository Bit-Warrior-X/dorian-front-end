<template>
  <div class="dashboard-view security-analytics-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Security analytics</h2>
        <p>Blocked traffic, geography, and top threat sources across edges and sites.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="security-server">Server</label>
        <select id="security-server" v-model="selectedServer" class="dash-select">
          <option v-for="server in serverOptions" :key="server.value" :value="server.value">
            {{ server.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="security-site">Site</label>
        <select id="security-site" v-model="selectedSite" class="dash-select">
          <option v-for="site in siteOptions" :key="site.value" :value="site.value">
            {{ site.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label>Time range</label>
        <div class="dash-range-pills">
          <button
            v-for="range in timeRanges"
            :key="range.value"
            type="button"
            class="dash-range-pill"
            :class="{ active: selectedTimeRange === range.value && !isCustomRange }"
            @click="selectTimeRange(range.value)"
          >
            {{ range.label }}
          </button>
          <button
            type="button"
            class="dash-range-pill dash-range-pill--custom"
            :class="{ active: isCustomRange }"
            @click="showCustomDialog = true"
          >
            Custom
          </button>
        </div>
      </div>
      <div class="dash-filter-summary">
        <span class="dash-live-dot" aria-hidden="true"></span>
        {{ selectedRangeLabel }}
      </div>
      <button type="button" class="dash-filter-apply" @click="applyFilters">
        Apply
      </button>
    </div>

    <nav class="dash-tabbar" aria-label="Security analytics sections">
      <button
        v-for="tab in securityTabs"
        :key="tab.id"
        type="button"
        class="dash-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div v-show="activeTab === 'overview'" class="analytics-tab-panel">
      <section class="dash-metrics">
        <article v-for="metric in metricCards" :key="metric.label" class="dash-metric-card">
          <div class="dash-metric-label">{{ metric.label }}</div>
          <div class="dash-metric-value num">{{ metric.value }}</div>
        </article>
      </section>
      <section class="dash-grid12">
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Block count by time</h3>
              <p class="dash-panel-desc">Blocked requests over the selected range</p>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--tall">
            <div ref="blockCountChart"></div>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'geography'" class="analytics-tab-panel">
      <section class="dash-grid12">
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Requests by country</h3>
              <p class="dash-panel-desc">Geographic distribution of request volume</p>
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
        <div class="dash-panel c-6">
          <div class="dash-panel-head">
            <h3>Requests Top 30</h3>
          </div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Request counts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in topRequestRows" :key="`req-${row.area}`">
                  <td>{{ row.area }}</td>
                  <td class="num">{{ formatNumber(row.count) }}</td>
                </tr>
                <tr v-if="!topRequestRows.length">
                  <td colspan="2" class="empty-row">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="dash-panel c-6">
          <div class="dash-panel-head">
            <h3>Block counts Top 30</h3>
          </div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Request counts</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in topBlockRows" :key="`blk-${row.area}`">
                  <td>{{ row.area }}</td>
                  <td class="num">{{ formatNumber(row.count) }}</td>
                </tr>
                <tr v-if="!topBlockRows.length">
                  <td colspan="2" class="empty-row">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'toplists'" class="analytics-tab-panel">
      <section class="dash-grid12">
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>URL requests Top 10</h3>
              <p class="dash-panel-desc">Most requested URLs in the selected window</p>
            </div>
          </div>
          <div class="url-bars">
            <div v-for="row in topUrlRows" :key="row.url" class="url-bar-row">
              <div class="url-bar-label">{{ row.url }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill url-bar-fill--l4"
                    :style="{ width: `${urlBarWidth(row.count)}%` }"
                    :title="`${row.url} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value num">{{ formatNumber(row.count) }}</div>
              </div>
            </div>
            <p v-if="!topUrlRows.length" class="empty-row">No data</p>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>Referer Top 10</h3>
              <p class="dash-panel-desc">Top referers driving traffic</p>
            </div>
          </div>
          <div class="url-bars">
            <div v-for="row in topRefererRows" :key="row.referer" class="url-bar-row">
              <div class="url-bar-label">{{ row.referer }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill url-bar-fill--viper"
                    :style="{ width: `${refererBarWidth(row.count)}%` }"
                    :title="`${row.referer} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value num">{{ formatNumber(row.count) }}</div>
              </div>
            </div>
            <p v-if="!topRefererRows.length" class="empty-row">No data</p>
          </div>
        </div>
        <div class="dash-panel c-12">
          <div class="dash-panel-head">
            <div>
              <h3>User agent Top 10</h3>
              <p class="dash-panel-desc">Most common user agents</p>
            </div>
          </div>
          <div class="url-bars">
            <div v-for="row in topUserAgentRows" :key="row.agent" class="url-bar-row">
              <div class="url-bar-label">{{ row.agent }}</div>
              <div class="url-bar-line">
                <div class="url-bar-track">
                  <div
                    class="url-bar-fill url-bar-fill--l7"
                    :style="{ width: `${userAgentBarWidth(row.count)}%` }"
                    :title="`${row.agent} — ${row.count}`"
                  ></div>
                </div>
                <div class="url-bar-value num">{{ formatNumber(row.count) }}</div>
              </div>
            </div>
            <p v-if="!topUserAgentRows.length" class="empty-row">No data</p>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showCustomDialog" class="dialog-overlay" @click.self="showCustomDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Custom time range</h3>
          <button type="button" class="dialog-close" @click="showCustomDialog = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <div class="dialog-form-group">
            <label>Start date &amp; time</label>
            <FlatPickr
              v-model="customStartDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select start time"
            />
          </div>
          <div class="dialog-form-group">
            <label>End date &amp; time</label>
            <FlatPickr
              v-model="customEndDate"
              :config="datePickerConfig"
              class="dialog-input"
              placeholder="Select end time"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button type="button" class="dialog-btn cancel-btn" @click="showCustomDialog = false">Cancel</button>
          <button type="button" class="dialog-btn apply-btn" @click="applyCustomRange">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import ApexCharts from 'apexcharts'
import { SvgMap } from 'vue-svg-map'
import world from '@svg-maps/world'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { fetchServers } from '@/api/servers'
import { fetchSites } from '@/api/sites'
import {
  fetchSecuritySummary,
  fetchSecuritySeries,
  fetchSecuritySummaryGroup,
} from '@/api/securityAnalytics'

const CHART_COLORS = {
  viper: '#3FBD85',
  l4: '#5B9DF0',
  l7: '#B08CF0',
  gold: '#C9A24A',
  warn: '#E0A83F',
  danger: '#E15241',
  success: '#4FBD7A',
}

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

const activeTab = ref('overview')
const securityTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'geography', label: 'Geography' },
  { id: 'toplists', label: 'Top lists' },
]

const selectedServer = ref('all')
const selectedSite = ref('all')
const selectedTimeRange = ref('30m')
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref(null)
const customEndDate = ref(null)
const datePickerConfig = { enableTime: true, dateFormat: 'Y-m-d H:i' }
const appliedFilters = ref({
  server: 'all',
  site: 'all',
  range: '30m',
  isCustom: false,
  customStart: '',
  customEnd: '',
})

const servers = ref([])
const sites = ref([])
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

const metricCards = computed(() => [
  { label: 'Total request counts', value: formatNumber(securityStats.value.totalRequestCounts) },
  { label: 'Block request counts', value: formatNumber(securityStats.value.blockRequestCounts) },
  { label: 'Total IPs', value: formatNumber(securityStats.value.totalIps) },
  { label: 'Blacklisted IPs', value: formatNumber(securityStats.value.blacklistedIps) },
])

const countryRequestMap = computed(() =>
  countryRequests.value.reduce((acc, item) => {
    acc[item.code.toLowerCase()] = item
    return acc
  }, {}),
)

const maxCountryCount = computed(() =>
  Math.max(0, ...countryRequests.value.map((item) => Number(item.count) || 0)),
)

const hoveredCountry = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })

const colorFromRate = (ratio) => {
  if (ratio >= 0.8) return CHART_COLORS.danger
  if (ratio >= 0.6) return CHART_COLORS.warn
  if (ratio >= 0.4) return CHART_COLORS.gold
  if (ratio >= 0.2) return CHART_COLORS.success
  return CHART_COLORS.l4
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
const urlBarWidth = (count) => Math.round(((Number(count) || 0) / urlMaxCount.value) * 100)

const refererMaxCount = computed(() => {
  const values = topRefererRows.value.map((row) => Number(row.count) || 0)
  return Math.max(...values, 1)
})
const refererBarWidth = (count) => Math.round(((Number(count) || 0) / refererMaxCount.value) * 100)

const userAgentMaxCount = computed(() => {
  const values = topUserAgentRows.value.map((row) => Number(row.count) || 0)
  return Math.max(...values, 1)
})
const userAgentBarWidth = (count) =>
  Math.round(((Number(count) || 0) / userAgentMaxCount.value) * 100)

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
      height: 360,
      toolbar: { show: false },
      animations: { enabled: true },
      background: 'transparent',
      foreColor: chartLabelColor(),
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
    },
    colors: [CHART_COLORS.danger],
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

const serverOptions = computed(() => [
  { label: 'All Servers', value: 'all' },
  ...servers.value.map((server) => ({
    label: server.name || `Server ${server.id}`,
    value: server.id,
  })),
])

const siteOptions = computed(() => {
  let list = sites.value
  if (selectedServer.value !== 'all') {
    const serverId = Number(selectedServer.value)
    list = list.filter(
      (site) =>
        Array.isArray(site.serverIds) && site.serverIds.some((id) => Number(id) === serverId),
    )
  }
  return [
    { label: 'All Sites', value: 'all' },
    ...list.map((site) => ({
      label: site.domain || `Site ${site.id}`,
      value: String(site.id),
    })),
  ]
})

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
  const params = { serverId: filters.server, siteId: filters.site }
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

const loadSites = async () => {
  try {
    const list = await fetchSites()
    sites.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Failed to load sites', error)
    sites.value = []
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

    nextTick(() => renderBlockCountChart())
  } catch (error) {
    console.error('Failed to load security analytics', error)
  }
}

const applyFilters = () => {
  appliedFilters.value = {
    server: selectedServer.value,
    site: selectedSite.value,
    range: selectedTimeRange.value,
    isCustom: isCustomRange.value,
    customStart: isCustomRange.value ? formatDateInput(customStartDate.value) : '',
    customEnd: isCustomRange.value ? formatDateInput(customEndDate.value) : '',
  }
  loadSecurityAnalytics()
}

watch(blockSeries, () => {
  if (activeTab.value === 'overview') renderBlockCountChart()
}, { deep: true })

watch(activeTab, (tab) => {
  if (tab === 'overview') nextTick(() => renderBlockCountChart())
})

watch(selectedServer, () => {
  if (selectedSite.value === 'all') return
  const stillValid = siteOptions.value.some((option) => option.value === selectedSite.value)
  if (!stillValid) selectedSite.value = 'all'
})

onMounted(() => {
  loadServers()
  loadSites()
  loadSecurityAnalytics()
  window.addEventListener('cdnproxy-theme-change', renderBlockCountChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', renderBlockCountChart)
  if (blockCountChartInstance) {
    blockCountChartInstance.destroy()
    blockCountChartInstance = null
  }
})
</script>

<style scoped>
.security-analytics-view {
  max-width: 1680px;
  margin: 0 auto;
}

.analytics-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dash-chart-wrap--tall {
  min-height: 360px;
}

.world-map {
  width: 100%;
  height: fit-content;
  border-radius: 12px;
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
  fill: rgba(63, 189, 133, 0.85);
}

.map-tooltip {
  position: absolute;
  z-index: 5;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  font-size: var(--type-caption);
  font-weight: 600;
  pointer-events: none;
  white-space: nowrap;
}

.table-wrap {
  max-height: 360px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.ip-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--type-caption);
}

.ip-table th,
.ip-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--app-border);
}

.ip-table th {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-label);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  position: sticky;
  top: 0;
  background: var(--app-surface);
  z-index: 1;
}

.ip-table td {
  color: var(--app-text);
}

.empty-row {
  color: var(--app-text-muted);
  text-align: center;
  padding: 16px 0;
  margin: 0;
}

.url-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.url-bar-row {
  display: grid;
  grid-template-columns: minmax(120px, 28%) 1fr;
  gap: 12px;
  align-items: center;
}

.url-bar-label {
  font-size: var(--type-caption);
  color: var(--app-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.url-bar-line {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.url-bar-track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--app-surface-muted);
  overflow: hidden;
}

.url-bar-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 2px;
  transition: width 0.25s ease;
}

.url-bar-fill--l4 {
  background: linear-gradient(90deg, #5b9df0 0%, #3f82d4 100%);
}

.url-bar-fill--viper {
  background: linear-gradient(90deg, #3fbd85 0%, #2e9e6c 100%);
}

.url-bar-fill--l7 {
  background: linear-gradient(90deg, #b08cf0 0%, #8b5cf6 100%);
}

.url-bar-value {
  min-width: 56px;
  text-align: right;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.dialog-overlay {
  position: fixed;
  inset: 0;
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
  font-size: var(--type-section-title);
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
  font-size: var(--type-caption);
  color: var(--app-text-secondary);
}

.dialog-input {
  padding: 10px 12px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: var(--type-base);
  outline: none;
  background: var(--app-input-bg);
  color: var(--app-text);
}

.dialog-input:focus {
  border-color: var(--app-accent);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
}

.dialog-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: var(--type-base);
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: var(--app-surface-hover);
  color: var(--app-text-secondary);
}

.apply-btn {
  background: var(--app-btn-primary-bg);
  color: #fff;
}

.apply-btn:hover {
  background: var(--app-btn-primary-hover);
}

[data-theme='dark'] .world-map :deep(.svg-map__location) {
  fill: #121815;
  stroke: rgba(255, 255, 255, 0.12);
}

[data-theme='dark'] .world-map :deep(.svg-map__location:hover) {
  fill: rgba(63, 189, 133, 0.85);
}

@media (max-width: 900px) {
  .url-bar-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
