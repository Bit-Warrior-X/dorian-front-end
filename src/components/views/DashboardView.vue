<template>
  <div class="dashboard-view" ref="dashboardRoot">
    <header class="dash-topbar">
      <div class="dash-topbar__left">
        <p class="dash-kicker">Edge network</p>
        <h2>CDN Overview</h2>
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

    <section class="dash-attacks" :class="{ live: liveAttacks.length }" aria-label="Attack alerts">
      <div class="dash-attacks__head">
        <h3>
          <span class="dash-attacks__dot" :class="{ live: liveAttacks.length }" aria-hidden="true"></span>
          Attack alerts
        </h3>
        <div class="dash-attacks__stats">
          <span><b class="num">{{ attacksToday.length }}</b> {{ attacksToday.length === 1 ? 'attack' : 'attacks' }} today</span>
          <span><b class="num">{{ formatNumber(sourcesToday) }}</b> sources blocked today</span>
          <RouterLink class="dash-panel-link" :to="{ name: 'attack-detection' }">Detection</RouterLink>
        </div>
      </div>

      <div v-if="liveAttacks.length" class="dash-attacks__live">
        <button
          v-for="period in liveAttacks"
          :key="period.reqId"
          type="button"
          class="dash-live-attack"
          @click="openAttackConsole(period.reqId)"
        >
          <span class="dash-live-attack__badge"><i aria-hidden="true"></i>Under attack</span>
          <span class="dash-live-attack__main">
            <strong>{{ attackHeadline(period) }}</strong>
            <span>{{ period.serverName || 'Edge' }} · started {{ formatLogTime(period.startedAt) }} · {{ elapsedLabel(period.startedAt, nowMs) }} ago</span>
          </span>
          <span class="dash-live-attack__metric">
            <b class="num">{{ formatNumber(period.activeIpCount || 0) }}</b>
            <span>blocking now</span>
          </span>
          <span class="dash-live-attack__metric">
            <b class="num">{{ formatNumber(period.ipCount || 0) }}</b>
            <span>sources so far</span>
          </span>
          <span class="dash-live-attack__open">Open live view</span>
        </button>
      </div>
      <div v-else class="dash-attacks__calm">
        <span class="dash-attacks__calm-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <span>
          <strong>No attack in progress</strong>
          <template v-if="recentAttacks[0]"> · last attack {{ formatAttackDay(recentAttacks[0].startedAt) }} {{ formatLogTime(recentAttacks[0].startedAt) }} on {{ recentAttacks[0].serverName || 'an edge' }}, {{ elapsedLabel(recentAttacks[0].endedAt || recentAttacks[0].startedAt, nowMs) }} ago</template>
          <template v-else> · no attacks recorded{{ selectedEdge === 'all' ? '' : ' on this edge' }}</template>
        </span>
      </div>

      <div v-if="recentAttacks.length" class="dash-attack-list" role="list">
        <div class="dash-attack-row dash-attack-row--head" aria-hidden="true">
          <span>Status</span><span>Attack</span><span>Started</span><span>Duration</span><span>Sources</span><span>Vectors</span>
        </div>
        <button
          v-for="period in recentAttacks.slice(0, 6)"
          :key="period.reqId"
          type="button"
          role="listitem"
          class="dash-attack-row"
          @click="openAttackConsole(period.reqId)"
        >
          <span class="dash-attack-status" :class="period.status === 'ongoing' ? 'live' : 'ended'">
            {{ period.status === 'ongoing' ? 'Ongoing' : 'Mitigated' }}
          </span>
          <span class="dash-attack-name">
            <strong>{{ attackHeadline(period) }}</strong>
            <span>{{ period.serverName || 'Edge' }}</span>
          </span>
          <span class="num dash-attack-dim">{{ formatAttackDay(period.startedAt) }} {{ formatLogTime(period.startedAt) }}</span>
          <span class="num dash-attack-dim">{{ attackDuration(period) }}</span>
          <span class="num">{{ formatNumber(period.ipCount || 0) }}</span>
          <span class="dash-attack-vectors" :title="vectorTitle(period)">
            <i v-for="part in vectorParts(period)" :key="part.label" :style="{ width: `${part.share}%`, background: part.color }"></i>
          </span>
        </button>
      </div>

      <div v-if="securityNotices.length" class="dash-notices">
        <span class="dash-notices__label">Notices</span>
        <button
          v-for="event in securityNotices.slice(0, 3)"
          :key="event.id"
          type="button"
          class="dash-notice"
          @click="openSecurityEvent(event)"
        >
          <span class="num">{{ formatLogTime(event.createdAt) }}</span>
          <span>{{ noticeLabel(event) }}</span>
          <span v-if="event.serverName" class="dash-attack-dim">{{ event.serverName }}</span>
        </button>
      </div>
    </section>

    <section class="dash-command" aria-label="Network health">
      <div class="dash-command__health">
        <div class="dash-hero__ring" :class="fleetHealthTone" :style="{ '--health': `${edgeHealthPercent}%` }">
          <span class="dash-hero__ring-value num">{{ edgeHealthPercent }}%</span>
          <span class="dash-hero__ring-label">healthy</span>
        </div>
        <div class="dash-hero__copy">
          <h3>{{ fleetHealthTitle }}</h3>
          <p>{{ fleetHealthDetail }}</p>
        </div>
      </div>
      <div class="dash-kpi-strip" role="list">
        <div class="dash-kpi tone-signal" role="listitem">
          <span class="dash-kpi__label">Site egress</span>
          <span class="dash-kpi__value num signal">{{ formatBandwidthValue(liveEgressKbps) }}</span>
          <span class="dash-kpi__hint">served by your sites now</span>
        </div>
        <div class="dash-kpi tone-l4" role="listitem">
          <span class="dash-kpi__label">Cache hit</span>
          <span class="dash-kpi__value num">{{ formatCacheRatio(fleetCacheHitRatio) }}</span>
          <span class="dash-kpi__hint">{{ fleetCacheHitHint }}</span>
        </div>
        <div class="dash-kpi tone-l7" role="listitem">
          <span class="dash-kpi__label">Requests / min</span>
          <span class="dash-kpi__value num">{{ formatPerMinute(latestRequestRate) }}</span>
          <span class="dash-kpi__hint">{{ formatPerMinute(latestResponseRate) }} responses / min</span>
        </div>
        <RouterLink class="dash-kpi tone-warn" role="listitem" :to="{ name: 'attack-detection' }">
          <span class="dash-kpi__label">Threats blocked</span>
          <span class="dash-kpi__value num warn">{{ formatNumber(threatsThisMonth) }}</span>
          <span class="dash-kpi__hint">this month · open detection</span>
        </RouterLink>
      </div>
    </section>

    <section class="dash-grid12 dash-nic" aria-label="Edge network interfaces">
      <div
        v-for="nic in [
          { key: 'rx', title: 'NIC receive', hint: 'into the edges', summary: nicRxSummary },
          { key: 'tx', title: 'NIC send', hint: 'out of the edges', summary: nicTxSummary },
        ]"
        :key="nic.key"
        class="dash-panel c-6 dash-nic-panel"
        :class="nic.key"
      >
        <div class="dash-panel-head">
          <h3>
            <span class="dash-nic-dir" :class="nic.key" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path v-if="nic.key === 'rx'" d="M8 3v10M4 9l4 4 4-4" />
                <path v-else d="M8 13V3M4 7l4-4 4 4" />
              </svg>
            </span>
            {{ nic.title }}
            <span class="dash-nic-hint">{{ nic.hint }}</span>
          </h3>
          <span class="dash-count-tag">{{ bandwidthRangeLabel }}</span>
        </div>

        <div class="dash-nic-readouts">
          <div class="dash-nic-readout now">
            <span class="dash-nic-readout__label">Now</span>
            <span class="dash-nic-readout__value num">{{ formatNicValue(nic.summary.now) }}</span>
            <span class="dash-nic-readout__hint">{{ nicAsOfLabel(nic.summary) }}</span>
          </div>
          <div class="dash-nic-readout">
            <span class="dash-nic-readout__label">Average</span>
            <span class="dash-nic-readout__value num">{{ formatNicValue(nic.summary.avg) }}</span>
            <span class="dash-nic-readout__hint">over {{ bandwidthRangeLabel }}</span>
          </div>
          <div class="dash-nic-readout">
            <span class="dash-nic-readout__label">Peak</span>
            <span class="dash-nic-readout__value num">{{ formatNicValue(nic.summary.peak) }}</span>
            <span class="dash-nic-readout__hint">busiest minute</span>
          </div>
        </div>

        <div class="dash-chart-wrap dash-chart-wrap--nic">
          <div :ref="(el) => setNicChartRef(nic.key, el)"></div>
        </div>

        <div class="dash-nic-edges" role="list">
          <button
            v-for="row in nic.summary.rows"
            :key="`${nic.key}-${row.id}`"
            type="button"
            role="listitem"
            class="dash-nic-edge"
            :class="{ off: row.hidden }"
            :title="row.hidden ? `Show ${row.label}` : `Hide ${row.label}`"
            @click="toggleServerSeries(row)"
          >
            <span class="dash-nic-edge__swatch" :style="{ background: row.color }" aria-hidden="true"></span>
            <span class="dash-nic-edge__name">{{ row.label }}</span>
            <span class="dash-nic-edge__bar" aria-hidden="true">
              <span :style="{ width: `${row.share}%`, background: row.color }"></span>
            </span>
            <span class="dash-nic-edge__value num">{{ row.now == null ? 'no data' : formatBandwidthValue(row.now) }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="dash-grid12 dash-ops">
      <div class="dash-panel c-8 dash-panel--hero-chart dash-traffic-panel">
        <div class="dash-panel-head">
          <h3>
            <span class="dash-panel-icon signal" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1.5 9h3l2-5 3 9 2-4h3" />
              </svg>
            </span>
            Traffic
            <span class="dash-panel-hint">HTTP requests per minute</span>
          </h3>
          <div class="dash-panel-head__actions">
            <span class="dash-count-tag">{{ bandwidthRangeLabel }}</span>
            <RouterLink class="dash-panel-link" :to="{ name: 'security-analytics' }">Analytics</RouterLink>
          </div>
        </div>

        <div class="dash-readout-strip">
          <div class="dash-readout-cell lead">
            <span class="dash-readout-cell__label"><i class="sw req" aria-hidden="true"></i>Requests</span>
            <span class="dash-readout-cell__value num">{{ formatPerMinute(latestRequestRate) }}<small>/min</small></span>
          </div>
          <div class="dash-readout-cell">
            <span class="dash-readout-cell__label"><i class="sw resp" aria-hidden="true"></i>Responses</span>
            <span class="dash-readout-cell__value num">{{ formatPerMinute(latestResponseRate) }}<small>/min</small></span>
          </div>
          <div class="dash-readout-cell">
            <span class="dash-readout-cell__label">Average</span>
            <span class="dash-readout-cell__value num">{{ formatPerMinute(trafficSummary.avg) }}<small>/min</small></span>
          </div>
          <div class="dash-readout-cell">
            <span class="dash-readout-cell__label">Peak</span>
            <span class="dash-readout-cell__value num">{{ formatPerMinute(trafficSummary.peak) }}<small>/min</small></span>
          </div>
        </div>

        <div class="dash-chart-wrap dash-chart-wrap--ops">
          <div ref="requestResponseChart"></div>
        </div>
      </div>

      <div class="dash-side c-4">
        <div class="dash-panel dash-status-panel">
          <div class="dash-panel-head">
            <h3>
              <span class="dash-panel-icon l4" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <path d="M3 13V8M8 13V3M13 13V6" />
                </svg>
              </span>
              Status codes
            </h3>
            <span class="dash-count-tag">{{ bandwidthRangeLabel }}</span>
          </div>
          <div class="dash-status-stack" role="img" :aria-label="statusBreakdown.map((r) => `${r.code} ${r.percent}%`).join(', ')">
            <span
              v-for="row in statusBreakdown"
              v-show="row.percent > 0"
              :key="`stack-${row.code}`"
              :class="row.tone"
              :style="{ flexGrow: row.percent }"
            ></span>
            <span v-if="!statusHasTraffic" class="empty"></span>
          </div>
          <div class="dash-status-rows">
            <div v-for="row in statusBreakdown" :key="row.code" class="dash-status-row" :class="{ quiet: !row.percent }">
              <span class="dash-status-code num" :class="row.tone">{{ row.code }}</span>
              <span class="dash-status-label">{{ row.label }}</span>
              <span class="dash-status-rate num">{{ formatPerMinute(row.perMinute) }}<small>/min</small></span>
              <span class="dash-status-pct num">{{ row.percent }}%</span>
            </div>
          </div>
        </div>

        <div class="dash-panel dash-sites-panel">
          <div class="dash-panel-head">
            <h3>
              <span class="dash-panel-icon l7" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
                </svg>
              </span>
              Top sites
            </h3>
            <RouterLink class="dash-panel-link" :to="{ name: 'site-list' }">All sites</RouterLink>
          </div>
          <p v-if="!topSiteRows.length" class="dash-empty">No site traffic in this range.</p>
          <RouterLink
            v-for="(row, index) in topSiteRows.slice(0, 5)"
            :key="`site-${row.label}`"
            class="dash-site-row"
            :to="row.siteId ? { name: 'site-settings', query: { siteId: String(row.siteId) } } : { name: 'site-list' }"
          >
            <span class="dash-site-rank num">{{ index + 1 }}</span>
            <span class="dash-site-main">
              <span class="dash-site-top">
                <span class="dash-site-name" :title="row.label">{{ row.label }}</span>
                <span class="dash-site-count num">{{ formatNumber(row.count) }}</span>
              </span>
              <span class="dash-site-bar" aria-hidden="true"><span :style="{ width: `${row.percent}%` }"></span></span>
            </span>
            <span class="dash-site-meta">
              <span class="dash-site-pct num">{{ row.percent }}%</span>
              <span v-if="row.cacheLabel" class="dash-site-cache num" title="Cache hit ratio">{{ row.cacheLabel }} hit</span>
            </span>
          </RouterLink>
        </div>
      </div>
    </section>

    <SecurityEventDialog :event="selectedSecurityEvent" @close="selectedSecurityEvent = null" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SecurityEventDialog from '@/components/SecurityEventDialog.vue'
import { openAttackConsole } from '@/stores/attackAlert'
import { RouterLink, useRouter } from 'vue-router'
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
  getApexDatetimeXaxis,
  getApexLinePalette,
  getApexProductionStrokeFill,
  getApexSeriesColors,
  getApexStatusPalette,
  getApexThemePatch,
  getApexTimeRangeAnnotations,
  padSeriesToTimeRange,
} from '@/utils/chartTheme'
import {
  resolveAngelosRuntimeStatus,
} from '@/utils/serverLayerStatus'
import { rangeDurationMs, readSharedTimeRange, sharedTimeRanges, writeSharedTimeRange } from '@/utils/timeRange'

