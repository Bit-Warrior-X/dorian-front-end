<template>
  <div class="dashboard-view layer4-attack-view" :aria-busy="isLoading">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Layer 4 attack analytics</h2>
        <p>Edge DDoS traffic, protocol mix, and attacking IP activity.</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="layer4-server">Server</label>
        <select id="layer4-server" v-model="selectedServer" class="dash-select" :disabled="isLoading">
          <option v-for="server in serverOptions" :key="server.value" :value="server.value">
            {{ server.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="layer4-site">Site</label>
        <select id="layer4-site" v-model="selectedSite" class="dash-select" :disabled="isLoading">
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
            :disabled="isLoading"
            @click="selectTimeRange(range.value)"
          >
            {{ range.label }}
          </button>
          <button
            type="button"
            class="dash-range-pill dash-range-pill--custom"
            :class="{ active: isCustomRange }"
            :disabled="isLoading"
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
      <button type="button" class="dash-filter-apply" :disabled="isLoading" @click="applyFilters">
        <span v-if="isLoading" class="dash-spinner dash-spinner--btn" aria-hidden="true"></span>
        {{ isLoading ? 'Loading…' : 'Apply' }}
      </button>
    </div>

    <div
      v-if="isLoading"
      class="dash-loading-overlay"
      role="status"
      aria-live="polite"
    >
      <div class="dash-loading-overlay__content">
        <span class="dash-spinner" aria-hidden="true"></span>
        <span class="dash-loading-overlay__label">Loading L4 attack data…</span>
      </div>
    </div>

    <nav class="dash-tabbar" aria-label="Layer 4 analytics sections">
      <button
        v-for="tab in l4Tabs"
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
      <section class="l4-kpi-strip" aria-label="L4 traffic summary">
        <article
          v-for="metric in metricCards"
          :key="metric.label"
          class="l4-kpi"
          :class="`l4-kpi--${metric.tone}`"
        >
          <span class="l4-kpi__label">{{ metric.label }}</span>
          <span class="l4-kpi__value num">{{ metric.value }}</span>
          <span v-if="metric.hint" class="l4-kpi__hint">{{ metric.hint }}</span>
        </article>
      </section>

      <section class="dash-grid12">
        <div class="dash-panel c-12 l4-chart-panel">
          <div class="dash-panel-head">
            <div>
              <h3>Allowed vs blocked traffic</h3>
              <p class="dash-panel-desc">Edge L4 volume over {{ selectedRangeLabel }}</p>
            </div>
            <div class="l4-chart-readouts">
              <div class="l4-chart-readout">
                <span class="l4-chart-readout__swatch l4-chart-readout__swatch--allowed"></span>
                <div>
                  <div class="l4-chart-readout__label">Allowed</div>
                  <div class="l4-chart-readout__value num signal">{{ latestAllowedLabel }}</div>
                </div>
              </div>
              <div class="l4-chart-readout">
                <span class="l4-chart-readout__swatch l4-chart-readout__swatch--blocked"></span>
                <div>
                  <div class="l4-chart-readout__label">Blocked</div>
                  <div class="l4-chart-readout__value num danger">{{ latestBlockedLabel }}</div>
                </div>
              </div>
              <div class="l4-chart-readout">
                <div>
                  <div class="l4-chart-readout__label">Block rate</div>
                  <div class="l4-chart-readout__value num warn">{{ blockRateLabel }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <div ref="trafficChart"></div>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'protocols'" class="analytics-tab-panel">
      <section class="dash-grid12">
        <div class="dash-panel c-12 l4-chart-panel l4-chart-panel--protocols">
          <div class="dash-panel-head">
            <div>
              <h3>IP protocols by time</h3>
              <p class="dash-panel-desc">TCP, UDP, ICMP, GRE, and other protocol volume</p>
            </div>
            <div class="l4-proto-legend" aria-hidden="true">
              <span v-for="item in protocolLegend" :key="item.name" class="l4-proto-legend__item">
                <span class="l4-proto-legend__swatch" :style="{ background: item.color }"></span>
                {{ item.name }}
              </span>
            </div>
          </div>
          <div class="dash-chart-wrap dash-chart-wrap--hero">
            <div ref="protocolChart"></div>
          </div>
        </div>
      </section>
    </div>

    <div v-show="activeTab === 'attacks'" class="analytics-tab-panel">
      <section class="dash-grid12">
        <div class="dash-panel c-6">
          <div class="dash-panel-head">
            <h3>Recent attack attempts</h3>
          </div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source IP</th>
                  <th>Attack type</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in recentAttackRows" :key="`${row.sourceIp}-${row.timestamp}`">
                  <td>{{ formatDateTime(row.timestamp) }}</td>
                  <td class="num">{{ row.sourceIp }}</td>
                  <td>
                    <span :class="['badge', attackBadgeClass(row.attackType)]">{{ row.attackType }}</span>
                  </td>
                </tr>
                <tr v-if="!recentAttackRows.length">
                  <td colspan="3" class="empty-row">No recent attacks</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="dash-panel c-6">
          <div class="dash-panel-head">
            <div>
              <h3>Top attacking IPs</h3>
            </div>
            <div class="table-controls">
              <span>Show</span>
              <select v-model="seenIpLimit" class="dash-select dash-select--sm">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          <div class="table-wrap">
            <table class="ip-table">
              <thead>
                <tr>
                  <th>IP address</th>
                  <th>Seen count</th>
                  <th>Last seen</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in visibleSeenIps" :key="row.ip">
                  <td class="num">{{ row.ip }}</td>
                  <td class="num">{{ formatNumber(row.count) }}</td>
                  <td>{{ formatDateTime(row.lastSeen) }}</td>
                  <td>
                    <button
                      type="button"
                      class="action-btn action-btn--danger"
                      @click="openBlacklistDialog(row.ip)"
                    >
                      Blacklist
                    </button>
                  </td>
                </tr>
                <tr v-if="!visibleSeenIps.length">
                  <td colspan="4" class="empty-row">No attacking IPs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showCustomDialog" class="dialog-overlay" @click.self="showCustomDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Custom time range</h3>
          <button type="button" class="dialog-close" @click="showCustomDialog = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
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

    <div v-if="showBlacklistDialog" class="dialog-overlay" @click.self="closeBlacklistDialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Add to blacklist</h3>
          <button type="button" class="dialog-close" @click="closeBlacklistDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <div class="dialog-form-group">
            <label>Server</label>
            <select v-model="blacklistForm.serverId" class="dialog-input">
              <option value="all">Select server</option>
              <option v-for="server in servers" :key="server.id" :value="server.id">
                {{ server.name || `Server ${server.id}` }}
              </option>
            </select>
          </div>
          <div class="dialog-form-group">
            <label>IP address</label>
            <input v-model="blacklistForm.ip" type="text" class="dialog-input" readonly />
          </div>
          <div class="dialog-form-group">
            <label>Reason</label>
            <input v-model="blacklistForm.reason" type="text" class="dialog-input" placeholder="Reason" />
          </div>
        </div>
        <div class="dialog-footer">
          <button type="button" class="dialog-btn cancel-btn" @click="closeBlacklistDialog">Cancel</button>
          <button type="button" class="dialog-btn apply-btn" @click="submitBlacklist">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import ApexCharts from 'apexcharts'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import { createL4BlacklistEntry } from '@/api/l4'
import { fetchServers } from '@/api/servers'
import { fetchSites } from '@/api/sites'
import { fetchL4Summary, fetchL4Series, fetchL4Attacks } from '@/api/l4Analytics'
import { notifyError, notifySuccess } from '@/utils/notify'
import {
  formatApexTimeTick,
  getApexChartColors,
  getApexDatetimeXaxis,
  getApexFontFamily,
  getApexLinePalette,
  getApexSeriesColors,
  getApexTimeRangeAnnotations,
  padSeriesToTimeRange,
} from '@/utils/chartTheme'

const L4_DDOS_TITLE = 'L4 DDoS Defense'

const chartColors = () => getApexSeriesColors()
const themeChartColors = () => getApexChartColors()

const chartGridColor = () => themeChartColors().grid
const chartLabelColor = () => themeChartColors().label
const chartTooltipTheme = () =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light'

const resolveRangeMs = (filters) => {
  switch (String(filters?.range || '')) {
    case '1h':
      return 60 * 60 * 1000
    case '2h':
      return 2 * 60 * 60 * 1000
    case '4h':
      return 4 * 60 * 60 * 1000
    case '6h':
      return 6 * 60 * 60 * 1000
    case '24h':
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
    return { start, end: now }
  }
  if (filters.range === 'yesterday') {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { start: new Date(end.getTime() - 24 * 60 * 60 * 1000), end }
  }
  const duration = resolveRangeMs(filters)
  return { start: new Date(now.getTime() - duration), end: now }
}

const activeTab = ref('overview')
const l4Tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'protocols', label: 'Protocols' },
  { id: 'attacks', label: 'Attacks' },
]

const selectedServer = ref('all')
const selectedSite = ref('all')
const selectedTimeRange = ref('1h')
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref(null)
const customEndDate = ref(null)
const isLoading = ref(false)
const datePickerConfig = { enableTime: true, dateFormat: 'Y-m-d H:i' }
const appliedFilters = ref({
  server: 'all',
  site: 'all',
  range: '1h',
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
const sites = ref([])
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

const selectTimeRange = (value) => {
  selectedTimeRange.value = value
  isCustomRange.value = false
}

const applyCustomRange = () => {
  if (!customStartDate.value || !customEndDate.value) return
  isCustomRange.value = true
  selectedTimeRange.value = 'custom'
  showCustomDialog.value = false
  applyFilters()
}

const applyFilters = () => {
  appliedFilters.value = {
    server: selectedServer.value,
    site: selectedSite.value,
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

const metricCards = computed(() => {
  const total = Number(l4Summary.value.totalTraffic) || 0
  const allowed = Number(l4Summary.value.allowedTraffic) || 0
  const blocked = Number(l4Summary.value.blockedTraffic) || 0
  const rate = total > 0 ? (blocked / total) * 100 : 0
  return [
    {
      label: 'Total traffic',
      value: formatThroughput(total),
      hint: selectedRangeLabel.value,
      tone: 'total',
    },
    {
      label: 'Allowed',
      value: formatThroughput(allowed),
      hint: 'passed L4 filters',
      tone: 'ok',
    },
    {
      label: 'Blocked',
      value: formatThroughput(blocked),
      hint: 'dropped as attack',
      tone: 'danger',
    },
    {
      label: 'Block rate',
      value: `${rate.toFixed(rate >= 10 ? 0 : 1)}%`,
      hint: 'blocked ÷ total',
      tone: 'warn',
    },
  ]
})

const latestTrafficPoint = computed(() => {
  const points = trafficPoints.value
  if (!Array.isArray(points) || !points.length) return null
  return points[points.length - 1]
})

const latestAllowedLabel = computed(() =>
  formatThroughput(latestTrafficPoint.value?.allowedTraffic ?? l4Summary.value.allowedTraffic),
)

const latestBlockedLabel = computed(() =>
  formatThroughput(latestTrafficPoint.value?.blockedTraffic ?? l4Summary.value.blockedTraffic),
)

const blockRateLabel = computed(() => {
  const total = Number(l4Summary.value.totalTraffic) || 0
  const blocked = Number(l4Summary.value.blockedTraffic) || 0
  if (total <= 0) return '0%'
  const rate = (blocked / total) * 100
  return `${rate.toFixed(rate >= 10 ? 0 : 1)}%`
})

const protocolLegend = computed(() => {
  const colors = getApexLinePalette()
  return ['TCP', 'UDP', 'ICMP', 'GRE', 'OTHER'].map((name, index) => ({
    name,
    color: colors[index % colors.length],
  }))
})

const openBlacklistDialog = (ip) => {
  blacklistForm.value = {
    ip,
    reason: '',
    serverId: selectedServer.value !== 'all' ? selectedServer.value : 'all',
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
    notifyError(L4_DDOS_TITLE, 'Please select an edge first.')
    return
  }

  const ipAddress = String(blacklistForm.value.ip || '').trim()
  if (!ipAddress) {
    notifyError(L4_DDOS_TITLE, 'The IP address is missing.')
    return
  }

  const reason = blacklistForm.value.reason.trim() || 'Manual block'

  try {
    await createL4BlacklistEntry(serverId, { ipAddress, reason })
    notifySuccess(L4_DDOS_TITLE, 'The IP address is successfully added to the L4 DDoS blacklist.')
    closeBlacklistDialog()
  } catch (error) {
    notifyError(
      L4_DDOS_TITLE,
      error?.message || 'The IP address could not be added to the L4 DDoS blacklist.',
    )
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

const mapSeriesPoints = (points, field) =>
  (Array.isArray(points) ? points : [])
    .map((point) => ({
      x: new Date(point.timestamp).getTime(),
      y: Number(point[field] ?? 0),
    }))
    .filter((point) => !Number.isNaN(point.x))

const buildL4Params = () => {
  const filters = appliedFilters.value
  const params = { serverId: filters.server, siteId: filters.site }
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

const loadSites = async () => {
  try {
    const list = await fetchSites()
    sites.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Failed to load sites', error)
    sites.value = []
  }
}

const loadL4Analytics = async () => {
  if (isLoading.value) return
  isLoading.value = true
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

    nextTick(() => renderChartsForTab(activeTab.value))
  } catch (error) {
    console.error('Failed to load l4 analytics', error)
  } finally {
    isLoading.value = false
  }
}

const renderTrafficChart = () => {
  if (!trafficChart.value) return

  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const startMs = start.getTime()
  const endMs = end.getTime()
  const colors = chartColors()
  const series = padSeriesToTimeRange(
    [
      { name: 'Allowed', data: mapSeriesPoints(trafficPoints.value, 'allowedTraffic') },
      { name: 'Blocked', data: mapSeriesPoints(trafficPoints.value, 'blockedTraffic') },
    ],
    startMs,
    endMs,
  )

  const options = {
    chart: {
      type: 'area',
      height: 400,
      stacked: false,
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 550,
        animateGradually: { enabled: true, delay: 80 },
      },
      background: 'transparent',
      foreColor: chartLabelColor(),
      fontFamily: getApexFontFamily(),
      zoom: { enabled: false },
      selection: { enabled: false },
      pan: { enabled: false },
      dropShadow: {
        enabled: true,
        top: 6,
        left: 0,
        blur: 8,
        opacity: 0.12,
        color: colors.danger,
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: [2.25, 2.5],
      lineCap: 'round',
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.35,
        opacityFrom: 0.38,
        opacityTo: 0.04,
        stops: [0, 70, 100],
      },
    },
    colors: [colors.viper, colors.danger],
    xaxis: {
      ...getApexDatetimeXaxis(startMs, endMs, { tickCount: 8 }),
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: {
        show: true,
        stroke: {
          color: themeChartColors().crosshair,
          width: 1,
          dashArray: 4,
        },
      },
      tooltip: { enabled: false },
    },
    annotations: getApexTimeRangeAnnotations(startMs, endMs),
    yaxis: {
      labels: {
        style: { colors: chartLabelColor(), fontSize: '11px' },
        formatter: (val) => formatThroughput(val),
      },
      min: 0,
      forceNiceScale: true,
    },
    grid: {
      borderColor: chartGridColor(),
      strokeDashArray: 3,
      padding: { left: 8, right: 16, top: 0, bottom: 0 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      theme: chartTooltipTheme(),
      shared: true,
      intersect: false,
      x: { formatter: (val) => formatApexTimeTick(val, startMs, endMs) },
      y: { formatter: (val) => formatThroughput(val) },
      style: { fontSize: '12px' },
    },
    legend: { show: false },
    markers: {
      size: 0,
      hover: { size: 5, sizeOffset: 2 },
      strokeWidth: 2,
      strokeColors: 'var(--app-surface, #0f1714)',
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

const renderProtocolChart = () => {
  if (!protocolChart.value) return

  const { start, end } = resolveRangeWindow(appliedFilters.value)
  const startMs = start.getTime()
  const endMs = end.getTime()
  const palette = getApexLinePalette()
  const series = padSeriesToTimeRange(
    [
      { name: 'TCP', data: mapSeriesPoints(protocolPoints.value, 'tcp') },
      { name: 'UDP', data: mapSeriesPoints(protocolPoints.value, 'udp') },
      { name: 'ICMP', data: mapSeriesPoints(protocolPoints.value, 'icmp') },
      { name: 'GRE', data: mapSeriesPoints(protocolPoints.value, 'gre') },
      { name: 'OTHER', data: mapSeriesPoints(protocolPoints.value, 'other') },
    ],
    startMs,
    endMs,
  )

  const options = {
    chart: {
      type: 'area',
      height: 400,
      stacked: true,
      stackType: 'normal',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 500,
      },
      background: 'transparent',
      foreColor: chartLabelColor(),
      fontFamily: getApexFontFamily(),
      zoom: { enabled: false },
      selection: { enabled: false },
      pan: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 1.75,
      lineCap: 'round',
    },
    fill: {
      type: 'solid',
      opacity: 0.55,
    },
    colors: palette.slice(0, 5),
    xaxis: {
      ...getApexDatetimeXaxis(startMs, endMs, { tickCount: 8 }),
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: {
        show: true,
        stroke: {
          color: themeChartColors().crosshair,
          width: 1,
          dashArray: 4,
        },
      },
      tooltip: { enabled: false },
    },
    annotations: getApexTimeRangeAnnotations(startMs, endMs),
    yaxis: {
      labels: {
        style: { colors: chartLabelColor(), fontSize: '11px' },
        formatter: (val) => formatThroughput(val),
      },
      min: 0,
      forceNiceScale: true,
    },
    grid: {
      borderColor: chartGridColor(),
      strokeDashArray: 3,
      padding: { left: 8, right: 16, top: 0, bottom: 0 },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: chartTooltipTheme(),
      shared: true,
      intersect: false,
      x: { formatter: (val) => formatApexTimeTick(val, startMs, endMs) },
      y: { formatter: (val) => formatThroughput(val) },
    },
    legend: { show: false },
    markers: {
      size: 0,
      hover: { size: 4 },
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

const renderChartsForTab = (tabId) => {
  if (tabId === 'overview') renderTrafficChart()
  if (tabId === 'protocols') renderProtocolChart()
}

const rerenderActiveCharts = () => renderChartsForTab(activeTab.value)

watch(activeTab, (tab) => nextTick(() => renderChartsForTab(tab)))

watch(selectedServer, () => {
  if (selectedSite.value === 'all') return
  const stillValid = siteOptions.value.some((option) => option.value === selectedSite.value)
  if (!stillValid) selectedSite.value = 'all'
})

onMounted(() => {
  loadServers()
  loadSites()
  loadL4Analytics()
  window.addEventListener('cdnproxy-theme-change', rerenderActiveCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', rerenderActiveCharts)
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
  max-width: 1680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analytics-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.l4-kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.l4-kpi {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  min-width: 0;
}

.l4-kpi--ok { border-top: 2px solid var(--dorian-viper-500, #2e9e6c); }
.l4-kpi--danger { border-top: 2px solid var(--dorian-danger, #e15241); }
.l4-kpi--warn { border-top: 2px solid var(--dorian-warn, #e0a83f); }
.l4-kpi--total { border-top: 2px solid #6b9fd4; }

.l4-kpi__label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.l4-kpi__value {
  font-size: 22px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.1;
}

.l4-kpi--ok .l4-kpi__value { color: var(--dorian-viper-400, var(--app-accent)); }
.l4-kpi--danger .l4-kpi__value { color: var(--dorian-danger, #e15241); }
.l4-kpi--warn .l4-kpi__value { color: var(--dorian-warn, #e0a83f); }

.l4-kpi__hint {
  font-size: 11px;
  color: var(--app-text-muted);
}

.l4-chart-panel {
  background:
    linear-gradient(180deg, rgba(217, 91, 78, 0.05) 0%, transparent 42%),
    var(--app-surface);
}

.l4-chart-panel--protocols {
  background:
    linear-gradient(180deg, rgba(46, 158, 108, 0.05) 0%, transparent 42%),
    var(--app-surface);
}

.l4-chart-readouts {
  display: flex;
  align-items: stretch;
  gap: 18px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.l4-chart-readout {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.l4-chart-readout__swatch {
  width: 8px;
  height: 28px;
  border-radius: 4px;
  flex-shrink: 0;
}

.l4-chart-readout__swatch--allowed {
  background: var(--dorian-viper-500, #2e9e6c);
}

.l4-chart-readout__swatch--blocked {
  background: var(--dorian-danger, #e15241);
}

.l4-chart-readout__label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.l4-chart-readout__value {
  font-size: 16px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.2;
  margin-top: 1px;
}

.l4-chart-readout__value.signal { color: var(--dorian-viper-400, var(--app-accent)); }
.l4-chart-readout__value.danger { color: var(--dorian-danger, #e15241); }
.l4-chart-readout__value.warn { color: var(--dorian-warn, #e0a83f); }

.l4-proto-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  justify-content: flex-end;
}

.l4-proto-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  color: var(--app-text-muted);
}

.l4-proto-legend__swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.dash-chart-wrap--hero {
  min-height: 400px;
}

.dash-chart-wrap--hero :deep(.apexcharts-canvas),
.dash-chart-wrap--hero :deep(.apexcharts-svg) {
  background: transparent !important;
}

.dash-select--sm {
  min-width: 72px;
  padding: 4px 8px;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.table-wrap {
  max-height: 420px;
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
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.attack-syn {
  background: rgba(107, 159, 212, 0.16);
  color: #6b9fd4;
}

.attack-udp {
  background: rgba(212, 162, 74, 0.16);
  color: #d4a24a;
}

.attack-icmp {
  background: rgba(63, 189, 133, 0.16);
  color: #3fbd85;
}

.attack-other {
  background: rgba(143, 163, 184, 0.16);
  color: #8fa3b8;
}

.action-btn {
  border: none;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: var(--type-caption);
  font-weight: 600;
  cursor: pointer;
}

.action-btn--danger {
  background: rgba(225, 82, 65, 0.14);
  color: #e15241;
}

.action-btn--danger:hover {
  background: rgba(225, 82, 65, 0.22);
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 1100px) {
  .l4-kpi-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .l4-kpi-strip {
    grid-template-columns: 1fr;
  }

  .l4-chart-readouts,
  .l4-proto-legend {
    justify-content: flex-start;
  }
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
  color: var(--app-text-muted);
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
</style>
