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

    <div class="dash-filterbar">
      <div class="dash-filter-field">
        <label for="detect-edge">Edge</label>
        <select id="detect-edge" v-model="selectedEdge" class="dash-select" :disabled="isLoading">
          <option v-for="option in serverOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label for="detect-site">Site</label>
        <select id="detect-site" v-model="selectedSite" class="dash-select" :disabled="isLoading">
          <option v-for="option in siteOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="dash-filter-field">
        <label>Time range</label>
        <div class="dash-range-pills">
          <button
            v-for="pill in timeRanges"
            :key="pill.value"
            type="button"
            class="dash-range-pill"
            :class="{ active: selectedRange === pill.value && !isCustomRange }"
            :disabled="isLoading"
            @click="selectTimeRange(pill.value)"
          >
            {{ pill.label }}
          </button>
          <button
            type="button"
            class="dash-range-pill dash-range-pill--custom"
            :class="{ active: isCustomRange }"
            :disabled="isLoading"
            @click="openCustomDialog"
          >
            Custom
          </button>
        </div>
      </div>
      <div class="dash-filter-summary">
        <span class="dash-live-dot" aria-hidden="true"></span>
        {{ rangeLabel }}
      </div>
      <button type="button" class="dash-filter-apply" :disabled="isLoading" @click="applyFilters">
        <span v-if="isLoading" class="dash-spinner dash-spinner--btn" aria-hidden="true"></span>
        {{ isLoading ? 'Loading…' : 'Apply' }}
      </button>
    </div>

    <section class="dash-kpi-strip" aria-label="Attack totals">
      <article class="dash-kpi dash-kpi--danger">
        <span class="dash-kpi__label">L4 drop rate</span>
        <span class="dash-kpi__value num">{{ formatRate(latestL4DropRate) }}</span>
        <span class="dash-kpi__hint">latest Sparta sample · {{ rangeLabel }}</span>
      </article>
      <article class="dash-kpi dash-kpi--warn">
        <span class="dash-kpi__label">Refused HTTP</span>
        <span class="dash-kpi__value num">{{ formatNumber(l7Defense.blockRequestCounts) }}</span>
        <span class="dash-kpi__hint">every blocked L7 request · {{ rangeLabel }}</span>
      </article>
      <RouterLink class="dash-kpi" :to="{ name: 'server-blacklist' }">
        <span class="dash-kpi__label">Active temp-blocks</span>
        <span class="dash-kpi__value num">{{ formatNumber(monthStats.blockedIps) }}</span>
        <span class="dash-kpi__hint">live Temporary blocks · all edges</span>
      </RouterLink>
    </section>

    <section class="dash-grid12">
      <div class="dash-panel c-6">
        <div class="dash-panel-head">
          <div>
            <h3>L4 drop rate</h3>
            <p class="dash-panel-desc">Sparta drop rate (bytes/s) · edge-wide, site filter ignored · {{ rangeLabel }}</p>
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
            <h3>Refused HTTP</h3>
            <p class="dash-panel-desc">Every L7 request Athens refused. Long ranges average per chart point · {{ rangeLabel }}</p>
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
          <h3>L4 attack periods</h3>
          <span class="dash-count-tag">{{ formatNumber(l4EventRows.length) }} total</span>
        </div>
        <p v-if="!l4EventRows.length" class="dash-empty">No L4 attack periods{{ selectedEdge === 'all' ? '' : ' on this edge' }} in {{ rangeLabel }}.</p>
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
          <h3>L7 temp-block events</h3>
          <span class="dash-count-tag">{{ formatNumber(l7EventRows.length) }} shown</span>
        </div>
        <p v-if="!l7EventRows.length" class="dash-empty">No IPs added to Temporary blocks in {{ rangeLabel }}.</p>
        <div v-else class="dash-log">
          <button
            v-for="event in l7EventRows"
            :key="`${event.id || event.sourceIp}-${event.blockedAt}`"
            type="button"
            class="dash-log-line"
            @click="openL7TempBlock(event)"
          >
            <span class="dash-log-time">{{ formatLogTime(event.blockedAt || event.createdAt) }}</span>
            <span class="dash-log-tag l7">L7</span>
            <span class="dash-log-msg">
              <span>{{ event.sourceIp || event.title }}<span v-if="event.serverName" class="dash-log-edge"> · {{ event.serverName }}</span></span>
              <span class="dash-log-detail">{{ event.url || event.triggerRule || event.description || 'Temporary block' }}</span>
            </span>
          </button>
        </div>
      </div>
    </section>
    <SecurityEventDialog :event="selectedSecurityEvent" @close="selectedSecurityEvent = null" />
    <L7TempBlockConsole
      v-if="selectedL7Event"
      :event="selectedL7Event"
      :range="appliedFilters.isCustom ? '' : appliedFilters.range"
      :start="appliedFilters.isCustom ? appliedFilters.customStart : ''"
      :end="appliedFilters.isCustom ? appliedFilters.customEnd : ''"
      :server-id="appliedFilters.server"
      :site-id="appliedFilters.site"
      :range-label="rangeLabel"
      @close="selectedL7Event = null"
      @select="selectedL7Event = $event"
    />

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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ApexCharts from 'apexcharts'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import AppTopbarActions from '@/components/AppTopbarActions.vue'
import SecurityEventDialog from '@/components/SecurityEventDialog.vue'
import L7TempBlockConsole from '@/components/L7TempBlockConsole.vue'
import { openAttackConsole } from '@/stores/attackAlert'
import { l4AttackLabel } from '@/utils/l4AttackType'
import { fetchDashboardSummary, fetchSecurityEvents } from '@/api/dashboard'
import { fetchL4Series, fetchL4Summary } from '@/api/l4Analytics'
import { fetchSecurityAttacks, fetchSecuritySeries, fetchSecuritySummary } from '@/api/securityAnalytics'
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
const timeRanges = sharedTimeRanges
const datePickerConfig = { enableTime: true, time_24hr: true, dateFormat: 'Y-m-d H:i' }

