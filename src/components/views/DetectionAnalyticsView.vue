<template>
  <div class="dashboard-view detection-view">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <h2>Security events</h2>
        <p>{{ detectionDetail }}</p>
      </div>
      <div class="dash-topbar__right">
        <AppTopbarActions />
      </div>
    </header>

    <AnalyticsSectionNav />

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="detect-edge">Edge node</label>
        <select id="detect-edge" v-model="selectedEdge" class="dash-select">
          <option v-for="option in serverOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="detect-site">Site</label>
        <select id="detect-site" v-model="selectedSite" class="dash-select">
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
            :class="{ active: selectedRange === pill.value }"
            @click="setRange(pill.value)"
          >
            {{ pill.label }}
          </button>
        </div>
      </div>
      <div class="dash-filter-summary">
        <span class="dash-live-dot" aria-hidden="true"></span>
        {{ rangeLabel }}
      </div>
    </div>

    <section class="dash-kpi-strip" aria-label="Attack totals">
      <article class="dash-kpi dash-kpi--danger">
        <span class="dash-kpi__label">L4 blocked</span>
        <span class="dash-kpi__value num">{{ formatThroughput(l4Defense.blockedTraffic) }}</span>
        <span class="dash-kpi__hint">{{ formatNumber(monthStats.l4AttacksThisMonth) }} attacks this month</span>
      </article>
      <article class="dash-kpi dash-kpi--warn">
        <span class="dash-kpi__label">L7 blocked</span>
        <span class="dash-kpi__value num">{{ formatNumber(l7Defense.blockRequestCounts) }}</span>
        <span class="dash-kpi__hint">{{ formatNumber(monthStats.l7ThreatsThisMonth) }} threats this month</span>
      </article>
      <RouterLink class="dash-kpi" :to="{ name: 'server-blacklist' }">
        <span class="dash-kpi__label">Blocked IPs</span>
        <span class="dash-kpi__value num">{{ formatNumber(monthStats.blockedIps) }}</span>
        <span class="dash-kpi__hint">active blocks</span>
      </RouterLink>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <div>
            <h3>L4 attacks</h3>
            <p class="dash-panel-desc">Flood traffic dropped over {{ rangeLabel }}</p>
          </div>
          <RouterLink class="dash-panel-link" :to="{ name: 'layer4-attack-analytics' }">L4 detail</RouterLink>
        </div>
        <div class="dash-chart-wrap">
          <div ref="l4AttackChart"></div>
        </div>
      </div>
      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <div>
            <h3>L7 blocks</h3>
            <p class="dash-panel-desc">Firewall blocks over {{ rangeLabel }}</p>
          </div>
          <RouterLink class="dash-panel-link" :to="{ name: 'security-analytics-detail' }">L7 detail</RouterLink>
        </div>
        <div class="dash-chart-wrap">
          <div ref="l7BlockChart"></div>
        </div>
      </div>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <h3>L4 events</h3>
          <span class="dash-count-tag">{{ formatNumber(l4EventRows.length) }} total</span>
        </div>
        <p v-if="!l4EventRows.length" class="dash-empty">No L4 attacks{{ selectedEdge === 'all' ? '' : ' on this edge' }} in the last {{ rangeLabel }}.</p>
        <div v-else class="dash-log dash-log--full">
          <button
            v-for="event in l4EventRows"
            :key="event.id || event.reqId"
            type="button"
            class="dash-log-line"
            @click="openSecurityEvent(event)"
          >
            <span class="dash-log-time">{{ formatLogTime(event.startedAt || event.createdAt) }}</span>
            <span class="dash-log-tag l4">{{ event.status === 'ongoing' ? 'LIVE' : 'L4' }}</span>
            <span class="dash-log-msg">
              <span>{{ l4AttackLabel(event.attackType || event.title) }}<span v-if="event.serverName" class="dash-log-edge"> · {{ event.serverName }}</span></span>
              <span class="dash-log-detail">
                <template v-if="event.description">{{ event.description }}</template>
                <template v-else-if="event.ipCount">{{ formatNumber(event.ipCount) }} sources</template>
              </span>
            </span>
          </button>
        </div>
      </div>
      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <h3>L7 events</h3>
        </div>
        <p v-if="!l7EventRows.length" class="dash-empty">No L7 block events in the last {{ rangeLabel }}.</p>
        <div v-else class="dash-log">
          <button
            v-for="event in l7EventRows"
            :key="event.id"
            type="button"
            class="dash-log-line"
            @click="selectedSecurityEvent = event"
          >
            <span class="dash-log-time">{{ formatLogTime(event.createdAt) }}</span>
            <span class="dash-log-tag l7">L7</span>
            <span class="dash-log-msg">
              <span>{{ event.title }}<span v-if="event.serverName" class="dash-log-edge"> · {{ event.serverName }}</span></span>
              <span v-if="event.description" class="dash-log-detail">{{ event.description }}</span>
            </span>
          </button>
        </div>
      </div>
    </section>
    <SecurityEventDialog :event="selectedSecurityEvent" @close="selectedSecurityEvent = null" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ApexCharts from 'apexcharts'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import AnalyticsSectionNav from '@/components/views/analytics/AnalyticsSectionNav.vue'