const seriesColors = () => getApexSeriesColors()
const linePalette = () => getApexLinePalette()
const productionStrokeFill = () => getApexProductionStrokeFill({ variant: 'line' })
const router = useRouter()

const dashboardRoot = ref(null)
const bandwidthNicRxChart = ref(null)
const bandwidthNicTxChart = ref(null)
const setNicChartRef = (key, el) => {
  if (key === 'rx') bandwidthNicRxChart.value = el
  else bandwidthNicTxChart.value = el
}
const bandwidthL7RxChart = ref(null)
const bandwidthL7TxChart = ref(null)
const bandwidthCombinedChart = ref(null)
const bandwidthDeliveryChart = ref(null)
const requestResponseChart = ref(null)
const statusCodeChart = ref(null)

const securityEvents = ref([])
const selectedSecurityEvent = ref(null)
const openSecurityEvent = (event) => {
  if (event?.reqId) {
    openAttackConsole(event.reqId)
    return
  }
  selectedSecurityEvent.value = event
}
const nowMs = ref(Date.now())
const scopedPeriods = computed(() => securityEvents.value.filter((period) => (
  selectedEdge.value === 'all' || String(period.serverId ?? '') === String(selectedEdge.value)
)))
const recentAttacks = computed(() => scopedPeriods.value.filter((period) => period.reqId))
const liveAttacks = computed(() => recentAttacks.value.filter((period) => period.status === 'ongoing'))
const securityNotices = computed(() => scopedPeriods.value.filter((period) => !period.reqId))
const attacksToday = computed(() => {
  const today = new Date(nowMs.value).toDateString()
  return recentAttacks.value.filter((period) => new Date(period.startedAt).toDateString() === today)
})
const sourcesToday = computed(() => attacksToday.value.reduce((sum, period) => sum + (Number(period.ipCount) || 0), 0))