const pad = (n) => String(n).padStart(2, '0')
const toLocalStamp = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const formatDateTime = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleString()
}
const formatDateInput = (value) => {
  if (!value) return ''
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

const selectedEdge = ref('all')
const selectedSite = ref('all')
const selectedRange = ref(readSharedTimeRange())
const isCustomRange = ref(false)
const showCustomDialog = ref(false)
const customStartDate = ref(null)
const customEndDate = ref(null)
const isLoading = ref(false)
const appliedFilters = ref({
  server: 'all',
  site: 'all',
  range: readSharedTimeRange(),
  isCustom: false,
  customStart: '',
  customEnd: '',
})
const servers = ref([])
const sites = ref([])
const securityEvents = ref([])
const selectedSecurityEvent = ref(null)
const selectedL7Event = ref(null)
const openSecurityEvent = (event) => {
  if (event?.reqId) {
    openAttackConsole(event.reqId)
    return
  }
  selectedSecurityEvent.value = event
}
const openL7TempBlock = (event) => {
  selectedL7Event.value = event
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

const resolveRangeWindow = (filters = appliedFilters.value) => {
  if (filters.isCustom && filters.customStart && filters.customEnd) {
    const start = new Date(filters.customStart).getTime()
    const end = new Date(filters.customEnd).getTime()
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      return { start, end }
    }
  }
  const end = Date.now()
  return { start: end - rangeDurationMs(filters.range), end }
}

const rangeLabel = computed(() => {
  const filters = appliedFilters.value
  if (filters.isCustom && filters.customStart && filters.customEnd) {
    return `${formatDateTime(filters.customStart)} → ${formatDateTime(filters.customEnd)}`
  }
  return timeRanges.find((pill) => pill.value === filters.range)?.label || filters.range
})

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
  const { start, end } = resolveRangeWindow()
  if (event?.status === 'ongoing') return true
  const last = new Date(event?.endedAt || event?.createdAt || event?.startedAt).getTime()
  return Number.isFinite(last) && last >= start && last <= end
}

const l4EventRows = computed(() => securityEvents.value.filter((event) => {
  if (eventTag(event) !== 'L4' || !eventInRange(event)) return false
  if (appliedFilters.value.server === 'all') return true
  return String(event.serverId ?? '') === String(appliedFilters.value.server)
}))
const l7TempBlockRows = ref([])
const l7EventRows = computed(() => {
  let rows = l7TempBlockRows.value
  if (appliedFilters.value.site !== 'all') {
    rows = rows.filter((row) => String(row.siteId ?? '') === String(appliedFilters.value.site))
  }
  return rows.slice(0, 12)
})
const latestL4DropRate = computed(() => {
  const data = l4BlockedSeries.value[0]?.data || []
  if (data.length) return Number(data[data.length - 1]?.y) || 0
  return Number(l4Defense.value.blockedTraffic) || 0
})

const l4Hit = computed(() => Number(l4Defense.value.blockedTraffic) > 0 || l4EventRows.value.length > 0)
const l7Hit = computed(() => Number(l7Defense.value.blockRequestCounts) > 0 || l7EventRows.value.length > 0)