import SecurityEventDialog from '@/components/SecurityEventDialog.vue'
import { openAttackConsole } from '@/stores/attackAlert'
import { l4AttackLabel } from '@/utils/l4AttackType'
import { fetchDashboardSummary, fetchSecurityEvents } from '@/api/dashboard'
import { fetchL4Series, fetchL4Summary } from '@/api/l4Analytics'
import { fetchSecuritySeries, fetchSecuritySummary } from '@/api/securityAnalytics'
import { fetchServers } from '@/api/servers'
import { fetchSites } from '@/api/sites'
import {
  getApexAxisLabelStyle,
  getApexBaseChartOptions,
  getApexDatetimeXaxis,
  getApexProductionStrokeFill,
  getApexSeriesColors,
  getApexThemePatch,
  getApexTimeRangeAnnotations,
  padSeriesToTimeRange,
} from '@/utils/chartTheme'
import { rangeDurationMs, readSharedTimeRange, sharedTimeRanges, writeSharedTimeRange } from '@/utils/timeRange'

const CHART_HEIGHT = 240
const rangePillOptions = sharedTimeRanges

const selectedEdge = ref('all')
const selectedSite = ref('all')
const selectedRange = ref(readSharedTimeRange())
const servers = ref([])
const sites = ref([])
const securityEvents = ref([])
const selectedSecurityEvent = ref(null)
const openSecurityEvent = (event) => {
  if (event?.reqId) {
    openAttackConsole(event.reqId)
    return
  }
  selectedSecurityEvent.value = event
}
const l4Defense = ref({ blockedTraffic: 0 })
const l7Defense = ref({ blockRequestCounts: 0 })
const l4BlockedSeries = ref([{ name: 'Blocked', data: [] }])
const l7BlockSeries = ref([{ name: 'Blocked', data: [] }])
const monthStats = ref({ l4AttacksThisMonth: 0, l7ThreatsThisMonth: 0, blockedIps: 0 })

const l4AttackChart = ref(null)
const l7BlockChart = ref(null)
let l4Chart = null
let l7Chart = null
let pollTimer = 0

const rangeLabel = computed(
  () => rangePillOptions.find((pill) => pill.value === selectedRange.value)?.label || selectedRange.value,
)

const serverOptions = computed(() => [
  { label: 'All edges', value: 'all' },
  ...servers.value.map((server) => ({ label: server.name || `Edge ${server.id}`, value: String(server.id) })),
])

const siteOptions = computed(() => {
  let list = sites.value
  if (selectedEdge.value !== 'all') {
    const edgeId = Number(selectedEdge.value)
    list = list.filter(
      (site) => Array.isArray(site.serverIds) && site.serverIds.some((id) => Number(id) === edgeId),
    )
  }
  return [
    { label: 'All sites', value: 'all' },
    ...list.map((site) => ({ label: site.domain || `Site ${site.id}`, value: String(site.id) })),
  ]
})

const eventTag = (event) => {
  const layer = String(event?.layer || '').toUpperCase()
  if (layer === 'L4' || layer === 'L7') return layer
  const title = String(event?.title || '').toLowerCase()
  if (title.includes('l4') || title.includes('ddos') || title.includes('attack')) return 'L4'
  if (title.includes('waf') || title.includes('l7')) return 'L7'
  return 'SYS'
}