const VECTOR_LABELS = [
  ['SOCKET', 'Socket'], ['XMAS', 'Socket'], ['NULL', 'Socket'], ['FIN', 'Socket'],
  ['STOMP', 'STOMP'], ['PSH', 'STOMP'], ['HANDSHAKE', 'Handshake'],
  ['SYN', 'SYN'], ['RST', 'RST'], ['ACK', 'ACK'],
  ['UDP', 'UDP'], ['ICMP', 'ICMP'], ['GRE', 'GRE'],
]
const vectorLabel = (raw) => {
  const tokens = new Set(String(raw || '').toUpperCase().split(/[^A-Z0-9]+/))
  const hit = VECTOR_LABELS.find(([token]) => tokens.has(token))
  return hit ? hit[1] : ''
}
const periodVectors = (period) => {
  const totals = new Map()
  ;(period?.vectors || []).forEach((item) => {
    const label = vectorLabel(item.type)
    if (label) totals.set(label, (totals.get(label) || 0) + (Number(item.count) || 0))
  })
  if (!totals.size) {
    const label = vectorLabel(period?.attackType)
    if (label) totals.set(label, Number(period?.ipCount) || 1)
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1])
}
const attackHeadline = (period) => {
  const labels = periodVectors(period).slice(0, 2).map(([label]) => label)
  return labels.length ? `${labels.join(' + ')} flood` : (period?.title || 'L4 attack')
}
const vectorColor = (label) => {
  const colors = getApexSeriesColors()
  return {
    STOMP: colors.l7, Handshake: colors.warn, SYN: colors.sand, ACK: colors.warn, RST: colors.danger,
    UDP: colors.l4, ICMP: colors.teal, GRE: colors.teal, Socket: colors.slate,
  }[label] || colors.muted
}
const vectorParts = (period) => {
  const entries = periodVectors(period)
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1
  return entries.slice(0, 4).map(([label, count]) => ({
    label,
    share: Math.max(6, Math.round((count / total) * 100)),
    color: vectorColor(label),
  }))
}
const vectorTitle = (period) => periodVectors(period).map(([label, count]) => `${label} ${count}`).join(' · ')
const elapsedLabel = (value, now) => {
  const start = Date.parse(value || '')
  if (!Number.isFinite(start)) return '—'
  const seconds = Math.max(0, Math.round((now - start) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`
  return `${Math.floor(hours / 24)}d`
}
const attackDuration = (period) => {
  const start = Date.parse(period?.startedAt || '')
  const end = period?.status === 'ongoing' ? nowMs.value : Date.parse(period?.endedAt || '')
  if (!Number.isFinite(start) || !Number.isFinite(end)) return '—'
  return elapsedLabel(period.startedAt, end)
}
const formatAttackDay = (value) => {
  const date = new Date(value || '')
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date(nowMs.value)
  if (date.toDateString() === today.toDateString()) return ''
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
const noticeLabel = (event) => {
  const raw = String(event?.attackType || event?.title || '')
  if (/CONNECTION_LIMIT/i.test(raw)) return 'TCP connection limit reached'
  return event?.title || raw.replace(/^EVENT_/, '').replace(/_/g, ' ').toLowerCase()
}
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

const bandwidthServers = ref([])
const bandwidthRefreshMs = 60 * 1000
const trafficRefreshMs = 60 * 1000
/** Cap chart points so ApexCharts stays responsive on long ranges. */

let nicRxChartInstance = null
let nicTxChartInstance = null
let l7RxChartInstance = null
let l7TxChartInstance = null
let combinedChartInstance = null
let deliveryChartInstance = null
let requestResponseChartInstance = null
let statusCodeChartInstance = null
let bandwidthTimer = null
let attackTimer = null
const attackRefreshMs = 10000
let clockTimer = null
let trafficTimer = null
let layoutResizeObserver = null
let resizeRaf = 0
let loadGeneration = 0
let filterReloadTimer = 0

const rangePillOptions = sharedTimeRanges
const initialTimeRange = readSharedTimeRange()

const bandwidthRange = ref(initialTimeRange)
const requestRange = ref(initialTimeRange)
const statusRange = ref(initialTimeRange)

const bandwidthRangeLabel = computed(() =>
  rangePillOptions.find((o) => o.value === bandwidthRange.value)?.label || bandwidthRange.value,
)

const serverOptions = computed(() => [
  { label: 'All edges', value: 'all' },
  ...bandwidthServers.value.map((server) => ({ label: server.label, value: String(server.id) })),
])

const siteOptions = computed(() => {
  let list = sitesList.value
  if (selectedEdge.value !== 'all') {
    const edgeId = Number(selectedEdge.value)
    list = list.filter(
      (site) =>
        Array.isArray(site.serverIds) && site.serverIds.some((id) => Number(id) === edgeId),
    )
  }
  return [
    { label: 'All sites', value: 'all' },
    ...list.map((site) => ({
      label: site.domain || `Site ${site.id}`,
      value: String(site.id),
    })),
  ]
})

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
  const sites = dashboardStats.value.totalSites
  return `${total} edge nodes · ${active} online · ${sites} sites · updated ${updatedAtLabel.value}`
})

const healthyEdges = computed(() =>
  serversList.value.filter((server) => edgeHealthClass(server) === 'ok').length,
)

const edgeHealthPercent = computed(() => {
  const total = serversList.value.length || dashboardStats.value.totalServers || 0
  if (!total) return 0
  const healthy = serversList.value.length
    ? healthyEdges.value
    : dashboardStats.value.activeServers
  return Math.min(100, Math.round((healthy / total) * 100))
})

const fleetHealthTone = computed(() => {
  const pct = edgeHealthPercent.value
  if (pct >= 80) return 'ok'
  if (pct >= 50) return 'warn'
  return 'danger'
})

const fleetHealthTitle = computed(() => {
  const pct = edgeHealthPercent.value
  if (!dashboardStats.value.totalServers) return 'No edges deployed'
  if (pct >= 80) return 'Network operating normally'
  if (pct >= 50) return 'Network needs attention'
  return 'Network degraded'
})

const fleetHealthDetail = computed(() => {
  if (!dashboardStats.value.totalServers) {
    return 'Add edge nodes to start serving and protecting sites through Dorian.'
  }
  return `${formatNumber(healthyEdges.value)} of ${formatNumber(serversList.value.length || dashboardStats.value.totalServers)} edges are healthy. Live traffic and defense metrics below reflect the selected scope.`
})

const threatsThisMonth = computed(
  () =>
    (Number(dashboardStats.value.l4AttacksThisMonth) || 0) +
    (Number(dashboardStats.value.l7ThreatsThisMonth) || 0),
)

const threatDelta = (current, previous) => {
  const c = Number(current) || 0
  const p = Number(previous) || 0
  if (p <= 0) {
    if (c <= 0) return { label: 'vs last mo', tone: 'flat' }
    return { label: 'new', tone: 'up' }
  }
  const pct = Math.round(((c - p) / p) * 100)
  if (pct === 0) return { label: '0% MoM', tone: 'flat' }
  return {
    label: `${pct > 0 ? '+' : ''}${pct}% MoM`,
    tone: pct > 0 ? 'up' : 'down',
  }
}

const threatPanels = computed(() => {
  const stats = dashboardStats.value
  return [
    {
      id: 'l4-now',
      label: 'L4 attacks',
      value: stats.l4AttacksThisMonth,
      hint: 'this month',
      tone: 'l4',
      delta: threatDelta(stats.l4AttacksThisMonth, stats.l4AttacksPreviousMonth),
      to: { name: 'layer4-attack-analytics' },
    },
    {
      id: 'l4-prev',
      label: 'L4 previous',
      value: stats.l4AttacksPreviousMonth,
      hint: 'last month',
      tone: 'l4',
      delta: null,
      to: { name: 'layer4-attack-analytics' },
    },
    {
      id: 'l7-now',
      label: 'L7 threats',
      value: stats.l7ThreatsThisMonth,
      hint: 'this month',
      tone: 'l7',
      delta: threatDelta(stats.l7ThreatsThisMonth, stats.l7ThreatsPreviousMonth),
      to: { name: 'security-analytics-detail' },
    },
    {
      id: 'l7-prev',
      label: 'L7 previous',
      value: stats.l7ThreatsPreviousMonth,
      hint: 'last month',
      tone: 'l7',
      delta: null,
      to: { name: 'security-analytics-detail' },
    },
    {
      id: 'blocked',
      label: 'Blocked IPs',
      value: stats.blockedIps,
      hint: 'active blocks',
      tone: 'danger',
      delta: null,
      to: { name: 'server-blacklist' },
    },
  ]
})

const threatsAreQuiet = computed(() =>
  threatPanels.value.every((panel) => !Number(panel.value)),
)

const liveEgressKbps = computed(() =>
  sitesList.value.reduce((sum, site) => sum + (Number(site.currentBandwidth) || 0), 0),
)

const fleetCacheTotals = computed(() => {
  let hit = 0
  let miss = 0
  let bypass = 0
  for (const site of sitesList.value) {
    hit += Number(site.cacheHitCount) || 0
    miss += Number(site.cacheMissCount) || 0
    bypass += Number(site.cacheBypassCount) || 0
  }
  return { hit, miss, bypass }
})

const fleetCacheHitRatio = computed(() => {
  const { hit, miss } = fleetCacheTotals.value
  const denom = hit + miss
  if (denom > 0) return hit / denom
  // Fall back to averaging site ratios when counters are still empty.
  const withRatio = sitesList.value.filter((site) => Number(site.cacheRatio) > 0)
  if (!withRatio.length) return 0
  const sum = withRatio.reduce((acc, site) => acc + Number(site.cacheRatio || 0), 0)
  return sum / withRatio.length
})

const fleetCacheHitHint = computed(() => {
  const { hit, miss, bypass } = fleetCacheTotals.value
  if (hit + miss + bypass <= 0) return 'latest site samples'
  return `${formatNumber(hit)} hit · ${formatNumber(miss)} miss`
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
      if (point.y == null) return
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

const nicRxMeta = ref({})
const nicTxMeta = ref({})
const NIC_STALE_MS = 15 * 60 * 1000

const buildNicSummary = (meta) => {
  const servers = serversForCharts.value.filter((server) =>
    selectedEdge.value === 'all' || String(server.id) === String(selectedEdge.value),
  )
  const rows = servers.map((server) => {
    const entry = meta[server.id]
    const fresh = entry?.latestAt != null && nowMs.value - entry.latestAt < NIC_STALE_MS
    return {
      id: server.id,
      label: server.label,
      color: server.color,
      hidden: hiddenServers.value.has(server.id),
      now: fresh ? entry.latest : null,
      latestAt: entry?.latestAt ?? null,
      points: entry?.points || [],
    }
  })
  const visible = rows.filter((row) => !row.hidden)
  const totals = new Map()
  visible.forEach((row) => {
    row.points.forEach((point) => {
      const slot = totals.get(point.x) || { avg: 0, peak: 0 }
      slot.avg += point.y
      slot.peak += point.peak
      totals.set(point.x, slot)
    })
  })
  const slots = Array.from(totals.values())
  const avg = slots.length ? slots.reduce((sum, slot) => sum + slot.avg, 0) / slots.length : null
  const peak = slots.length ? Math.max(...slots.map((slot) => slot.peak)) : null
  const live = visible.filter((row) => row.now != null)
  const now = live.length ? live.reduce((sum, row) => sum + row.now, 0) : null
  const asOf = live.length ? Math.max(...live.map((row) => row.latestAt)) : null
  return {
    now,
    avg,
    peak,
    asOf,
    rows: rows.map((row) => ({
      ...row,
      share: now && row.now != null && !row.hidden ? Math.round((row.now / now) * 100) : 0,
    })),
  }
}

const nicRxSummary = computed(() => buildNicSummary(nicRxMeta.value))
const nicTxSummary = computed(() => buildNicSummary(nicTxMeta.value))

const nicAsOfLabel = (summary) => {
  if (summary.asOf == null) return 'no recent samples'
  const lag = Math.max(0, Math.round((nowMs.value - summary.asOf) / 60000))
  const clock = new Date(summary.asOf).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  return lag <= 1 ? `minute ${clock}` : `minute ${clock} · ${lag} min ago`
}

const formatNicValue = (value) => (value == null ? '—' : formatBandwidthValue(value))

const l7BandwidthSeries = computed(() => [
  { name: 'Egress', data: sumSeriesPoints(bandwidthL7TxSeries.value) },
  { name: 'Ingress', data: sumSeriesPoints(bandwidthL7RxSeries.value) },
])

const fleetEdgeRows = computed(() => {
  const list = selectedEdge.value === 'all'
    ? serversList.value
    : serversList.value.filter((server) => String(server.id) === String(selectedEdge.value))
  return list.slice(0, 8)
})

const statusBreakdown = computed(() => {
  const totals = { '2xx success': 0, '3xx redirect': 0, '4xx client error': 0, '5xx server error': 0 }
  const keys = ['2xx success', '3xx redirect', '4xx client error', '5xx server error']
  const seriesKeys = ['2xx', '3xx', '4xx', '5xx']
  seriesKeys.forEach((name, index) => {
    const data = statusCodeSeries.value.find((s) => s.name === name)?.data || []
    totals[keys[index]] = data.reduce((sum, p) => sum + (Number(p.y) || 0), 0)
  })
  const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1
  const tones = ['ok', 'info', 'warn', 'danger']
  const points = Math.max(1, ...seriesKeys.map((name) => (statusCodeSeries.value.find((s) => s.name === name)?.data || []).length))
  return keys.map((label, index) => ({
    code: seriesKeys[index],
    label: label.replace(/^\dxx /, ''),
    percent: Math.round((totals[label] / grand) * 1000) / 10,
    perMinute: totals[label] / points,
    tone: tones[index],
  }))
})

const statusHasTraffic = computed(() => statusBreakdown.value.some((row) => row.percent > 0))

const trafficSummary = computed(() => {
  const requests = (requestResponseSeries.value[0]?.data || []).filter((p) => p.y != null)
  const values = requests.map((p) => Number(p.y) || 0)
  return {
    avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    peak: values.length ? Math.max(...values) : null,
    lastAt: requests.length ? requests[requests.length - 1].x : null,
  }
})

const formatPerMinute = (value) => {
  const n = Number(value)
  if (value == null || !Number.isFinite(n)) return '—'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  if (n > 0 && n < 10) return n.toFixed(n < 1 ? 2 : 1).replace(/\.?0+$/, '')
  return String(Math.round(n))
}

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

const topSiteRows = computed(() => {
  const list = (Array.isArray(topDomainRows.value) ? topDomainRows.value : []).slice(0, 6)
  const total = list.reduce((sum, row) => sum + (Number(row.count) || 0), 0) || 1
  const sitesByDomain = new Map(
    sitesList.value.map((site) => [String(site.domain || '').toLowerCase(), site]),
  )
  return list.map((row) => {
    const domain = row.domain || 'Unknown'
    const site = sitesByDomain.get(String(domain).toLowerCase())
    const ratio = Number(site?.cacheRatio)
    return {
      label: domain,
      count: Number(row.count) || 0,
      percent: Math.round(((Number(row.count) || 0) / total) * 100),
      siteId: site?.id,
      cacheLabel: Number.isFinite(ratio) && ratio > 0 ? formatCacheRatio(ratio) : '',
    }
  })
})

const formatCacheRatio = (value) => {
  const ratio = Number(value)
  if (!Number.isFinite(ratio) || ratio < 0) return '0%'
  const pct = ratio <= 1 ? ratio * 100 : ratio
  return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`
}

const goToEdgeSettings = (server) => {
  if (!server?.id) return
  void router.push({ name: 'server-settings', query: { server: String(server.id) } })
}

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
}

const formatBitRate = (bytesPerSec) => {
  const bytes = Number(bytesPerSec)
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  const bits = bytes * 8
  if (bits >= 1_000_000_000) return `${(bits / 1_000_000_000).toFixed(2)} Gbps`
  if (bits >= 1_000_000) return `${(bits / 1_000_000).toFixed(1)} Mbps`
  if (bits >= 1_000) return `${(bits / 1_000).toFixed(1)} Kbps`
  return `${Math.round(bits)} bps`
}

const formatEdgeEgress = (server) => {
  const metric = edgeMetrics.value[server?.id]
  if (!metric || metric.loading) return '…'
  return formatBitRate(metric.netTxBytesPerSec)
}

// Stored bandwidth is the edge's bits/s divided by 1024; display it in decimal
// units so it reads the same as the edge monitor.
const formatBandwidthValue = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 Kbps'
  const bits = numeric * 1024
  if (bits >= 1e9) return `${(bits / 1e9).toFixed(2)} Gbps`
  if (bits >= 1e6) return `${(bits / 1e6).toFixed(1)} Mbps`
  return `${Math.round(bits / 1e3)} Kbps`
}

const formatLogTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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

  const results = await Promise.all(
    list.map(async (server) => {
      try {
        const payload = await fetchServerHostMetrics(server.id)
        return [server.id, {
          loading: false,
          cpuPercent: payload?.cpuPercent == null ? null : Number(payload.cpuPercent),
          netTxBytesPerSec: Number(payload?.netTxBytesPerSec) || 0,
          netRxBytesPerSec: Number(payload?.netRxBytesPerSec) || 0,
        }]
      } catch {
        return [server.id, { loading: false, cpuPercent: null }]
      }
    }),
  )

  const merged = { ...edgeMetrics.value }
  results.forEach(([id, metric]) => {
    merged[id] = metric
  })
  edgeMetrics.value = merged
}

const setRange = (value) => {
  bandwidthRange.value = value
  requestRange.value = value
  statusRange.value = value
  writeSharedTimeRange(value)
}

const getBandwidthRangeMs = (value) => rangeDurationMs(value)

const createEmptyBandwidthSeries = () =>
  serversForCharts.value.map((server) => ({ name: server.label, data: [] }))

// A missing stretch longer than this many buckets is drawn as a gap.
const BANDWIDTH_GAP_BUCKETS = 2

const withGaps = (points, bucketMs) => {
  const out = []
  points.forEach((point, index) => {
    const prev = points[index - 1]
    if (prev && point.x - prev.x > bucketMs * BANDWIDTH_GAP_BUCKETS) {
      out.push({ x: prev.x + bucketMs, y: null })
    }
    out.push(point)
  })
  return out
}

const mapPayloadToSeries = (payload, meta = null) => {
  const seriesMap = new Map()
  if (Array.isArray(payload)) {
    payload.forEach((entry) => {
      seriesMap.set(Number(entry?.serverId), entry)
    })
  }
  return serversForCharts.value.map((server) => {
    const entry = seriesMap.get(server.id)
    const bucketMs = (Number(entry?.bucketSeconds) || 60) * 1000
    const points = (Array.isArray(entry?.points) ? entry.points : [])
      .map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: Number(point.bandwidth ?? 0),
        peak: Number(point.peak ?? point.bandwidth ?? 0),
      }))
      .filter((point) => !Number.isNaN(point.x))
      .sort((a, b) => a.x - b.x)
    if (meta) {
      const latestAt = entry?.latest ? new Date(entry.latest.timestamp).getTime() : NaN
      meta[server.id] = {
        bucketMs,
        latestAt: Number.isNaN(latestAt) ? null : latestAt,
        latest: entry?.latest ? Number(entry.latest.bandwidth) || 0 : null,
        points,
      }
    }
    return { name: server.label, data: withGaps(points.map(({ x, y }) => ({ x, y })), bucketMs) }
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
    const payload = await fetchSecurityEvents(30)
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
      color: linePalette()[index % linePalette().length],
    }))
    bandwidthNicRxSeries.value = createEmptyBandwidthSeries()
    bandwidthNicTxSeries.value = createEmptyBandwidthSeries()
    bandwidthL7RxSeries.value = createEmptyBandwidthSeries()
    bandwidthL7TxSeries.value = createEmptyBandwidthSeries()
    hiddenServers.value = new Set()
    destroyBandwidthCharts()
    createBandwidthCharts()
    createCombinedChart()
    createDeliveryChart()
  } catch (error) {
    serversList.value = []
    bandwidthServers.value = []
  }
}

const destroyBandwidthCharts = () => {
  ;[nicRxChartInstance, nicTxChartInstance, l7RxChartInstance, l7TxChartInstance, combinedChartInstance, deliveryChartInstance].forEach((inst) => {
    if (inst) inst.destroy()
  })
  nicRxChartInstance = null
  nicTxChartInstance = null
  l7RxChartInstance = null
  l7TxChartInstance = null
  combinedChartInstance = null
  deliveryChartInstance = null
}

const defaultLineOptions = (height = 280, colors = null) => {
  const now = Date.now()
  const rangeMs = getBandwidthRangeMs(bandwidthRange.value)
  const startMs = now - rangeMs
  const endMs = now
  const base = getApexBaseChartOptions()
  const strokeFill = productionStrokeFill()
  return {
    ...base,
    chart: {
      ...base.chart,
      type: 'line',
      height,
      width: '100%',
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
    },
    ...strokeFill,
    colors: colors || linePalette(),
    xaxis: getApexDatetimeXaxis(startMs, endMs, { tickCount: 6, fontSize: '10px' }),
    annotations: getApexTimeRangeAnnotations(startMs, endMs),
    yaxis: {
      min: 0,
      labels: { style: getApexAxisLabelStyle('10px') },
    },
    legend: { show: false },
    grid: {
      ...base.grid,
      strokeDashArray: 4,
      borderColor: getApexBaseChartOptions().grid.borderColor,
    },
    tooltip: {
      ...base.tooltip,
      x: {
        formatter: (val) =>
          new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      },
    },
  }
}

const MINI_BANDWIDTH_CHART_HEIGHT = 210
const NIC_CHART_HEIGHT = 190

const windowXaxis = (startMs, endMs) => ({
  ...getApexDatetimeXaxis(startMs, endMs, { tickCount: 6, fontSize: '10px' }),
  min: startMs,
  max: endMs,
})