const detectionDetail = computed(() => {
  const windowLabel = rangeLabel.value
  if (l4Hit.value && l7Hit.value) return `L4 floods and refused HTTP in ${windowLabel}.`
  if (l4Hit.value) return `L4 floods in ${windowLabel}. No refused HTTP in this window.`
  if (l7Hit.value) return `Refused HTTP in ${windowLabel}. No L4 floods in this window.`
  return `No L4 floods or refused HTTP in ${windowLabel}.`
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

const formatRate = (value) => {
  const label = formatThroughput(value)
  return label === '0' ? '0 B/s' : `${label}/s`
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
  const { start: startMs, end: endMs } = resolveRangeWindow()
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
    (value) => formatRate(value),
    (value) => formatRate(value),
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

const buildDetectionParams = () => {
  const filters = appliedFilters.value
  const window = resolveRangeWindow(filters)
  return {
    serverId: filters.server,
    siteId: filters.site,
    start: new Date(window.start).toISOString(),
    end: new Date(window.end).toISOString(),
    range: filters.isCustom ? 'custom' : filters.range,
  }
}

const loadDetection = async () => {
  const token = ++loadToken
  isLoading.value = true
  const params = buildDetectionParams()
  const eventRange = { start: params.start, end: params.end }
  try {
    const [l4Summary, l4Series, l7Summary, l7Series, events, l7Temp, summary] = await Promise.all([
      fetchL4Summary(params),
      fetchL4Series('traffic', params),
      fetchSecuritySummary(params),
      fetchSecuritySeries('block-count', params),
      fetchSecurityEvents(5000, params.serverId, eventRange),
      fetchSecurityAttacks('recent', { ...params, limit: 12 }).catch(() => []),
      fetchDashboardSummary(),
    ])
    if (token !== loadToken) return
    l4Defense.value = { blockedTraffic: Number(l4Summary?.blockedTraffic ?? 0) }
    l7Defense.value = { blockRequestCounts: Number(l7Summary?.blockRequestCounts ?? 0) }
    l4BlockedSeries.value = [{ name: 'Drop rate', data: mapL4Points(l4Series) }]
    l7BlockSeries.value = [{ name: 'Refused HTTP', data: mapL7Points(l7Series) }]
    // Keep every returned attack period; L4 rows are filtered in l4EventRows.
    securityEvents.value = Array.isArray(events) ? events : []
    l7TempBlockRows.value = Array.isArray(l7Temp) ? l7Temp : []
    monthStats.value = {
      l4AttacksThisMonth: Number(summary?.l4AttacksThisMonth ?? 0),
      l7ThreatsThisMonth: Number(summary?.l7ThreatsThisMonth ?? 0),
      blockedIps: Number(summary?.blockedIps ?? 0),
    }
    renderCharts()
  } catch (error) {
    console.error('Failed to load attack detection', error)
  } finally {
    if (token === loadToken) isLoading.value = false
  }
}

const selectTimeRange = (value) => {
  selectedRange.value = value
  isCustomRange.value = false
  writeSharedTimeRange(value)
}

const openCustomDialog = () => {
  const { start, end } = resolveRangeWindow({
    range: selectedRange.value,
    isCustom: isCustomRange.value,
    customStart: customStartDate.value ? formatDateInput(customStartDate.value) : '',
    customEnd: customEndDate.value ? formatDateInput(customEndDate.value) : '',
  })
  customStartDate.value = toLocalStamp(start)
  customEndDate.value = toLocalStamp(end)
  showCustomDialog.value = true
}

const applyCustomRange = () => {
  if (!customStartDate.value || !customEndDate.value) return
  const start = new Date(customStartDate.value)
  const end = new Date(customEndDate.value)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return
  isCustomRange.value = true
  selectedRange.value = 'custom'
  showCustomDialog.value = false
  applyFilters()
}

const applyFilters = () => {
  appliedFilters.value = {
    server: selectedEdge.value,
    site: selectedSite.value,
    range: selectedRange.value,
    isCustom: isCustomRange.value,
    customStart: isCustomRange.value ? formatDateInput(customStartDate.value) : '',
    customEnd: isCustomRange.value ? formatDateInput(customEndDate.value) : '',
  }
  void loadDetection()
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
    applyFilters()
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

watch(selectedEdge, () => {
  if (selectedSite.value === 'all') return
  const stillValid = siteOptions.value.some((option) => option.value === selectedSite.value)
  if (!stillValid) selectedSite.value = 'all'
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--app-overlay, rgba(0, 0, 0, 0.45));
}

.dialog-content {
  width: min(420px, 100%);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-bg, var(--app-surface));
  box-shadow: 0 18px 48px color-mix(in srgb, #000 35%, transparent);
}

.dialog-header,
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.dialog-header {
  border-bottom: 1px solid var(--app-border);
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
}

.dialog-close {
  border: 0;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.dialog-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-form-group label {
  font-size: 12px;
  color: var(--app-text-muted);
}

.dialog-input {
  background: var(--app-input-bg);
  border: 0.5px solid var(--app-border-strong);
  color: var(--app-text);
  font-size: var(--type-caption, 13px);
  padding: 8px 10px;
  border-radius: 6px;
  width: 100%;
}

.dialog-footer {
  border-top: 1px solid var(--app-border);
  justify-content: flex-end;
}

.dialog-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-muted, transparent);
  color: var(--app-text);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.dialog-btn.apply-btn {
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 40%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 14%, var(--app-surface));
  color: var(--dorian-viper-400, var(--app-accent));
}

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