const eventInRange = (event) => {
  const windowStart = Date.now() - rangeDurationMs(selectedRange.value)
  if (event?.status === 'ongoing') return true
  const last = new Date(event?.endedAt || event?.createdAt || event?.startedAt).getTime()
  return Number.isFinite(last) && last >= windowStart
}

const l4EventRows = computed(() => securityEvents.value.filter((event) => {
  if (eventTag(event) !== 'L4' || !eventInRange(event)) return false
  if (selectedEdge.value === 'all') return true
  return String(event.serverId ?? '') === String(selectedEdge.value)
}))
const l7EventRows = computed(() =>
  securityEvents.value.filter((event) => eventTag(event) === 'L7' && eventInRange(event)).slice(0, 8),
)

const l4Hit = computed(() => Number(l4Defense.value.blockedTraffic) > 0 || l4EventRows.value.length > 0)
const l7Hit = computed(() => Number(l7Defense.value.blockRequestCounts) > 0 || l7EventRows.value.length > 0)

const detectionDetail = computed(() => {
  const windowLabel = rangeLabel.value
  if (l4Hit.value && l7Hit.value) return `L4 and L7 attacks in the last ${windowLabel}.`
  if (l4Hit.value) return `L4 attacks in the last ${windowLabel}. No L7 blocks in this window.`
  if (l7Hit.value) return `L7 attacks in the last ${windowLabel}. No L4 floods in this window.`
  return `No L4 or L7 attacks in the last ${windowLabel}.`
})

const formatNumber = (value) => {
  const numeric = Number(value) || 0
  return new Intl.NumberFormat().format(numeric)
}