const createBandwidthCharts = () => {
  if (!bandwidthServers.value.length) return
  const now = Date.now()
  const startMs = now - getBandwidthRangeMs(bandwidthRange.value)
  const opts = (h) => ({
    ...defaultLineOptions(h),
    colors: bandwidthServers.value.map((s) => s.color),
    yaxis: { ...defaultLineOptions(h).yaxis, labels: { formatter: (v) => formatBandwidthValue(v), style: getApexAxisLabelStyle('10px') } },
    tooltip: {
      theme: 'dark',
      x: {
        formatter: (val) =>
          new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      },
      y: { formatter: (v) => formatBandwidthValue(v) },
    },
  })
  const pad = (series) => padSeriesToTimeRange(series, startMs, now)
  const nicOpts = () => {
    const base = getApexBaseChartOptions()
    return {
      ...opts(NIC_CHART_HEIGHT),
      chart: { ...opts(NIC_CHART_HEIGHT).chart, type: 'area' },
      stroke: { curve: 'smooth', width: 1.6 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 0, opacityFrom: 0.28, opacityTo: 0.02, stops: [0, 95] } },
      markers: { size: 0, hover: { size: 3 } },
      dataLabels: { enabled: false },
      legend: { show: false },
      xaxis: windowXaxis(startMs, now),
      annotations: {},
      tooltip: {
        ...base.tooltip,
        shared: true,
        x: { formatter: (val) => new Date(val).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) },
        y: { formatter: (v) => (v == null ? '—' : formatBandwidthValue(v)) },
      },
    }
  }
  if (bandwidthNicRxChart.value) {
    nicRxChartInstance = new ApexCharts(bandwidthNicRxChart.value, { ...nicOpts(), series: bandwidthNicRxSeries.value })
    nicRxChartInstance.render()
  }
  if (bandwidthNicTxChart.value) {
    nicTxChartInstance = new ApexCharts(bandwidthNicTxChart.value, { ...nicOpts(), series: bandwidthNicTxSeries.value })
    nicTxChartInstance.render()
  }
  if (bandwidthL7RxChart.value) {
    l7RxChartInstance = new ApexCharts(bandwidthL7RxChart.value, { ...opts(MINI_BANDWIDTH_CHART_HEIGHT), series: pad(bandwidthL7RxSeries.value) })
    l7RxChartInstance.render()
  }
  if (bandwidthL7TxChart.value) {
    l7TxChartInstance = new ApexCharts(bandwidthL7TxChart.value, { ...opts(MINI_BANDWIDTH_CHART_HEIGHT), series: pad(bandwidthL7TxSeries.value) })
    l7TxChartInstance.render()
  }
}

const createCombinedChart = () => {
  if (!bandwidthCombinedChart.value) return
  const now = Date.now()
  const startMs = now - getBandwidthRangeMs(bandwidthRange.value)
  combinedChartInstance = new ApexCharts(bandwidthCombinedChart.value, {
    ...defaultLineOptions(240, [seriesColors().viper, seriesColors().l4]),
    series: padSeriesToTimeRange(combinedBandwidthSeries.value, startMs, now),
    yaxis: {
      ...defaultLineOptions(240).yaxis,
      labels: { formatter: (v) => formatBandwidthValue(v), style: getApexAxisLabelStyle('10px') },
    },
    tooltip: {
      theme: 'dark',
      x: {
        formatter: (val) =>
          new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      },
      y: { formatter: (v) => formatBandwidthValue(v) },
    },
  })
  combinedChartInstance.render()
}

const createDeliveryChart = () => {
  if (!bandwidthDeliveryChart.value) return
  if (deliveryChartInstance) {
    deliveryChartInstance.destroy()
    deliveryChartInstance = null
  }
  const now = Date.now()
  const startMs = now - getBandwidthRangeMs(bandwidthRange.value)
  const endMs = now
  deliveryChartInstance = new ApexCharts(bandwidthDeliveryChart.value, {
    ...defaultLineOptions(240, [seriesColors().viper, seriesColors().viperSoft]),
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '11px',
      labels: { colors: getApexAxisLabelStyle('11px').colors },
    },
    xaxis: getApexDatetimeXaxis(startMs, endMs, { tickCount: 6, fontSize: '10px' }),
    annotations: getApexTimeRangeAnnotations(startMs, endMs),
    series: padSeriesToTimeRange(l7BandwidthSeries.value, startMs, endMs),
    yaxis: {
      ...defaultLineOptions(240).yaxis,
      labels: { formatter: (v) => formatBandwidthValue(v), style: getApexAxisLabelStyle('10px') },
    },
    tooltip: {
      theme: 'dark',
      x: {
        formatter: (val) =>
          new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      },
      y: { formatter: (v) => formatBandwidthValue(v) },
    },
  })
  deliveryChartInstance.render()
}

const createRequestResponseChart = () => {
  if (!requestResponseChart.value) return
  const now = Date.now()
  const startMs = now - getBandwidthRangeMs(requestRange.value)
  const endMs = now
  const base = defaultLineOptions(248, [seriesColors().viper, seriesColors().l4])
  requestResponseChartInstance = new ApexCharts(requestResponseChart.value, {
    ...base,
    chart: { ...base.chart, type: 'area' },
    stroke: { curve: 'smooth', width: [1.8, 1.4], dashArray: [0, 4] },
    fill: { type: 'gradient', gradient: { shadeIntensity: 0, opacityFrom: [0.26, 0.06], opacityTo: [0.02, 0], stops: [0, 95] } },
    markers: { size: 0, hover: { size: 3 } },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: windowXaxis(startMs, endMs),
    annotations: {},
    series: requestResponseSeries.value,
    yaxis: {
      ...base.yaxis,
      labels: { formatter: (v) => formatPerMinute(v), style: getApexAxisLabelStyle('10px') },
    },
    tooltip: {
      ...getApexBaseChartOptions().tooltip,
      shared: true,
      x: { formatter: (val) => new Date(val).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) },
      y: { formatter: (v) => (v == null ? '—' : `${formatPerMinute(v)} / min`) },
    },
  })
  requestResponseChartInstance.render()
}

const createStatusCodeChart = () => {
  if (!statusCodeChart.value) return
  const now = Date.now()
  const startMs = now - getBandwidthRangeMs(statusRange.value)
  const endMs = now
  statusCodeChartInstance = new ApexCharts(statusCodeChart.value, {
    ...defaultLineOptions(240, getApexStatusPalette()),
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '11px',
      labels: { colors: getApexAxisLabelStyle('11px').colors },
    },
    xaxis: getApexDatetimeXaxis(startMs, endMs, { tickCount: 6, fontSize: '10px' }),
    annotations: getApexTimeRangeAnnotations(startMs, endMs),
    series: padSeriesToTimeRange(statusCodeSeries.value, startMs, endMs),
    tooltip: {
      theme: 'dark',
      x: {
        formatter: (val) =>
          new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      },
    },
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
    const siteFilter = selectedSite.value
    const [payloadNicRx, payloadNicTx, payloadL7Rx, payloadL7Tx] = await Promise.all([
      fetchBandwidthNicRxSeries(bandwidthRange.value, serverFilter, siteFilter),
      fetchBandwidthNicTxSeries(bandwidthRange.value, serverFilter, siteFilter),
      fetchBandwidthL7RxSeries(bandwidthRange.value, serverFilter, siteFilter),
      fetchBandwidthL7TxSeries(bandwidthRange.value, serverFilter, siteFilter),
    ])
    const rxMeta = {}
    const txMeta = {}
    bandwidthNicRxSeries.value = mapPayloadToSeries(payloadNicRx, rxMeta)
    bandwidthNicTxSeries.value = mapPayloadToSeries(payloadNicTx, txMeta)
    nicRxMeta.value = rxMeta
    nicTxMeta.value = txMeta
    bandwidthL7RxSeries.value = mapPayloadToSeries(payloadL7Rx)
    bandwidthL7TxSeries.value = mapPayloadToSeries(payloadL7Tx)

    const now = Date.now()
    const rangeMs = getBandwidthRangeMs(bandwidthRange.value)
    const startMs = now - rangeMs
    const endMs = now
    const rangeOpts = {
      xaxis: getApexDatetimeXaxis(startMs, endMs, { tickCount: 6, fontSize: '10px' }),
      annotations: getApexTimeRangeAnnotations(startMs, endMs),
    }
    const pad = (series) => padSeriesToTimeRange(series, startMs, endMs)

    const nicRangeOpts = { xaxis: windowXaxis(startMs, endMs) }
    if (nicRxChartInstance) { nicRxChartInstance.updateSeries(bandwidthNicRxSeries.value, false); nicRxChartInstance.updateOptions(nicRangeOpts, false, false); applyHidden(nicRxChartInstance) }
    if (nicTxChartInstance) { nicTxChartInstance.updateSeries(bandwidthNicTxSeries.value, false); nicTxChartInstance.updateOptions(nicRangeOpts, false, false); applyHidden(nicTxChartInstance) }
    if (l7RxChartInstance) { l7RxChartInstance.updateSeries(pad(bandwidthL7RxSeries.value), false); l7RxChartInstance.updateOptions(rangeOpts, false, false); applyHidden(l7RxChartInstance) }
    if (l7TxChartInstance) { l7TxChartInstance.updateSeries(pad(bandwidthL7TxSeries.value), false); l7TxChartInstance.updateOptions(rangeOpts, false, false); applyHidden(l7TxChartInstance) }
    if (combinedChartInstance) { combinedChartInstance.updateSeries(pad(combinedBandwidthSeries.value), false); combinedChartInstance.updateOptions(rangeOpts, false, false) }
    if (!deliveryChartInstance) createDeliveryChart()
    if (deliveryChartInstance) { deliveryChartInstance.updateSeries(pad(l7BandwidthSeries.value), false); deliveryChartInstance.updateOptions(rangeOpts, false, false) }
  } catch (error) {
    console.error('Failed to load bandwidth series', error)
  }
}

