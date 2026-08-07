<template>
  <div class="dashboard-view" ref="dashboardRoot">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Fleet overview</h2>
        <p>{{ fleetSubtitle }}</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="dash-edge-filter">Edge node</label>
        <select id="dash-edge-filter" v-model="selectedEdge" class="dash-select">
          <option v-for="option in serverOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="dash-site-filter">Site</label>
        <select id="dash-site-filter" v-model="selectedSite" class="dash-select">
          <option v-for="option in siteOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label>Time range</label>
        <div class="dash-range-pills">
          <button
            v-for="pill in rangePillOptions"
            :key="pill.value"
            type="button"
            class="dash-range-pill"
            :class="{ active: bandwidthRange === pill.value }"
            @click="setRange(pill.value)"
          >
            {{ pill.label }}
          </button>
        </div>
      </div>
      <div class="dash-filter-summary">
        <span class="dash-live-dot" aria-hidden="true"></span>
        {{ filterSummary }}
      </div>
      <button
        class="dash-icon-btn"
        type="button"
        aria-label="Refresh dashboard"
        :class="{ spinning: isRefreshing }"
        @click="refreshDashboard"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" />
        </svg>
      </button>
    </div>

    <section class="dash-metrics">
      <article v-for="metric in metricCards" :key="metric.label" class="dash-metric-card">
        <div class="dash-metric-label">
          <span v-html="metric.icon"></span>
          {{ metric.label }}
        </div>
        <div class="dash-metric-value num">{{ metric.value }}</div>
        <div class="dash-metric-delta" :class="metric.deltaClass">{{ metric.delta }}</div>
      </article>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-7">
        <div class="dash-panel-head">
          <h3><span class="dash-live-dot" aria-hidden="true"></span> Real-time traffic</h3>
          <div class="dash-readouts">
            <div>
              <div class="dash-readout-label">REQ/S</div>
              <div class="dash-readout-value signal num">{{ formatRate(latestRequestRate) }}</div>
            </div>
            <div>
              <div class="dash-readout-label">RESP/S</div>
              <div class="dash-readout-value l4 num">{{ formatRate(latestResponseRate) }}</div>
            </div>
          </div>
        </div>
        <div class="dash-chart-wrap dash-chart-wrap--tall">
          <div ref="requestResponseChart"></div>
        </div>
      </div>

      <div class="dash-panel c-5">
        <div class="dash-panel-head">
          <h3>Event log</h3>
          <span class="dash-count-tag">live</span>
        </div>
        <div class="dash-log">
          <div v-if="!securityEvents.length" class="dash-log-line">
            <span class="dash-log-time">—</span>
            <span class="dash-log-tag sys">SYS</span>
            <span class="dash-log-msg">No security events recorded yet.</span>
          </div>
          <div v-for="event in securityEvents" :key="event.id" class="dash-log-line">
            <span class="dash-log-time">{{ formatLogTime(event.createdAt) }}</span>
            <span class="dash-log-tag" :class="eventLogTagClass(event)">{{ eventLogTag(event) }}</span>
            <span class="dash-log-msg">{{ event.title }} — {{ event.description }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-4">
        <div class="dash-panel-head">
          <h3>Response code breakdown</h3>
          <span class="dash-count-tag">{{ bandwidthRangeLabel }}</span>
        </div>
        <div v-for="row in statusBreakdown" :key="row.label" class="dash-bar-row">
          <div class="dash-bar-top">
            <span>{{ row.label }}</span>
            <span class="num pct">{{ row.percent }}%</span>
          </div>
          <div class="dash-bar-track">
            <div class="dash-bar-fill" :class="row.tone" :style="{ width: `${row.percent}%` }"></div>
          </div>
        </div>
      </div>

      <div class="dash-panel c-4">
        <div class="dash-panel-head">
          <h3>Threat summary</h3>
          <span class="dash-count-tag">monthly</span>
        </div>
        <div class="dash-bar-row">
          <div class="dash-bar-top"><span>L4 attacks (this month)</span><span class="count num">{{ formatNumber(dashboardStats.l4AttacksThisMonth) }}</span></div>
          <div class="dash-bar-track"><div class="dash-bar-fill l4" :style="{ width: l4BarWidth }"></div></div>
        </div>
        <div class="dash-bar-row">
          <div class="dash-bar-top"><span>L4 attacks (prev month)</span><span class="count num">{{ formatNumber(dashboardStats.l4AttacksPreviousMonth) }}</span></div>
          <div class="dash-bar-track"><div class="dash-bar-fill l4" :style="{ width: l4PrevBarWidth }"></div></div>
        </div>
        <div class="dash-bar-row">
          <div class="dash-bar-top"><span>L7 threats (this month)</span><span class="count num">{{ formatNumber(dashboardStats.l7ThreatsThisMonth) }}</span></div>
          <div class="dash-bar-track"><div class="dash-bar-fill l7" :style="{ width: l7BarWidth }"></div></div>
        </div>
        <div class="dash-bar-row">
          <div class="dash-bar-top"><span>L7 threats (prev month)</span><span class="count num">{{ formatNumber(dashboardStats.l7ThreatsPreviousMonth) }}</span></div>
          <div class="dash-bar-track"><div class="dash-bar-fill l7" :style="{ width: l7PrevBarWidth }"></div></div>
        </div>
      </div>

      <div class="dash-panel c-4">
        <div class="dash-panel-head">
          <h3>Fleet capacity</h3>
          <span class="dash-count-tag">edges</span>
        </div>
        <div class="dash-stat-trio">
          <div class="dash-stat-box">
            <div class="l">TOTAL EDGES</div>
            <div class="v num">{{ formatNumber(dashboardStats.totalServers) }}</div>
          </div>
          <div class="dash-stat-box">
            <div class="l">ACTIVE</div>
            <div class="v num signal">{{ formatNumber(dashboardStats.activeServers) }}</div>
          </div>
          <div class="dash-stat-box">
            <div class="l">USERS</div>
            <div class="v num">{{ formatNumber(dashboardStats.totalUsers) }}</div>
          </div>
        </div>
        <div class="dash-bar-row">
          <div class="dash-bar-top"><span>Blocked IPs</span><span class="count num">{{ formatNumber(dashboardStats.blockedIps) }}</span></div>
          <div class="dash-bar-track"><div class="dash-bar-fill danger" :style="{ width: blockedBarWidth }"></div></div>
        </div>
      </div>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-4">
        <div class="dash-panel-head">
          <h3>Top user agents</h3>
          <span class="dash-count-tag">{{ bandwidthRangeLabel }}</span>
        </div>
        <p v-if="!topUserAgentRows.length" class="dash-empty">No user agent data yet.</p>
        <div v-for="row in topUserAgentRows" :key="`ua-${row.label}`" class="dash-bar-row">
          <div class="dash-bar-top">
            <span class="dash-rank-label" :title="row.label">{{ row.label }}</span>
            <span class="num pct">{{ row.percent }}%</span>
          </div>
          <div class="dash-bar-track">
            <div class="dash-bar-fill l4" :style="{ width: `${row.percent}%` }"></div>
          </div>
        </div>
      </div>

      <div class="dash-panel c-4">
        <div class="dash-panel-head">
          <h3>Top referrers</h3>
          <span class="dash-count-tag">{{ bandwidthRangeLabel }}</span>
        </div>
        <p v-if="!topRefererRows.length" class="dash-empty">No referrer data yet.</p>
        <div v-for="row in topRefererRows" :key="`ref-${row.label}`" class="dash-bar-row">
          <div class="dash-bar-top">
            <span class="dash-rank-label" :title="row.label">{{ row.label }}</span>
            <span class="num pct">{{ row.percent }}%</span>
          </div>
          <div class="dash-bar-track">
            <div class="dash-bar-fill l7" :style="{ width: `${row.percent}%` }"></div>
          </div>
        </div>
      </div>

      <div class="dash-panel c-4">
        <div class="dash-panel-head">
          <h3>Top sites</h3>
          <span class="dash-count-tag">{{ bandwidthRangeLabel }}</span>
        </div>
        <p v-if="!topSiteRows.length" class="dash-empty">No site traffic recorded yet.</p>
        <div v-for="row in topSiteRows" :key="`site-${row.label}`" class="dash-bar-row">
          <div class="dash-bar-top">
            <span class="dash-rank-label" :title="row.label">{{ row.label }}</span>
            <span class="num pct">{{ row.percent }}%</span>
          </div>
          <div class="dash-bar-track">
            <div class="dash-bar-fill ok" :style="{ width: `${row.percent}%` }"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <h3>Bandwidth</h3>
          <span class="dash-count-tag">NIC in / out · {{ bandwidthRangeLabel }}</span>
        </div>
        <div class="dash-chart-wrap">
          <div ref="bandwidthCombinedChart"></div>
        </div>
        <div class="dash-legend">
          <button
            v-for="server in serversForCharts"
            :key="server.id"
            type="button"
            class="dash-legend-item"
            :class="{ 'dash-legend-item--hidden': hiddenServers.has(server.id) }"
            @click="toggleServerSeries(server)"
          >
            <span class="dash-legend-swatch" :style="{ background: server.color }"></span>
            <span>{{ server.label }}</span>
          </button>
        </div>
      </div>

      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <h3>Status codes over time</h3>
          <span class="dash-count-tag">{{ bandwidthRangeLabel }}</span>
        </div>
        <div class="dash-chart-wrap">
          <div ref="statusCodeChart"></div>
        </div>
      </div>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-5">
        <div class="dash-panel-head">
          <h3>Edge node health</h3>
          <span class="dash-count-tag">{{ serversList.length }} nodes</span>
        </div>
        <div class="dash-table-wrap">
          <table class="dash-table">
            <thead>
              <tr>
                <th>Node</th>
                <th>IP</th>
                <th class="mono">CPU</th>
                <th class="mono">L4</th>
                <th class="mono">L7</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="server in serversList.slice(0, 8)" :key="server.id">
                <td>
                  <span class="node-dot" :class="edgeDotClass(server)"></span>
                  <span class="ip-mono">{{ server.name || `Edge ${server.id}` }}</span>
                </td>
                <td class="mono">{{ server.ip || '—' }}</td>
                <td>
                  <div class="dash-cpu-cell">
                    <span class="dash-cpu-value num" :class="cpuLevelClass(server)">{{ formatCpuDisplay(server) }}</span>
                    <div v-if="hasCpuMetric(server)" class="dash-cpu-bar" aria-hidden="true">
                      <div
                        class="dash-cpu-bar-fill"
                        :class="cpuLevelClass(server)"
                        :style="{ width: cpuBarWidth(server) }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    class="dash-layer-cell"
                    :title="layerDotDescription(server, 'l4')"
                    :aria-label="layerDotDescription(server, 'l4')"
                  >
                    <span :class="layerDotClass(server, 'l4')"></span>
                  </span>
                </td>
                <td>
                  <span
                    class="dash-layer-cell"
                    :title="layerDotDescription(server, 'l7')"
                    :aria-label="layerDotDescription(server, 'l7')"
                  >
                    <span :class="layerDotClass(server, 'l7')"></span>
                  </span>
                </td>
                <td>
                  <span class="dash-health-pill" :class="edgeHealthClass(server)">{{ edgeHealthLabel(server) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!serversList.length" class="dash-empty">No edges configured yet.</p>
        </div>
      </div>

      <div class="dash-panel c-7 dash-panel--throughput">
        <div class="dash-panel-head">
          <h3>NIC throughput by edge</h3>
          <span class="dash-count-tag">live · Kbps</span>
        </div>
        <div class="dash-mini-charts dash-mini-charts--large">
          <div class="dash-mini-chart">
            <h4>NIC RX</h4>
            <div class="dash-chart-wrap dash-chart-wrap--md"><div ref="bandwidthNicRxChart"></div></div>
          </div>
          <div class="dash-mini-chart">
            <h4>NIC TX</h4>
            <div class="dash-chart-wrap dash-chart-wrap--md"><div ref="bandwidthNicTxChart"></div></div>
          </div>
          <div class="dash-mini-chart">
            <h4>L7 RX</h4>
            <div class="dash-chart-wrap dash-chart-wrap--md"><div ref="bandwidthL7RxChart"></div></div>
          </div>
          <div class="dash-mini-chart">
            <h4>L7 TX</h4>
            <div class="dash-chart-wrap dash-chart-wrap--md"><div ref="bandwidthL7TxChart"></div></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ApexCharts from 'apexcharts'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import {
  fetchBandwidthL7RxSeries,
  fetchBandwidthL7TxSeries,
  fetchBandwidthNicRxSeries,
  fetchBandwidthNicTxSeries,
  fetchDashboardSummary,
  fetchDashboardTopDomains,
  fetchRequestResponseSeries,
  fetchSecurityEvents,
  fetchStatusCodeSeries,
} from '@/api/dashboard'
import { fetchSecuritySummaryGroup } from '@/api/securityAnalytics'
import { fetchSites } from '@/api/sites'
import { fetchServers, fetchServerHostMetrics } from '@/api/servers'
import {
  getApexAxisLabelStyle,
  getApexBaseChartOptions,
  getApexThemePatch,
} from '@/utils/chartTheme'
import {
  layerDotClass,
  layerDotDescription,
  resolveAngelosRuntimeStatus,
} from '@/utils/serverLayerStatus'

const CONSOLE_COLORS = {
  accent: '#A855F7',
  l4: '#5B9DF0',
  l7: '#C084FC',
  danger: '#F0555A',
  warn: '#F0AC3F',
}

const dashboardRoot = ref(null)
const bandwidthNicRxChart = ref(null)
const bandwidthNicTxChart = ref(null)
const bandwidthL7RxChart = ref(null)
const bandwidthL7TxChart = ref(null)
const bandwidthCombinedChart = ref(null)
const requestResponseChart = ref(null)
const statusCodeChart = ref(null)

const securityEvents = ref([])
const serversList = ref([])
const edgeMetrics = ref({})
const topUserAgentsRaw = ref([])
const topReferersRaw = ref([])
const topDomainRows = ref([])
const isRefreshing = ref(false)
const updatedAt = ref(new Date())
const selectedEdge = ref('all')
const selectedSite = ref('all')
const sitesList = ref([])

const dashboardStats = ref({
  totalUsers: 0,
  totalServers: 0,
  activeServers: 0,
  totalSites: 0,
  activeSites: 0,
  blockedIps: 0,
  l4AttacksThisMonth: 0,
  l4AttacksPreviousMonth: 0,
  l7ThreatsThisMonth: 0,
  l7ThreatsPreviousMonth: 0,
})

const palette = [CONSOLE_COLORS.accent, CONSOLE_COLORS.l4, CONSOLE_COLORS.l7, CONSOLE_COLORS.danger, CONSOLE_COLORS.warn, '#22c55e', '#38bdf8']
const bandwidthServers = ref([])
const bandwidthRefreshMs = 60 * 1000
const trafficRefreshMs = 60 * 1000

let nicRxChartInstance = null
let nicTxChartInstance = null
let l7RxChartInstance = null
let l7TxChartInstance = null
let combinedChartInstance = null
let requestResponseChartInstance = null
let statusCodeChartInstance = null
let bandwidthTimer = null
let trafficTimer = null
let layoutResizeObserver = null

const rangePillOptions = [
  { label: '1H', value: '1h' },
  { label: '2H', value: '2h' },
  { label: '4H', value: '4h' },
  { label: '12H', value: '12h' },
  { label: '1D', value: '1d' },
  { label: '2D', value: '2d' },
  { label: '7D', value: '7d' },
  { label: '1M', value: '1m' },
]

const bandwidthRange = ref('1d')
const requestRange = ref('1d')
const statusRange = ref('1d')

const bandwidthRangeLabel = computed(() =>
  rangePillOptions.find((o) => o.value === bandwidthRange.value)?.label || bandwidthRange.value,
)

const serverOptions = computed(() => [
  { label: 'All edges', value: 'all' },
  ...bandwidthServers.value.map((server) => ({ label: server.label, value: String(server.id) })),
])

const siteOptions = computed(() => [
  { label: 'All sites', value: 'all' },
  ...sitesList.value.map((site) => ({
    label: site.domain || `Site ${site.id}`,
    value: String(site.id),
  })),
])

const selectedSiteRecord = computed(() => {
  if (selectedSite.value === 'all') return null
  return sitesList.value.find((site) => String(site.id) === selectedSite.value) || null
})

const siteServerIdSet = computed(() => {
  const site = selectedSiteRecord.value
  if (!site || !Array.isArray(site.serverIds) || !site.serverIds.length) return null
  return new Set(site.serverIds.map((id) => Number(id)))
})

const serversForCharts = computed(() => {
  const allowed = siteServerIdSet.value
  if (!allowed) return bandwidthServers.value
  return bandwidthServers.value.filter((server) => allowed.has(server.id))
})

const updatedAtLabel = computed(() => {
  const diff = Date.now() - updatedAt.value.getTime()
  if (diff < 60_000) return 'just now'
  return updatedAt.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

const fleetSubtitle = computed(() => {
  const total = dashboardStats.value.totalServers
  const active = dashboardStats.value.activeServers
  return `${total} edge nodes · ${active} active · last updated ${updatedAtLabel.value}`
})

const filterSummary = computed(() => {
  const edge = selectedEdge.value === 'all'
    ? 'all edges'
    : serverOptions.value.find((o) => o.value === selectedEdge.value)?.label || 'edge'
  const site = selectedSite.value === 'all'
    ? 'all sites'
    : siteOptions.value.find((o) => o.value === selectedSite.value)?.label || 'site'
  const range = rangePillOptions.find((o) => o.value === bandwidthRange.value)?.label
    || bandwidthRange.value
  return `${edge} · ${site} · last ${range}`
})

const metricIcon = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

const metricCards = computed(() => [
  {
    label: 'Total users',
    value: formatNumber(dashboardStats.value.totalUsers),
    delta: 'Panel operators',
    deltaClass: 'flat',
    icon: metricIcon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>'),
  },
  {
    label: 'Total edges',
    value: formatNumber(dashboardStats.value.totalServers),
    delta: `${formatNumber(dashboardStats.value.activeServers)} active`,
    deltaClass: 'up',
    icon: metricIcon('<rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/>'),
  },
  {
    label: 'Total sites',
    value: formatNumber(dashboardStats.value.totalSites),
    delta: `${formatNumber(dashboardStats.value.activeSites)} active`,
    deltaClass: 'up',
    icon: metricIcon('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  },
  {
    label: 'Blocked IPs',
    value: formatNumber(dashboardStats.value.blockedIps),
    delta: 'active rules',
    deltaClass: 'warn',
    icon: metricIcon('<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  },
  {
    label: 'L4 attacks',
    value: formatNumber(dashboardStats.value.l4AttacksThisMonth),
    delta: `prev ${formatNumber(dashboardStats.value.l4AttacksPreviousMonth)}`,
    deltaClass: 'warn',
    icon: metricIcon('<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4z"/>'),
  },
  {
    label: 'L7 threats',
    value: formatNumber(dashboardStats.value.l7ThreatsThisMonth),
    delta: `prev ${formatNumber(dashboardStats.value.l7ThreatsPreviousMonth)}`,
    deltaClass: 'warn',
    icon: metricIcon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  },
])

const barPercent = (value, max) => {
  const v = Number(value) || 0
  const m = Math.max(Number(max) || 0, v, 1)
  return `${Math.min(100, Math.round((v / m) * 100))}%`
}

const l4BarWidth = computed(() =>
  barPercent(dashboardStats.value.l4AttacksThisMonth, Math.max(dashboardStats.value.l4AttacksThisMonth, dashboardStats.value.l4AttacksPreviousMonth)),
)
const l4PrevBarWidth = computed(() =>
  barPercent(dashboardStats.value.l4AttacksPreviousMonth, Math.max(dashboardStats.value.l4AttacksThisMonth, dashboardStats.value.l4AttacksPreviousMonth)),
)
const l7BarWidth = computed(() =>
  barPercent(dashboardStats.value.l7ThreatsThisMonth, Math.max(dashboardStats.value.l7ThreatsThisMonth, dashboardStats.value.l7ThreatsPreviousMonth)),
)
const l7PrevBarWidth = computed(() =>
  barPercent(dashboardStats.value.l7ThreatsPreviousMonth, Math.max(dashboardStats.value.l7ThreatsThisMonth, dashboardStats.value.l7ThreatsPreviousMonth)),
)
const blockedBarWidth = computed(() => barPercent(dashboardStats.value.blockedIps, Math.max(dashboardStats.value.blockedIps, 1000)))

const bandwidthNicRxSeries = ref([])
const bandwidthNicTxSeries = ref([])
const bandwidthL7RxSeries = ref([])
const bandwidthL7TxSeries = ref([])
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

const latestRequestRate = computed(() => {
  const data = requestResponseSeries.value[0]?.data || []
  return data[data.length - 1]?.y ?? 0
})

const latestResponseRate = computed(() => {
  const data = requestResponseSeries.value[1]?.data || []
  return data[data.length - 1]?.y ?? 0
})

const sumSeriesPoints = (seriesList) => {
  const map = new Map()
  seriesList.forEach((series) => {
    ;(series.data || []).forEach((point) => {
      map.set(point.x, (map.get(point.x) || 0) + point.y)
    })
  })
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([x, y]) => ({ x, y }))
}

const combinedBandwidthSeries = computed(() => [
  { name: 'Out (NIC TX)', data: sumSeriesPoints(bandwidthNicTxSeries.value) },
  { name: 'In (NIC RX)', data: sumSeriesPoints(bandwidthNicRxSeries.value) },
])

const statusBreakdown = computed(() => {
  const totals = { '2xx success': 0, '3xx redirect': 0, '4xx client error': 0, '5xx server error': 0 }
  const keys = ['2xx success', '3xx redirect', '4xx client error', '5xx server error']
  const seriesKeys = ['2xx', '3xx', '4xx', '5xx']
  seriesKeys.forEach((name, index) => {
    const data = statusCodeSeries.value.find((s) => s.name === name)?.data || []
    totals[keys[index]] = data.reduce((sum, p) => sum + (Number(p.y) || 0), 0)
  })
  const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1
  const tones = ['ok', 'info', 'warn2', 'danger2']
  return keys.map((label, index) => ({
    label,
    percent: Math.round((totals[label] / grand) * 1000) / 10,
    tone: tones[index],
  }))
})

const buildTrafficParams = () => ({
  range: bandwidthRange.value,
  serverId: selectedEdge.value,
  siteId: selectedSite.value,
})

const simplifyUserAgent = (agent) => {
  const raw = String(agent || '').trim()
  if (!raw || raw === '-' || raw.toLowerCase() === 'unknown') return 'Unknown'
  const value = raw.toLowerCase()
  if (value.includes('googlebot')) return 'Googlebot'
  if (value.includes('bingbot')) return 'Bingbot'
  if (value.includes('edg/')) return 'Edge'
  if (value.includes('chrome/') || value.includes('crios/')) return 'Chrome'
  if (value.includes('firefox/')) return 'Firefox'
  if (value.includes('safari/') && !value.includes('chrome')) return 'Safari'
  if (value.includes('curl/')) return 'curl'
  if (raw.length > 28) return `${raw.slice(0, 28)}…`
  return raw
}

const formatRefererLabel = (referer) => {
  const raw = String(referer || '').trim()
  if (!raw || raw === '-' || raw.toLowerCase() === 'direct') return 'Direct / none'
  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`)
    return url.hostname.replace(/^www\./, '') || raw
  } catch {
    return raw.length > 32 ? `${raw.slice(0, 32)}…` : raw
  }
}

const toRankRows = (items, labelFn) => {
  const list = (Array.isArray(items) ? items : []).slice(0, 6)
  const total = list.reduce((sum, row) => sum + (Number(row.count) || 0), 0) || 1
  return list.map((row) => ({
    label: labelFn(row),
    count: Number(row.count) || 0,
    percent: Math.round(((Number(row.count) || 0) / total) * 100),
  }))
}

const topUserAgentRows = computed(() =>
  toRankRows(topUserAgentsRaw.value, (row) => simplifyUserAgent(row.agent)),
)

const topRefererRows = computed(() =>
  toRankRows(topReferersRaw.value, (row) => formatRefererLabel(row.referer)),
)

const topSiteRows = computed(() =>
  toRankRows(topDomainRows.value, (row) => row.domain || 'Unknown'),
)

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
}

const formatRate = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(Math.round(n))
}

const formatBandwidthValue = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 Kbps'
  if (numeric >= 1024 * 1024) return `${(numeric / (1024 * 1024)).toFixed(1)} Gbps`
  if (numeric >= 1024) return `${(numeric / 1024).toFixed(1)} Mbps`
  return `${Math.round(numeric)} Kbps`
}

const formatLogTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const eventLogTag = (event) => {
  const title = String(event?.title || '').toLowerCase()
  if (title.includes('l4') || title.includes('ddos')) return 'L4'
  if (title.includes('waf') || title.includes('l7')) return 'L7'
  return 'SYS'
}

const eventLogTagClass = (event) => {
  const tag = eventLogTag(event).toLowerCase()
  if (tag === 'l4') return 'l4'
  if (tag === 'l7') return 'l7'
  return 'sys'
}

const edgeDotClass = (server) => edgeHealthClass(server)

const edgeHealthClass = (server) => {
  const runtime = resolveAngelosRuntimeStatus(server)
  const cpu = edgeMetrics.value[server?.id]?.cpuPercent

  if (runtime === 'stopped') return 'danger'
  if (runtime === 'unknown' || runtime === 'deployed') return 'warn'
  if (cpu != null && cpu >= 90) return 'danger'
  if (cpu != null && cpu >= 70) return 'warn'
  if (runtime === 'running') return 'ok'
  return 'warn'
}

const edgeHealthLabel = (server) => {
  const runtime = resolveAngelosRuntimeStatus(server)
  const cpu = edgeMetrics.value[server?.id]?.cpuPercent

  if (runtime === 'stopped') return 'offline'
  if (runtime === 'unknown') return 'unknown'
  if (runtime === 'deployed') return 'deployed'
  if (cpu != null && cpu >= 90) return 'critical'
  if (cpu != null && cpu >= 70) return 'under load'
  if (runtime === 'running') return 'healthy'
  return 'unknown'
}

const formatCpuDisplay = (server) => {
  const metric = edgeMetrics.value[server?.id]
  if (!metric) return '—'
  if (metric.loading) return '…'
  if (metric.cpuPercent == null) return '—'
  return `${Math.round(metric.cpuPercent)}%`
}

const hasCpuMetric = (server) => {
  const metric = edgeMetrics.value[server?.id]
  return metric != null && !metric.loading && metric.cpuPercent != null
}

const cpuLevelClass = (server) => {
  const cpu = edgeMetrics.value[server?.id]?.cpuPercent
  if (cpu == null) return 'flat'
  if (cpu >= 90) return 'danger'
  if (cpu >= 70) return 'warn'
  return 'ok'
}

const cpuBarWidth = (server) => {
  const cpu = edgeMetrics.value[server?.id]?.cpuPercent
  if (cpu == null) return '0%'
  return `${Math.min(100, Math.max(0, Math.round(cpu)))}%`
}

const loadEdgeMetrics = async (servers) => {
  const list = Array.isArray(servers) ? servers.slice(0, 8) : []
  if (!list.length) {
    edgeMetrics.value = {}
    return
  }

  const next = { ...edgeMetrics.value }
  list.forEach((server) => {
    next[server.id] = { ...(next[server.id] || {}), loading: true }
  })
  edgeMetrics.value = next

  await Promise.all(
    list.map(async (server) => {
      try {
        const payload = await fetchServerHostMetrics(server.id)
        edgeMetrics.value = {
          ...edgeMetrics.value,
          [server.id]: {
            loading: false,
            cpuPercent: Number(payload?.cpuPercent),
          },
        }
      } catch {
        edgeMetrics.value = {
          ...edgeMetrics.value,
          [server.id]: { loading: false, cpuPercent: null },
        }
      }
    }),
  )
}

const setRange = (value) => {
  bandwidthRange.value = value
  requestRange.value = value
  statusRange.value = value
}

const getBandwidthRangeMs = (value) => {
  switch (value) {
    case '1h': return 60 * 60 * 1000
    case '2h': return 2 * 60 * 60 * 1000
    case '4h': return 4 * 60 * 60 * 1000
    case '12h': return 12 * 60 * 60 * 1000
    case '1d': return 24 * 60 * 60 * 1000
    case '2d': return 2 * 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
    case '1m': return 30 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}

const createEmptyBandwidthSeries = () =>
  serversForCharts.value.map((server) => ({ name: server.label, data: [] }))

const mapPayloadToSeries = (payload) => {
  const seriesMap = new Map()
  if (Array.isArray(payload)) {
    payload.forEach((entry) => {
      seriesMap.set(Number(entry?.serverId), Array.isArray(entry?.points) ? entry.points : [])
    })
  }
  return serversForCharts.value.map((server) => {
    const points = seriesMap.get(server.id) || []
    const data = points
      .map((point) => ({ x: new Date(point.timestamp).getTime(), y: Number(point.bandwidth ?? 0) }))
      .filter((point) => !Number.isNaN(point.x))
      .sort((a, b) => a.x - b.x)
    return { name: server.label, data }
  })
}

const loadDashboardSummary = async () => {
  try {
    const payload = await fetchDashboardSummary()
    dashboardStats.value = {
      totalUsers: Number(payload?.totalUsers ?? 0),
      totalServers: Number(payload?.totalServers ?? 0),
      activeServers: Number(payload?.activeServers ?? 0),
      totalSites: Number(payload?.totalSites ?? 0),
      activeSites: Number(payload?.activeSites ?? 0),
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
    const payload = await fetchSecurityEvents(12)
    securityEvents.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    securityEvents.value = []
  }
}

const loadSites = async () => {
  try {
    const payload = await fetchSites()
    sitesList.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    sitesList.value = []
  }
}

const loadBandwidthServers = async () => {
  try {
    const payload = await fetchServers()
    const list = Array.isArray(payload) ? payload : []
    serversList.value = list
    bandwidthServers.value = list.map((server, index) => ({
      id: server.id,
      label: server.name || `Edge ${server.id}`,
      color: palette[index % palette.length],
    }))
    bandwidthNicRxSeries.value = createEmptyBandwidthSeries()
    bandwidthNicTxSeries.value = createEmptyBandwidthSeries()
    bandwidthL7RxSeries.value = createEmptyBandwidthSeries()
    bandwidthL7TxSeries.value = createEmptyBandwidthSeries()
    hiddenServers.value = new Set()
    destroyBandwidthCharts()
    createBandwidthCharts()
    createCombinedChart()
    void loadEdgeMetrics(list)
  } catch (error) {
    serversList.value = []
    bandwidthServers.value = []
  }
}

const destroyBandwidthCharts = () => {
  ;[nicRxChartInstance, nicTxChartInstance, l7RxChartInstance, l7TxChartInstance, combinedChartInstance].forEach((inst) => {
    if (inst) inst.destroy()
  })
  nicRxChartInstance = null
  nicTxChartInstance = null
  l7RxChartInstance = null
  l7TxChartInstance = null
  combinedChartInstance = null
}

const defaultLineOptions = (height = 280, colors = palette) => {
  const now = Date.now()
  const rangeMs = getBandwidthRangeMs(bandwidthRange.value)
  const base = getApexBaseChartOptions()
  return {
    ...base,
    chart: {
      ...base.chart,
      type: 'line',
      height,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 0 },
    colors,
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        style: getApexAxisLabelStyle('10px'),
        formatter: (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      range: rangeMs,
      min: now - rangeMs,
      max: now,
    },
    yaxis: {
      min: 0,
      labels: { style: getApexAxisLabelStyle('10px') },
    },
    legend: { show: false },
    grid: { strokeDashArray: 0, borderColor: 'rgba(255,255,255,0.05)' },
  }
}

const MINI_BANDWIDTH_CHART_HEIGHT = 240

const createBandwidthCharts = () => {
  if (!bandwidthServers.value.length) return
  const opts = (h) => ({
    ...defaultLineOptions(h),
    colors: bandwidthServers.value.map((s) => s.color),
    yaxis: { ...defaultLineOptions(h).yaxis, labels: { formatter: (v) => formatBandwidthValue(v), style: getApexAxisLabelStyle('10px') } },
    tooltip: { theme: 'dark', y: { formatter: (v) => formatBandwidthValue(v) } },
  })
  if (bandwidthNicRxChart.value) {
    nicRxChartInstance = new ApexCharts(bandwidthNicRxChart.value, { ...opts(MINI_BANDWIDTH_CHART_HEIGHT), series: bandwidthNicRxSeries.value })
    nicRxChartInstance.render()
  }
  if (bandwidthNicTxChart.value) {
    nicTxChartInstance = new ApexCharts(bandwidthNicTxChart.value, { ...opts(MINI_BANDWIDTH_CHART_HEIGHT), series: bandwidthNicTxSeries.value })
    nicTxChartInstance.render()
  }
  if (bandwidthL7RxChart.value) {
    l7RxChartInstance = new ApexCharts(bandwidthL7RxChart.value, { ...opts(MINI_BANDWIDTH_CHART_HEIGHT), series: bandwidthL7RxSeries.value })
    l7RxChartInstance.render()
  }
  if (bandwidthL7TxChart.value) {
    l7TxChartInstance = new ApexCharts(bandwidthL7TxChart.value, { ...opts(MINI_BANDWIDTH_CHART_HEIGHT), series: bandwidthL7TxSeries.value })
    l7TxChartInstance.render()
  }
}

const createCombinedChart = () => {
  if (!bandwidthCombinedChart.value) return
  combinedChartInstance = new ApexCharts(bandwidthCombinedChart.value, {
    ...defaultLineOptions(240, [CONSOLE_COLORS.accent, CONSOLE_COLORS.l4]),
    series: combinedBandwidthSeries.value,
    yaxis: {
      ...defaultLineOptions(240).yaxis,
      labels: { formatter: (v) => formatBandwidthValue(v), style: getApexAxisLabelStyle('10px') },
    },
    tooltip: { theme: 'dark', y: { formatter: (v) => formatBandwidthValue(v) } },
  })
  combinedChartInstance.render()
}

const createRequestResponseChart = () => {
  if (!requestResponseChart.value) return
  requestResponseChartInstance = new ApexCharts(requestResponseChart.value, {
    ...defaultLineOptions(220, [CONSOLE_COLORS.accent, CONSOLE_COLORS.l4]),
    series: requestResponseSeries.value,
    yaxis: {
      ...defaultLineOptions(220).yaxis,
      labels: { formatter: (v) => `${Math.round(v)}`, style: getApexAxisLabelStyle('10px') },
    },
    tooltip: { theme: 'dark', y: { formatter: (v) => `${Math.round(v)} rps` } },
  })
  requestResponseChartInstance.render()
}

const createStatusCodeChart = () => {
  if (!statusCodeChart.value) return
  statusCodeChartInstance = new ApexCharts(statusCodeChart.value, {
    ...defaultLineOptions(240, [CONSOLE_COLORS.accent, CONSOLE_COLORS.l4, CONSOLE_COLORS.warn, CONSOLE_COLORS.danger]),
    series: statusCodeSeries.value,
    tooltip: { theme: 'dark' },
  })
  statusCodeChartInstance.render()
}

const applyHidden = (chartInstance) => {
  if (!chartInstance) return
  hiddenServers.value.forEach((serverId) => {
    const server = bandwidthServers.value.find((item) => item.id === serverId)
    if (server) chartInstance.hideSeries(server.label)
  })
}

const loadBandwidthSeries = async () => {
  if (!bandwidthServers.value.length) return
  try {
    const serverFilter = selectedEdge.value
    const [payloadNicRx, payloadNicTx, payloadL7Rx, payloadL7Tx] = await Promise.all([
      fetchBandwidthNicRxSeries(bandwidthRange.value, serverFilter),
      fetchBandwidthNicTxSeries(bandwidthRange.value, serverFilter),
      fetchBandwidthL7RxSeries(bandwidthRange.value, serverFilter),
      fetchBandwidthL7TxSeries(bandwidthRange.value, serverFilter),
    ])
    bandwidthNicRxSeries.value = mapPayloadToSeries(payloadNicRx)
    bandwidthNicTxSeries.value = mapPayloadToSeries(payloadNicTx)
    bandwidthL7RxSeries.value = mapPayloadToSeries(payloadL7Rx)
    bandwidthL7TxSeries.value = mapPayloadToSeries(payloadL7Tx)

    const rangeOpts = {
      xaxis: {
        range: getBandwidthRangeMs(bandwidthRange.value),
        min: Date.now() - getBandwidthRangeMs(bandwidthRange.value),
        max: Date.now(),
      },
    }

    if (nicRxChartInstance) { nicRxChartInstance.updateSeries(bandwidthNicRxSeries.value, true); nicRxChartInstance.updateOptions(rangeOpts, false, true); applyHidden(nicRxChartInstance) }
    if (nicTxChartInstance) { nicTxChartInstance.updateSeries(bandwidthNicTxSeries.value, true); nicTxChartInstance.updateOptions(rangeOpts, false, true); applyHidden(nicTxChartInstance) }
    if (l7RxChartInstance) { l7RxChartInstance.updateSeries(bandwidthL7RxSeries.value, true); l7RxChartInstance.updateOptions(rangeOpts, false, true); applyHidden(l7RxChartInstance) }
    if (l7TxChartInstance) { l7TxChartInstance.updateSeries(bandwidthL7TxSeries.value, true); l7TxChartInstance.updateOptions(rangeOpts, false, true); applyHidden(l7TxChartInstance) }
    if (combinedChartInstance) { combinedChartInstance.updateSeries(combinedBandwidthSeries.value, true); combinedChartInstance.updateOptions(rangeOpts, false, true) }
  } catch (error) {
    console.error('Failed to load bandwidth series', error)
  }
}

const loadRequestResponseSeries = async () => {
  try {
    const payload = await fetchRequestResponseSeries(requestRange.value, selectedEdge.value)
    const points = Array.isArray(payload) ? payload : []
    requestResponseSeries.value = [
      { name: 'Requests', data: points.map((p) => ({ x: new Date(p.timestamp).getTime(), y: Number(p.requestCount ?? 0) })).filter((p) => !Number.isNaN(p.x)) },
      { name: 'Responses', data: points.map((p) => ({ x: new Date(p.timestamp).getTime(), y: Number(p.responseCount ?? 0) })).filter((p) => !Number.isNaN(p.x)) },
    ]
    if (requestResponseChartInstance) {
      requestResponseChartInstance.updateSeries(requestResponseSeries.value, true)
      requestResponseChartInstance.updateOptions({
        xaxis: {
          range: getBandwidthRangeMs(requestRange.value),
          min: Date.now() - getBandwidthRangeMs(requestRange.value),
          max: Date.now(),
        },
      }, false, true)
    }
  } catch (error) {
    requestResponseSeries.value = [{ name: 'Requests', data: [] }, { name: 'Responses', data: [] }]
  }
}

const loadStatusCodeSeries = async () => {
  try {
    const payload = await fetchStatusCodeSeries(statusRange.value, selectedEdge.value)
    const points = Array.isArray(payload) ? payload : []
    statusCodeSeries.value = [
      { name: '2xx', data: points.map((p) => ({ x: new Date(p.timestamp).getTime(), y: Number(p.success ?? 0) })).filter((p) => !Number.isNaN(p.x)) },
      { name: '3xx', data: points.map((p) => ({ x: new Date(p.timestamp).getTime(), y: Number(p.redirect ?? 0) })).filter((p) => !Number.isNaN(p.x)) },
      { name: '4xx', data: points.map((p) => ({ x: new Date(p.timestamp).getTime(), y: Number(p.client ?? 0) })).filter((p) => !Number.isNaN(p.x)) },
      { name: '5xx', data: points.map((p) => ({ x: new Date(p.timestamp).getTime(), y: Number(p.server ?? 0) })).filter((p) => !Number.isNaN(p.x)) },
    ]
    if (statusCodeChartInstance) {
      statusCodeChartInstance.updateSeries(statusCodeSeries.value, true)
      statusCodeChartInstance.updateOptions({
        xaxis: {
          range: getBandwidthRangeMs(statusRange.value),
          min: Date.now() - getBandwidthRangeMs(statusRange.value),
          max: Date.now(),
        },
      }, false, true)
    }
  } catch (error) {
    statusCodeSeries.value = [
      { name: '2xx', data: [] }, { name: '3xx', data: [] }, { name: '4xx', data: [] }, { name: '5xx', data: [] },
    ]
  }
}

const toggleServerSeries = (server) => {
  ;[nicRxChartInstance, nicTxChartInstance, l7RxChartInstance, l7TxChartInstance].forEach((inst) => {
    if (inst) inst.toggleSeries(server.label)
  })
  const next = new Set(hiddenServers.value)
  if (next.has(server.id)) next.delete(server.id)
  else next.add(server.id)
  hiddenServers.value = next
}

const loadTopTrafficPanels = async () => {
  const params = buildTrafficParams()
  try {
    const [topReferers, topUserAgents, topDomains] = await Promise.all([
      fetchSecuritySummaryGroup('top-referers', params),
      fetchSecuritySummaryGroup('top-user-agents', params),
      fetchDashboardTopDomains(params.range, params.serverId, params.siteId),
    ])
    topReferersRaw.value = Array.isArray(topReferers) ? topReferers : []
    topUserAgentsRaw.value = Array.isArray(topUserAgents) ? topUserAgents : []
    topDomainRows.value = Array.isArray(topDomains) ? topDomains : []
  } catch (error) {
    console.error('Failed to load top traffic panels', error)
    topReferersRaw.value = []
    topUserAgentsRaw.value = []
    topDomainRows.value = []
  }
}

const refreshDashboard = async () => {
  isRefreshing.value = true
  await Promise.all([
    loadDashboardSummary(),
    loadSecurityEvents(),
    loadSites(),
    loadBandwidthSeries(),
    loadRequestResponseSeries(),
    loadStatusCodeSeries(),
    loadEdgeMetrics(serversList.value),
    loadTopTrafficPanels(),
  ])
  updatedAt.value = new Date()
  isRefreshing.value = false
}

const refreshChartTheme = () => {
  const patch = getApexThemePatch()
  ;[nicRxChartInstance, nicTxChartInstance, l7RxChartInstance, l7TxChartInstance, combinedChartInstance, requestResponseChartInstance, statusCodeChartInstance].forEach((chart) => {
    if (chart) chart.updateOptions(patch, false, false)
  })
}

onMounted(() => {
  window.addEventListener('cdnproxy-theme-change', refreshChartTheme)
  void refreshDashboard()
  void loadBandwidthServers().then(() => {
    if (bandwidthServers.value.length) {
      loadBandwidthSeries()
      bandwidthTimer = window.setInterval(loadBandwidthSeries, bandwidthRefreshMs)
    }
  })
  createRequestResponseChart()
  createStatusCodeChart()
  trafficTimer = window.setInterval(() => {
    loadRequestResponseSeries()
    loadStatusCodeSeries()
  }, trafficRefreshMs)

  if (typeof window !== 'undefined' && 'ResizeObserver' in window && dashboardRoot.value) {
    layoutResizeObserver = new ResizeObserver(() => {
      ;[nicRxChartInstance, nicTxChartInstance, l7RxChartInstance, l7TxChartInstance, combinedChartInstance, requestResponseChartInstance, statusCodeChartInstance].forEach((c) => c?.resize?.())
    })
    layoutResizeObserver.observe(dashboardRoot.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', refreshChartTheme)
  if (bandwidthTimer) window.clearInterval(bandwidthTimer)
  if (trafficTimer) window.clearInterval(trafficTimer)
  destroyBandwidthCharts()
  if (requestResponseChartInstance) requestResponseChartInstance.destroy()
  if (statusCodeChartInstance) statusCodeChartInstance.destroy()
  if (layoutResizeObserver && dashboardRoot.value) layoutResizeObserver.disconnect()
})

watch(bandwidthRange, () => {
  loadBandwidthSeries()
  loadRequestResponseSeries()
  loadStatusCodeSeries()
  loadTopTrafficPanels()
})

watch(selectedEdge, () => {
  loadBandwidthSeries()
  loadRequestResponseSeries()
  loadStatusCodeSeries()
  loadTopTrafficPanels()
})

watch(selectedSite, () => {
  loadBandwidthSeries()
  loadTopTrafficPanels()
})

watch(combinedBandwidthSeries, (series) => {
  if (combinedChartInstance) combinedChartInstance.updateSeries(series, true)
}, { deep: true })
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1680px;
  margin: 0 auto;
  font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.dash-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.dash-topbar__left h2 {
  margin: 0 0 3px;
  font-size: var(--type-page-title);
  font-weight: 600;
  color: var(--app-heading);
}

.dash-topbar__left p {
  margin: 0;
  font-size: var(--type-page-subtitle);
  color: var(--app-text-muted);
}

.dash-topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.dash-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-accent);
  flex-shrink: 0;
  animation: dash-blink 2s ease-in-out infinite;
}

@keyframes dash-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.dash-filterbar {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
  border-radius: 10px;
  padding: 12px 14px;
}

.dash-filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dash-filter-field label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-label);
  color: var(--app-text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dash-select {
  background: var(--app-input-bg);
  border: 0.5px solid var(--app-border-strong);
  color: var(--app-text);
  font-size: var(--type-caption);
  padding: 7px 10px;
  border-radius: 6px;
  min-width: 170px;
}

.dash-range-pills {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  background: var(--app-bg);
  border: 0.5px solid var(--app-border-strong);
  border-radius: 6px;
  padding: 3px;
}

.dash-range-pill {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-small);
  padding: 5px 8px;
  border-radius: 4px;
  color: var(--app-text-muted);
  border: none;
  background: transparent;
  cursor: pointer;
}

.dash-range-pill.active {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.dash-filter-summary {
  margin-left: auto;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-caption);
  color: var(--app-text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.dash-icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-surface-elevated);
  border: 0.5px solid var(--app-border-strong);
  border-radius: 6px;
  color: var(--app-text-muted);
  cursor: pointer;
}

.dash-icon-btn svg {
  width: 15px;
  height: 15px;
  transition: transform 0.4s;
}

.dash-icon-btn.spinning svg {
  transform: rotate(360deg);
}

.dash-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(176px, 1fr));
  gap: 12px;
}

.dash-metric-card {
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
  border-radius: 10px;
  padding: 14px 16px;
}

.dash-metric-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
  margin-bottom: 8px;
}

.dash-metric-label :deep(svg) {
  width: 13px;
  height: 13px;
}

.dash-metric-value {
  font-size: var(--type-metric-value);
  font-weight: 600;
  color: var(--app-heading);
}

.dash-metric-delta {
  font-size: var(--type-caption);
  margin-top: 5px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  color: var(--app-text-muted);
}

.dash-metric-delta.up { color: var(--app-accent); }
.dash-metric-delta.warn { color: #f0ac3f; }

.dash-grid12 {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.c-4 { grid-column: span 4; }
.c-5 { grid-column: span 5; }
.c-6 { grid-column: span 6; }
.c-7 { grid-column: span 7; }
.c-8 { grid-column: span 8; }
.c-12 { grid-column: span 12; }

.dash-grid12 > .dash-panel {
  min-width: 0;
}

.dash-panel {
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dash-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
  flex-wrap: wrap;
}

.dash-panel-head h3 {
  margin: 0;
  font-size: var(--type-caption);
  font-weight: 500;
  color: var(--app-text-muted);
  display: flex;
  align-items: center;
  gap: 7px;
}

.dash-count-tag {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-small);
  color: var(--app-text-muted);
}

.dash-readouts {
  display: flex;
  gap: 22px;
}

.dash-readout-label {
  font-size: var(--type-label);
  color: var(--app-text-muted);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  letter-spacing: 0.05em;
}

.dash-readout-value {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-metric-value);
  font-weight: 600;
  margin-top: 2px;
}

.dash-readout-value.signal { color: var(--app-accent); }
.dash-readout-value.l4 { color: #5b9df0; }

.dash-chart-wrap {
  position: relative;
  min-height: 200px;
}

.dash-chart-wrap--tall {
  min-height: 220px;
}

.dash-chart-wrap--sm {
  min-height: 140px;
}

.dash-chart-wrap--md {
  min-height: 220px;
}

.dash-panel--throughput .dash-chart-wrap--md {
  min-height: 240px;
}

.dash-chart-wrap :deep(.apexcharts-canvas),
.dash-chart-wrap :deep(.apexcharts-svg) {
  background: transparent !important;
}

.dash-bar-row {
  margin-bottom: 12px;
}

.dash-bar-row:last-child {
  margin-bottom: 0;
}

.dash-bar-top {
  display: flex;
  justify-content: space-between;
  font-size: var(--type-caption);
  margin-bottom: 5px;
  color: var(--app-text-secondary);
}

.dash-bar-top .pct,
.dash-bar-top .count {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  color: var(--app-text-muted);
}

.dash-bar-track {
  height: 6px;
  background: var(--app-border);
  border-radius: 3px;
  overflow: hidden;
}

.dash-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: #5b9df0;
}

.dash-bar-fill.ok { background: var(--app-accent); }
.dash-bar-fill.info { background: #5b9df0; }
.dash-bar-fill.warn2 { background: #f0ac3f; }
.dash-bar-fill.danger2,
.dash-bar-fill.danger { background: #f0555a; }
.dash-bar-fill.l4 { background: #5b9df0; }
.dash-bar-fill.l7 { background: #c084fc; }

.dash-stat-trio {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.dash-stat-box {
  background: var(--app-bg);
  border: 0.5px solid var(--app-border);
  border-radius: 8px;
  padding: 10px 12px;
}

.dash-stat-box .l {
  font-size: var(--type-small);
  color: var(--app-text-muted);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
}

.dash-stat-box .v {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-metric-value);
  font-weight: 600;
  margin-top: 3px;
  color: var(--app-heading);
}

.dash-stat-box .v.signal {
  color: var(--app-accent);
}

.dash-log {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-caption);
  line-height: 1.9;
  max-height: 280px;
  overflow-y: auto;
}

.dash-log-line {
  display: flex;
  gap: 8px;
  color: var(--app-text-muted);
}

.dash-log-time {
  color: var(--app-text-muted);
  flex: none;
  opacity: 0.7;
}

.dash-log-tag {
  flex: none;
  font-weight: 600;
}

.dash-log-tag.l4 { color: #5b9df0; }
.dash-log-tag.l7 { color: #c084fc; }
.dash-log-tag.sys { color: var(--app-accent); }

.dash-table-wrap {
  overflow-x: auto;
}

.dash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--type-caption);
}

.dash-table thead th {
  text-align: left;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-small);
  color: var(--app-text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 500;
  padding: 0 8px 8px 0;
  border-bottom: 0.5px solid var(--app-border);
}

.dash-table tbody td {
  padding: 9px 8px 9px 0;
  border-top: 0.5px solid var(--app-border);
  color: var(--app-text-muted);
}

.dash-table tbody tr:first-child td {
  border-top: none;
}

.dash-table .mono,
.dash-table th.mono {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
}

.ip-mono {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  color: var(--app-text);
}

.node-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}

.node-dot.ok { background: #22c55e; }
.node-dot.warn { background: #f0ac3f; }
.node-dot.danger { background: #f0555a; }

.dash-layer-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
}

.dash-cpu-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 56px;
}

.dash-cpu-value {
  font-size: var(--type-caption);
  line-height: 1.2;
}

.dash-cpu-value.ok { color: var(--app-accent); }
.dash-cpu-value.warn { color: #f0ac3f; }
.dash-cpu-value.danger { color: #f0555a; }
.dash-cpu-value.flat { color: var(--app-text-muted); }

.dash-cpu-bar {
  width: 100%;
  max-width: 72px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.dash-cpu-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.35s ease;
}

.dash-cpu-bar-fill.ok { background: var(--app-accent); }
.dash-cpu-bar-fill.warn { background: #f0ac3f; }
.dash-cpu-bar-fill.danger { background: #f0555a; }

.dash-health-pill {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-small);
  font-weight: 500;
  letter-spacing: 0.02em;
  text-align: center;
  padding: 4px 10px;
  border-radius: var(--badge-radius, 4px);
  display: inline-block;
  white-space: nowrap;
  text-transform: lowercase;
  border: 0.5px solid transparent;
}

.dash-health-pill.ok {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.28);
}

.dash-health-pill.warn {
  background: rgba(240, 172, 63, 0.15);
  color: #f0ac3f;
  border-color: rgba(240, 172, 63, 0.25);
}

.dash-health-pill.danger {
  background: rgba(240, 85, 90, 0.15);
  color: #f0555a;
  border-color: rgba(240, 85, 90, 0.25);
}

.status-pill {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: var(--type-small);
  text-align: center;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  text-transform: lowercase;
}

.status-pill.ok {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.status-pill.warn {
  background: rgba(240, 172, 63, 0.15);
  color: #f0ac3f;
}

.status-pill.danger {
  background: rgba(240, 85, 90, 0.15);
  color: #f0555a;
}

.dash-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.dash-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--badge-radius, 4px);
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-elevated);
  font-size: var(--type-caption);
  color: var(--app-text-muted);
  cursor: pointer;
}

.dash-legend-item--hidden {
  opacity: 0.5;
  text-decoration: line-through;
}

.dash-legend-swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.dash-mini-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dash-mini-charts--large {
  gap: 18px;
}

.dash-panel--throughput {
  padding-bottom: 18px;
}

.dash-mini-chart h4 {
  margin: 0 0 10px;
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-text-muted);
}

.dash-bar-top .pct {
  color: var(--app-text-muted);
}

.dash-rank-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

.dash-table--compact tbody td {
  padding-top: 8px;
  padding-bottom: 8px;
}

.dash-empty {
  margin: 0;
  padding: 16px 0;
  color: var(--app-text-muted);
  font-size: var(--type-caption);
}

@media (max-width: 1300px) {
  .c-4, .c-5, .c-6, .c-7, .c-8, .c-12 {
    grid-column: span 12;
  }
}

@media (max-width: 760px) {
  .dash-filter-summary {
    margin-left: 0;
    width: 100%;
  }

  .dash-mini-charts {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dash-live-dot {
    animation: none;
  }
}
</style>