const formatThroughput = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  let current = numeric
  while (current >= 1000 && index < units.length - 1) {
    current /= 1000
    index += 1
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[index]}`
}

const formatLogTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  if (date.toDateString() === new Date().toDateString()) return time
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

const mapL4Points = (points) =>
  (Array.isArray(points) ? points : [])
    .map((point) => ({
      x: new Date(point.timestamp ?? point.time ?? point.x).getTime(),
      y: Number(point.blockedTraffic ?? point.value ?? 0),
    }))
    .filter((point) => Number.isFinite(point.x))

const mapL7Points = (points) =>
  (Array.isArray(points) ? points : [])
    .map((point) => {
      const timestamp = point.timestamp ?? point.time ?? point.x
      const timeValue = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()
      return { x: timeValue, y: Number(point.count ?? point.value ?? point.y ?? 0) }
    })
    .filter((point) => Number.isFinite(point.x))

const chartOptions = (color, series, yFormat, tipFormat) => {
  const now = Date.now()
  const startMs = now - rangeDurationMs(selectedRange.value)
  const endMs = now
  const base = getApexBaseChartOptions()
  return {
    ...base,
    ...getApexProductionStrokeFill({ variant: 'line' }),
    chart: {
      ...base.chart,
      type: 'line',
      height: CHART_HEIGHT,
      width: '100%',
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
    },
    colors: [color],
    legend: { show: false },
    xaxis: getApexDatetimeXaxis(startMs, endMs, { tickCount: 6, fontSize: '10px' }),
    annotations: getApexTimeRangeAnnotations(startMs, endMs),
    series: padSeriesToTimeRange(series, startMs, endMs),
    yaxis: {
      min: 0,
      labels: { formatter: yFormat, style: getApexAxisLabelStyle('10px') },
    },
    tooltip: {
      theme: 'dark',
      x: {
        formatter: (val) =>
          new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      },
      y: { formatter: tipFormat },
    },
  }
}

const renderCharts = () => {
  const colors = getApexSeriesColors()
  const l4Options = chartOptions(
    colors.danger,
    l4BlockedSeries.value,
    (value) => formatThroughput(value),
    (value) => formatThroughput(value),
  )
  const l7Options = chartOptions(
    colors.warn,
    l7BlockSeries.value,
    (value) => formatNumber(Math.round(value)),
    (value) => `${formatNumber(Math.round(value))} blocked`,
  )
  if (l4AttackChart.value) {
    if (!l4Chart) {
      l4Chart = new ApexCharts(l4AttackChart.value, l4Options)
      l4Chart.render()
    } else {
      l4Chart.updateSeries(l4Options.series, false)
      l4Chart.updateOptions({ xaxis: l4Options.xaxis, annotations: l4Options.annotations, yaxis: l4Options.yaxis }, false, false)
    }
  }
  if (l7BlockChart.value) {
    if (!l7Chart) {
      l7Chart = new ApexCharts(l7BlockChart.value, l7Options)
      l7Chart.render()
    } else {
      l7Chart.updateSeries(l7Options.series, false)
      l7Chart.updateOptions({ xaxis: l7Options.xaxis, annotations: l7Options.annotations, yaxis: l7Options.yaxis }, false, false)
    }
  }
}

let loadToken = 0

const loadDetection = async () => {
  const token = ++loadToken
  const params = {
    range: selectedRange.value,
    serverId: selectedEdge.value,
    siteId: selectedSite.value,
  }
  try {
    const [l4Summary, l4Series, l7Summary, l7Series, events, summary] = await Promise.all([
      fetchL4Summary(params),
      fetchL4Series('traffic', params),
      fetchSecuritySummary(params),
      fetchSecuritySeries('block-count', params),
      fetchSecurityEvents(5000, selectedEdge.value),
      fetchDashboardSummary(),
    ])
    if (token !== loadToken) return
    l4Defense.value = { blockedTraffic: Number(l4Summary?.blockedTraffic ?? 0) }
    l7Defense.value = { blockRequestCounts: Number(l7Summary?.blockRequestCounts ?? 0) }
    l4BlockedSeries.value = [{ name: 'Blocked', data: mapL4Points(l4Series) }]
    l7BlockSeries.value = [{ name: 'Blocked', data: mapL7Points(l7Series) }]
    // Keep every returned attack period; L4 rows are filtered in l4EventRows.
    securityEvents.value = Array.isArray(events) ? events : []
    monthStats.value = {
      l4AttacksThisMonth: Number(summary?.l4AttacksThisMonth ?? 0),
      l7ThreatsThisMonth: Number(summary?.l7ThreatsThisMonth ?? 0),
      blockedIps: Number(summary?.blockedIps ?? 0),
    }
    renderCharts()
  } catch (error) {
    console.error('Failed to load attack detection', error)
  }
}

const setRange = (value) => {
  selectedRange.value = value
  writeSharedTimeRange(value)
}

const refreshTheme = () => {
  const patch = getApexThemePatch()
  l4Chart?.updateOptions(patch, false, false)
  l7Chart?.updateOptions(patch, false, false)
}

onMounted(() => {
  window.addEventListener('cdnproxy-theme-change', refreshTheme)
  void (async () => {
    try {
      const [serverList, siteList] = await Promise.all([fetchServers(), fetchSites()])
      servers.value = Array.isArray(serverList) ? serverList : []
      sites.value = Array.isArray(siteList) ? siteList : []
    } catch (error) {
      console.error('Failed to load detection filters', error)
    }
    await loadDetection()
  })()
  pollTimer = window.setInterval(() => {
    if (document.visibilityState !== 'hidden') void loadDetection()
  }, 60_000)
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', refreshTheme)
  if (pollTimer) window.clearInterval(pollTimer)
  l4Chart?.destroy()
  l7Chart?.destroy()
})

watch([selectedEdge, selectedSite, selectedRange], () => {
  void loadDetection()
})
</script>

<style scoped>
.detection-view :deep(.dash-chart-wrap) {
  min-height: 0;
  height: auto;
  overflow: hidden;
}

.detection-view :deep(.apexcharts-canvas),
.detection-view :deep(.apexcharts-svg) {
  max-width: 100%;
}

a.dash-kpi {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}

.dash-panel-desc {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.dash-panel-link {
  font-size: 12px;
  color: var(--dorian-viper-400, var(--app-accent));
  text-decoration: none;
}

.dash-empty {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-muted);
}

.dash-log {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 12px;
  line-height: 1.9;
  max-height: 240px;
  overflow-y: auto;
}

.dash-log--full {
  max-height: min(70vh, 720px);
}

.dash-log-line {
  display: flex;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 4px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.dash-log-line:hover {
  background: rgba(63, 189, 133, 0.08);
  color: var(--app-heading);
}

.dash-log-msg {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.dash-log-detail {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.8;
}

.dash-log-time,
.dash-log-tag {
  flex: none;
}

.dash-log-tag {
  font-weight: 600;
}

.dash-log-tag.l4 { color: #6b9fd4; }
.dash-log-tag.l7 { color: #c4a15a; }
.dash-log-edge { opacity: 0.75; }
</style>