const loadRequestResponseSeries = async () => {
  try {
    const payload = await fetchRequestResponseSeries(requestRange.value, selectedEdge.value, selectedSite.value)
    const points = Array.isArray(payload) ? payload : []
    const mapped = points
      .map((p) => ({ x: new Date(p.timestamp).getTime(), request: Number(p.requestCount ?? 0), response: Number(p.responseCount ?? 0) }))
      .filter((p) => !Number.isNaN(p.x))
    requestResponseSeries.value = [
      { name: 'Requests', data: mapped.map((p) => ({ x: p.x, y: p.request })) },
      { name: 'Responses', data: mapped.map((p) => ({ x: p.x, y: p.response })) },
    ]
    if (requestResponseChartInstance) {
      const now = Date.now()
      const startMs = now - getBandwidthRangeMs(requestRange.value)
      requestResponseChartInstance.updateSeries(requestResponseSeries.value, false)
      requestResponseChartInstance.updateOptions({ xaxis: windowXaxis(startMs, now) }, false, false)
    }
  } catch (error) {
    requestResponseSeries.value = [{ name: 'Requests', data: [] }, { name: 'Responses', data: [] }]
  }
}

const loadStatusCodeSeries = async () => {
  try {
    const payload = await fetchStatusCodeSeries(statusRange.value, selectedEdge.value, selectedSite.value)
    const points = Array.isArray(payload) ? payload : []
    const mapped = points
      .map((p) => ({
        x: new Date(p.timestamp).getTime(),
        success: Number(p.success ?? 0),
        redirect: Number(p.redirect ?? 0),
        client: Number(p.client ?? 0),
        server: Number(p.server ?? 0),
      }))
      .filter((p) => !Number.isNaN(p.x))
    statusCodeSeries.value = [
      { name: '2xx', data: mapped.map((p) => ({ x: p.x, y: p.success })) },
      { name: '3xx', data: mapped.map((p) => ({ x: p.x, y: p.redirect })) },
      { name: '4xx', data: mapped.map((p) => ({ x: p.x, y: p.client })) },
      { name: '5xx', data: mapped.map((p) => ({ x: p.x, y: p.server })) },
    ]
    if (statusCodeChartInstance) {
      const now = Date.now()
      const startMs = now - getBandwidthRangeMs(statusRange.value)
      statusCodeChartInstance.updateSeries(
        padSeriesToTimeRange(statusCodeSeries.value, startMs, now),
        false,
      )
      statusCodeChartInstance.updateOptions({
        xaxis: getApexDatetimeXaxis(startMs, now, { tickCount: 6, fontSize: '10px' }),
        annotations: getApexTimeRangeAnnotations(startMs, now),
      }, false, false)
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

const loadChartSeries = async () => {
  const generation = ++loadGeneration
  await Promise.all([
    loadBandwidthSeries(),
    loadRequestResponseSeries(),
    loadStatusCodeSeries(),
    loadTopTrafficPanels(),
    loadEdgeMetrics(serversList.value),
  ])
  if (generation !== loadGeneration) return
  updatedAt.value = new Date()
}

const refreshDashboard = async () => {
  const generation = ++loadGeneration
  isRefreshing.value = true
  try {
    // Phase 1: shell metrics + server list (paint hero quickly)
    await Promise.all([
      loadDashboardSummary(),
      loadSecurityEvents(),
      loadSites(),
      loadBandwidthServers(),
    ])
    if (generation !== loadGeneration) return

    // Phase 2: heavy series (once servers exist — avoids the old double-fetch)
    await Promise.all([
      loadBandwidthSeries(),
      loadRequestResponseSeries(),
      loadStatusCodeSeries(),
      loadTopTrafficPanels(),
      loadEdgeMetrics(serversList.value),
    ])
    if (generation !== loadGeneration) return
    updatedAt.value = new Date()
  } finally {
    if (generation === loadGeneration) isRefreshing.value = false
  }
}

const refreshChartTheme = () => {
  const patch = getApexThemePatch()
  ;[nicRxChartInstance, nicTxChartInstance, l7RxChartInstance, l7TxChartInstance, combinedChartInstance, deliveryChartInstance, requestResponseChartInstance, statusCodeChartInstance].forEach((chart) => {
    if (chart) chart.updateOptions(patch, false, false)
  })
}

const scheduleFilterReload = () => {
  if (filterReloadTimer) window.clearTimeout(filterReloadTimer)
  filterReloadTimer = window.setTimeout(() => {
    filterReloadTimer = 0
    void loadChartSeries()
  }, 120)
}

const runIfVisible = (fn) => {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  fn()
}

let heroChartHeight = 248

const fitHeroChart = () => {
  const wrap = requestResponseChart.value?.parentElement
  if (!wrap || !requestResponseChartInstance) return
  const next = Math.round(wrap.clientHeight)
  if (next < 180 || Math.abs(next - heroChartHeight) < 8) return
  heroChartHeight = next
  requestResponseChartInstance.updateOptions({ chart: { height: next } }, false, false)
}

const resizeCharts = () => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = 0
    ;[nicRxChartInstance, nicTxChartInstance, l7RxChartInstance, l7TxChartInstance, combinedChartInstance, deliveryChartInstance, requestResponseChartInstance, statusCodeChartInstance].forEach((c) => c?.resize?.())
    fitHeroChart()
  })
}

onMounted(() => {
  window.addEventListener('cdnproxy-theme-change', refreshChartTheme)
  createRequestResponseChart()
  createStatusCodeChart()
  requestAnimationFrame(() => requestAnimationFrame(fitHeroChart))
  void refreshDashboard()

  bandwidthTimer = window.setInterval(() => {
    runIfVisible(() => {
      if (bandwidthServers.value.length) void loadBandwidthSeries()
    })
  }, bandwidthRefreshMs)
  attackTimer = window.setInterval(() => {
    runIfVisible(() => void loadSecurityEvents())
  }, attackRefreshMs)
  clockTimer = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
  trafficTimer = window.setInterval(() => {
    runIfVisible(() => {
      void loadRequestResponseSeries()
      void loadStatusCodeSeries()
    })
  }, trafficRefreshMs)

  if (typeof window !== 'undefined' && 'ResizeObserver' in window && dashboardRoot.value) {
    layoutResizeObserver = new ResizeObserver(resizeCharts)
    layoutResizeObserver.observe(dashboardRoot.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('cdnproxy-theme-change', refreshChartTheme)
  loadGeneration += 1
  if (bandwidthTimer) window.clearInterval(bandwidthTimer)
  if (trafficTimer) window.clearInterval(trafficTimer)
  if (attackTimer) window.clearInterval(attackTimer)
  if (clockTimer) window.clearInterval(clockTimer)
  if (filterReloadTimer) window.clearTimeout(filterReloadTimer)
  if (resizeRaf) cancelAnimationFrame(resizeRaf)
  destroyBandwidthCharts()
  if (requestResponseChartInstance) requestResponseChartInstance.destroy()
  if (statusCodeChartInstance) statusCodeChartInstance.destroy()
  if (layoutResizeObserver && dashboardRoot.value) layoutResizeObserver.disconnect()
})

watch(bandwidthRange, scheduleFilterReload)
watch(selectedEdge, () => {
  if (selectedSite.value !== 'all') {
    const stillValid = siteOptions.value.some((option) => option.value === selectedSite.value)
    if (!stillValid) selectedSite.value = 'all'
  }
  scheduleFilterReload()
})
watch(selectedSite, scheduleFilterReload)
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  margin-bottom: 0;
}

.dash-kicker {
  margin: 0 0 4px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
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
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.dash-quiet {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  padding: 10px 2px;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.dash-quiet p {
  margin: 0;
}

.dash-side {
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.dash-side .dash-panel {
  flex: 1;
}

.dash-quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.dash-quick-link {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 550;
  text-decoration: none;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.dash-quick-link:hover,
.dash-quick-link.router-link-active {
  color: var(--dorian-viper-400, var(--app-accent));
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 40%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 10%, var(--app-surface));
}

.dash-attacks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
}

.dash-attacks.live {
  border-color: color-mix(in srgb, var(--dorian-danger, #e15241) 55%, var(--app-border));
  background:
    radial-gradient(ellipse at 0% 0%, color-mix(in srgb, var(--dorian-danger, #e15241) 14%, transparent) 0%, transparent 60%),
    var(--app-surface);
}

.dash-attacks__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.dash-attacks__head h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: var(--type-section-title);
  font-weight: 600;
  color: var(--app-heading);
}

.dash-attacks__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dorian-viper-400, var(--app-accent));
}

.dash-attacks__dot.live {
  background: var(--dorian-danger, #e15241);
  animation: dash-attack-pulse 1.6s ease-out infinite;
}

.dash-attacks__stats {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--app-text-muted);
}

.dash-attacks__stats b {
  color: var(--app-heading);
  font-weight: 650;
}

.dash-attacks__live {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dash-live-attack {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 18px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--dorian-danger, #e15241) 45%, var(--app-border));
  border-radius: 10px;
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 10%, var(--app-surface-muted));
  color: var(--app-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dash-live-attack:hover {
  border-color: var(--dorian-danger, #e15241);
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 15%, var(--app-surface-muted));
}

.dash-live-attack__badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 22%, transparent);
  color: var(--dorian-danger, #e15241);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.dash-live-attack__badge i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: dash-attack-pulse 1.6s ease-out infinite;
}

.dash-live-attack__main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.dash-live-attack__main strong {
  color: var(--app-heading);
  font-size: 16px;
  font-weight: 650;
}

.dash-live-attack__main span,
.dash-live-attack__metric span {
  color: var(--app-text-muted);
  font-size: 12px;
}

.dash-live-attack__metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.dash-live-attack__metric b {
  color: var(--app-heading);
  font-size: 20px;
  font-weight: 650;
  line-height: 1.1;
}

.dash-live-attack__open {
  padding: 7px 12px;
  border-radius: 8px;
  background: var(--dorian-danger, #e15241);
  color: #fff;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}

.dash-attacks__calm {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  font-size: 12.5px;
}

.dash-attacks__calm strong {
  color: var(--app-heading);
  font-weight: 600;
}

.dash-attacks__calm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 50%;
  background: color-mix(in srgb, var(--dorian-viper-500, #2e9e6c) 18%, transparent);
  color: var(--dorian-viper-400, var(--app-accent));
}

.dash-attacks__calm-icon svg {
  width: 13px;
  height: 13px;
}

.dash-attack-list {
  display: flex;
  flex-direction: column;
}

.dash-attack-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 0.7fr) minmax(0, 0.6fr) minmax(90px, 0.9fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 6px 10px;
  border: 0;
  border-bottom: 0.5px solid var(--app-border);
  background: transparent;
  color: var(--app-text);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

button.dash-attack-row:hover {
  background: var(--app-surface-hover);
}

.dash-attack-row--head {
  min-height: 0;
  padding-top: 0;
  padding-bottom: 8px;
  color: var(--app-text-muted);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: default;
}

.dash-attack-status {
  justify-self: start;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 650;
}

.dash-attack-status.live {
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 18%, transparent);
  color: var(--dorian-danger, #e15241);
}

.dash-attack-status.ended {
  background: color-mix(in srgb, var(--dorian-viper-500, #2e9e6c) 14%, transparent);
  color: var(--dorian-viper-400, var(--app-accent));
}

.dash-attack-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dash-attack-name strong {
  overflow: hidden;
  color: var(--app-heading);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dash-attack-name span,
.dash-attack-dim {
  color: var(--app-text-muted);
  font-size: 12px;
}

.dash-attack-vectors {
  display: flex;
  gap: 2px;
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--app-border);
}

.dash-notices {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
}

.dash-notices__label {
  color: var(--app-text-muted);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dash-notice {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border: 0.5px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-muted);
  color: var(--app-text-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.dash-notice:hover {
  border-color: color-mix(in srgb, var(--dorian-warn, #e0a83f) 45%, var(--app-border));
}

@keyframes dash-attack-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dorian-danger, #e15241) 55%, transparent); }
  70% { box-shadow: 0 0 0 7px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

@media (max-width: 900px) {
  .dash-live-attack { grid-template-columns: auto minmax(0, 1fr); }
  .dash-live-attack__metric { align-items: flex-start; }
  .dash-attack-row { grid-template-columns: 88px minmax(0, 1fr) minmax(0, 0.8fr); }
  .dash-attack-row > :nth-child(n + 4) { display: none; }
}

.dash-command {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(0, 2.2fr);
  gap: 14px;
  align-items: stretch;
  padding: 14px 16px;
  border-radius: 12px;
  border: 0.5px solid var(--app-border);
  background:
    radial-gradient(ellipse at 0% 0%, rgba(46, 158, 108, 0.12) 0%, transparent 55%),
    var(--app-surface);
}

.dash-command__health {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.dash-hero__ring {
  --health: 0%;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at center, var(--app-surface) 58%, transparent 59%),
    conic-gradient(var(--ring-color, var(--dorian-viper-500, #2e9e6c)) var(--health), var(--app-border) 0);
}

.dash-hero__ring.ok { --ring-color: var(--dorian-viper-500, #2e9e6c); }
.dash-hero__ring.warn { --ring-color: var(--dorian-warn, #e0a83f); }
.dash-hero__ring.danger { --ring-color: var(--dorian-danger, #e15241); }

.dash-hero__ring-value {
  font-size: 17px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1;
}

.dash-hero__ring-label {
  margin-top: 2px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.dash-hero__copy h3 {
  margin: 0 0 4px;
  font-size: var(--type-section-title);
  font-weight: 600;
  color: var(--app-heading);
}

.dash-hero__copy p {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--app-text-muted);
}

.dash-kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.dash-kpi {
  --kpi-tone: var(--app-border);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 11px 12px 11px 14px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
  min-width: 0;
  overflow: hidden;
}

.dash-kpi::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 2px;
  border-radius: 2px;
  background: var(--kpi-tone);
}

.dash-kpi.tone-signal { --kpi-tone: var(--dorian-viper-400, var(--app-accent)); }
.dash-kpi.tone-l4 { --kpi-tone: var(--dorian-l4, #6b9fd4); }
.dash-kpi.tone-l7 { --kpi-tone: var(--dorian-l7, #9b8cff); }
.dash-kpi.tone-warn { --kpi-tone: var(--dorian-warn, #e0a83f); }

a.dash-kpi {
  display: block;
  color: inherit;
  text-decoration: none;
}

a.dash-kpi:hover {
  border-color: color-mix(in srgb, var(--dorian-warn, #e0a83f) 45%, var(--app-border));
}

.dash-kpi__label {
  display: block;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  margin-bottom: 4px;
}

.dash-kpi__value {
  display: block;
  font-size: 18px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.1;
}

.dash-kpi__value small {
  font-size: 11px;
  font-weight: 500;
  color: var(--app-text-muted);
}

.dash-kpi__value.signal { color: var(--dorian-viper-400, var(--app-accent)); }
.dash-kpi__value.warn { color: var(--dorian-warn, #e0a83f); }

.dash-kpi__hint {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: var(--app-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-threat-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dash-threat-row__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.dash-threat-row__head h3 {
  margin: 0;
  font-size: var(--type-caption);
  font-weight: 500;
  color: var(--app-text-muted);
}

.dash-threat-row__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dash-threat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.dash-threat-tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 14px 12px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  text-decoration: none;
  color: inherit;
  min-width: 0;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dash-threat-tile--link:hover {
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 35%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 6%, var(--app-surface));
}

.dash-threat-tile.tone-l4 { border-top: 2px solid #6b9fd4; }
.dash-threat-tile.tone-l7 { border-top: 2px solid #8fa3b8; }
.dash-threat-tile.tone-danger { border-top: 2px solid #d95b4e; }

.dash-threat-tile__label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.dash-threat-tile__value {
  font-size: 24px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1;
}

.dash-threat-tile__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.dash-threat-tile__hint {
  font-size: 11px;
  color: var(--app-text-muted);
}

.dash-threat-tile__delta {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.dash-threat-tile__delta.up { color: var(--dorian-danger, #e15241); }
.dash-threat-tile__delta.down { color: var(--dorian-viper-400, var(--app-accent)); }
.dash-threat-tile__delta.flat { color: var(--app-text-muted); }

.dash-chart-wrap--ops {
  flex: 1 1 auto;
  min-height: 220px;
}

.dash-chart-wrap--nic {
  min-height: 0;
}

.dash-chart-wrap--detect {
  height: auto;
  min-height: 0;
}

.dash-bar-row--tight {
  margin-bottom: 8px;
}

.dash-mini-charts--row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
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

.dash-grid12 {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.dash-ops {
  align-items: stretch;
}

.c-3 { grid-column: span 3; }
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
  min-width: 0;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.dash-panel--hero-chart {
  height: 100%;
  background:
    linear-gradient(180deg, rgba(46, 158, 108, 0.04) 0%, transparent 42%),
    var(--app-surface);
}

.dash-count-tag--live {
  color: var(--dorian-viper-400, var(--app-accent));
}

.dash-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
  flex-wrap: wrap;
}

.dash-panel-head__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.dash-traffic-counts {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dash-traffic-count {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.dash-traffic-swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  align-self: center;
  flex: none;
}

.dash-traffic-swatch.req { background: #3fbd85; }
.dash-traffic-swatch.resp { background: #6b9fd4; }

.dash-traffic-count__label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.dash-traffic-count__value {
  font-size: 14px;
  font-weight: 650;
  color: var(--app-heading);
}

.dash-panel-link,
.dash-inline-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--dorian-viper-400, var(--app-accent));
  text-decoration: none;
  white-space: nowrap;
}

.dash-panel-link:hover,
.dash-inline-link:hover {
  text-decoration: underline;
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

.dash-readout-value.signal { color: var(--dorian-viper-400, var(--app-accent)); }
.dash-readout-value.l4 { color: #6b9fd4; }

.dash-chart-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
  overflow: hidden;
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
  max-width: 100%;
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
  background: #6b9fd4;
}

.dash-bar-fill.ok { background: var(--dorian-viper-500, #2e9e6c); }
.dash-bar-fill.info { background: #6b9fd4; }
.dash-bar-fill.warn2 { background: #d4a24a; }
.dash-bar-fill.danger2,
.dash-bar-fill.danger { background: #d95b4e; }
.dash-bar-fill.l4 { background: #6b9fd4; }
.dash-bar-fill.l7 { background: #8fa3b8; }

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

.node-dot.ok { background: var(--dorian-viper-500, #2e9e6c); }
.node-dot.warn { background: var(--dorian-warn, #e0a83f); }
.node-dot.danger { background: var(--dorian-danger, #e15241); }

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

.dash-rank-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.dash-cache-chip {
  font-size: 11px;
  font-weight: 650;
  color: var(--dorian-viper-400, var(--app-accent));
}

a.dash-bar-row--link {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 6px;
  margin: 0 -4px;
  padding: 2px 4px;
  transition: background 0.15s ease;
}

a.dash-bar-row--link:hover {
  background: color-mix(in srgb, var(--app-accent) 8%, transparent);
}

.dash-table-row--link {
  cursor: pointer;
}

.dash-table-row--link:hover td {
  background: color-mix(in srgb, var(--app-accent) 6%, transparent);
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

.dash-traffic-panel,
.dash-status-panel,
.dash-sites-panel {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--panel-tone) 6%, transparent) 0%, transparent 34%),
    var(--app-surface);
}

.dash-traffic-panel { --panel-tone: var(--dorian-viper-400, var(--app-accent)); }
.dash-status-panel { --panel-tone: var(--dorian-l4, #6b9fd4); }
.dash-sites-panel { --panel-tone: var(--dorian-l7, #8fa3b8); }

.dash-traffic-panel .dash-panel-head h3,
.dash-status-panel .dash-panel-head h3,
.dash-sites-panel .dash-panel-head h3 {
  color: var(--app-heading);
  font-weight: 600;
}

.dash-traffic-panel .dash-panel-head,
.dash-status-panel .dash-panel-head,
.dash-sites-panel .dash-panel-head {
  margin-bottom: 10px;
}

.dash-panel-icon {
  --icon-tone: var(--app-accent);
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: inline-grid;
  place-items: center;
  color: var(--icon-tone);
  background: color-mix(in srgb, var(--icon-tone) 14%, transparent);
}

.dash-panel-icon.signal { --icon-tone: var(--dorian-viper-400, var(--app-accent)); }
.dash-panel-icon.l4 { --icon-tone: var(--dorian-l4, #6b9fd4); }
.dash-panel-icon.l7 { --icon-tone: var(--dorian-l7, #8fa3b8); }

.dash-panel-icon svg {
  width: 12px;
  height: 12px;
}

.dash-panel-hint {
  font-size: var(--type-small, 11px);
  font-weight: 400;
  color: var(--app-text-muted);
}

.dash-readout-strip {
  display: grid;
  grid-template-columns: 1.2fr repeat(3, minmax(0, 1fr));
  border: 0.5px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-muted);
  margin-bottom: 8px;
}

.dash-readout-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 12px;
  min-width: 0;
}

.dash-readout-cell + .dash-readout-cell {
  border-left: 0.5px solid var(--app-border);
}

.dash-readout-cell__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.dash-readout-cell__label .sw {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.dash-readout-cell__label .sw.req { background: var(--dorian-viper-400, var(--app-accent)); }

.dash-readout-cell__label .sw.resp {
  background: transparent;
  border: 1.5px dashed var(--dorian-l4, #6b9fd4);
}

.dash-readout-cell__value {
  font-size: 16px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.15;
  white-space: nowrap;
}

.dash-readout-cell.lead .dash-readout-cell__value {
  font-size: 20px;
  color: var(--dorian-viper-400, var(--app-accent));
}

.dash-readout-cell__value small,
.dash-status-rate small {
  margin-left: 2px;
  font-size: 10.5px;
  font-weight: 500;
  color: var(--app-text-muted);
}

.dash-status-stack {
  display: flex;
  gap: 2px;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 10px;
  background: var(--app-border);
}

.dash-status-stack span {
  flex-basis: 0;
  min-width: 3px;
}

.dash-status-stack .empty { flex-grow: 1; background: var(--app-border); }

.dash-status-stack .ok,
.dash-status-code.ok { --status-tone: var(--dorian-success, #4fbd7a); }
.dash-status-stack .info,
.dash-status-code.info { --status-tone: var(--dorian-l4, #6b9fd4); }
.dash-status-stack .warn,
.dash-status-code.warn { --status-tone: var(--dorian-warn, #d4a24a); }
.dash-status-stack .danger,
.dash-status-code.danger { --status-tone: var(--dorian-danger, #d95b4e); }

.dash-status-stack span:not(.empty) {
  background: var(--status-tone);
}

.dash-status-rows {
  display: flex;
  flex-direction: column;
}

.dash-status-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto 48px;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  font-size: 12px;
}

.dash-status-row + .dash-status-row {
  border-top: 0.5px solid var(--app-border);
}

.dash-status-row.quiet {
  opacity: 0.55;
}

.dash-status-code {
  justify-self: start;
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 650;
  color: var(--status-tone);
  background: color-mix(in srgb, var(--status-tone) 14%, transparent);
}

.dash-status-label {
  color: var(--app-text);
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-status-rate {
  color: var(--app-text-muted);
  white-space: nowrap;
}

.dash-status-pct {
  text-align: right;
  font-weight: 650;
  color: var(--app-heading);
}

.dash-site-row {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 7px 6px;
  margin: 0 -6px;
  border-radius: 7px;
  color: inherit;
  text-decoration: none;
  transition: background 0.15s ease;
}

.dash-site-row + .dash-site-row {
  margin-top: 2px;
}

.dash-site-row:hover {
  background: var(--app-surface-muted);
}

.dash-site-row:focus-visible {
  outline: 2px solid var(--app-accent);
  outline-offset: 1px;
}

.dash-site-rank {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 10.5px;
  font-weight: 650;
  color: var(--app-text-muted);
  background: var(--app-surface-muted);
  border: 0.5px solid var(--app-border);
}

.dash-site-row:first-of-type .dash-site-rank {
  color: var(--dorian-viper-400, var(--app-accent));
  border-color: color-mix(in srgb, var(--dorian-viper-400, var(--app-accent)) 40%, var(--app-border));
}

.dash-site-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.dash-site-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.dash-site-name {
  font-size: 12.5px;
  color: var(--app-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-site-count {
  font-size: 11px;
  color: var(--app-text-muted);
  white-space: nowrap;
}

.dash-site-bar {
  height: 4px;
  border-radius: 2px;
  background: var(--app-border);
  overflow: hidden;
}

.dash-site-bar span {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--dorian-viper-500, #2e9e6c);
}

.dash-site-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 52px;
}

.dash-site-pct {
  font-size: 12px;
  font-weight: 650;
  color: var(--app-heading);
}

.dash-site-cache {
  font-size: 10px;
  color: var(--dorian-viper-400, var(--app-accent));
  white-space: nowrap;
}

.dash-nic-panel {
  gap: 0;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--nic-tone) 7%, transparent) 0%, transparent 38%),
    var(--app-surface);
}

.dash-nic-panel.rx { --nic-tone: var(--dorian-viper-400, var(--app-accent)); }
.dash-nic-panel.tx { --nic-tone: var(--dorian-l4, #6b9fd4); }

.dash-nic-panel .dash-panel-head {
  margin-bottom: 10px;
}

.dash-nic-panel .dash-panel-head h3 {
  color: var(--app-heading);
  font-weight: 600;
}

.dash-nic-dir {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  display: inline-grid;
  place-items: center;
  color: var(--nic-tone);
  background: color-mix(in srgb, var(--nic-tone) 14%, transparent);
}

.dash-nic-dir svg {
  width: 12px;
  height: 12px;
}

.dash-nic-hint {
  font-size: var(--type-small, 11px);
  font-weight: 400;
  color: var(--app-text-muted);
}

.dash-nic-readouts {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr;
  border: 0.5px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-muted);
  margin-bottom: 8px;
}

.dash-nic-readout {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 12px;
  min-width: 0;
}

.dash-nic-readout + .dash-nic-readout {
  border-left: 0.5px solid var(--app-border);
}

.dash-nic-readout__label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.dash-nic-readout__value {
  font-size: 16px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.15;
  white-space: nowrap;
}

.dash-nic-readout.now .dash-nic-readout__value {
  font-size: 20px;
  color: var(--nic-tone);
}

.dash-nic-readout__hint {
  font-size: 11px;
  color: var(--app-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-nic-edges {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
  margin-top: 6px;
}

.dash-nic-edge {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 56px auto;
  align-items: center;
  gap: 8px;
  padding: 6px 9px;
  border-radius: 7px;
  border: 0.5px solid var(--app-border);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}

.dash-nic-edge:hover {
  background: var(--app-surface-muted);
}

.dash-nic-edge:focus-visible {
  outline: 2px solid var(--app-accent);
  outline-offset: 1px;
}

.dash-nic-edge.off {
  opacity: 0.45;
}

.dash-nic-edge__swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.dash-nic-edge__name {
  font-size: 12px;
  color: var(--app-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-nic-edge__bar {
  height: 4px;
  border-radius: 2px;
  background: var(--app-border);
  overflow: hidden;
}

.dash-nic-edge__bar span {
  display: block;
  height: 100%;
  border-radius: 2px;
}

.dash-nic-edge__value {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-heading);
  white-space: nowrap;
}

@media (max-width: 1300px) {
  .c-3, .c-4, .c-5, .c-6, .c-7, .c-8, .c-12, .dash-side {
    grid-column: span 12;
  }

  .dash-nic > .dash-nic-panel {
    grid-column: span 6;
  }

  .dash-command {
    grid-template-columns: 1fr;
  }

  .dash-kpi-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dash-threat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dash-mini-charts--row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1000px) {
  .dash-nic > .dash-nic-panel {
    grid-column: span 12;
  }
}

@media (max-width: 760px) {
  .dash-readout-strip {
    grid-template-columns: 1fr 1fr;
  }

  .dash-readout-cell:nth-child(3) {
    border-left: 0;
  }

  .dash-readout-cell:nth-child(n + 3) {
    border-top: 0.5px solid var(--app-border);
  }

  .dash-nic-readouts {
    grid-template-columns: 1fr 1fr;
  }

  .dash-nic-readout.now {
    grid-column: span 2;
  }

  .dash-nic-readout + .dash-nic-readout {
    border-left: 0;
    border-top: 0.5px solid var(--app-border);
  }

  .dash-filter-summary {
    margin-left: 0;
    width: 100%;
  }

  .dash-kpi-strip,
  .dash-threat-grid,
  .dash-mini-charts,
  .dash-mini-charts--row {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dash-live-dot,
  .dash-attacks__dot.live,
  .dash-live-attack__badge i {
    animation: none;
  }
}
</style>
