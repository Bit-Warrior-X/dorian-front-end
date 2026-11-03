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
      <div class="dash-panel c-12 detect-timeline-panel">
        <div class="dash-panel-head">
          <div>
            <h3>Attack timeline</h3>
            <p class="dash-panel-desc">
              Every L4 and L7 attack window across {{ rangeLabel }}
              · click a bar to open Attack Console
            </p>
          </div>
          <div class="detect-timeline-stats" aria-label="Attack counts in range">
            <span class="detect-timeline-stat detect-timeline-stat--l4">
              <b class="num">{{ formatNumber(l4EventRows.length) }}</b> L4
            </span>
            <span class="detect-timeline-stat detect-timeline-stat--l7">
              <b class="num">{{ formatNumber(l7EventRows.length) }}</b> L7
            </span>
            <span v-if="timelineLiveCount" class="detect-timeline-stat detect-timeline-stat--live">
              <b class="num">{{ formatNumber(timelineLiveCount) }}</b> live
            </span>
          </div>
        </div>

        <div class="detect-timeline" :class="{ empty: !timelineHasAttacks }">
          <div class="detect-timeline__axis" aria-hidden="true">
            <span
              v-for="tick in timelineTicks"
              :key="`${tick.ms}-${tick.edge ? 'e' : ''}${tick.dayBoundary ? 'd' : ''}`"
              class="detect-timeline__tick"
              :class="{ edge: tick.edge, day: tick.dayBoundary }"
              :style="{ left: `${tick.pct}%` }"
            >
              <i></i>
              <em>
                <span v-if="tick.day" class="detect-timeline__tick-day">{{ tick.day }}</span>
                <span class="detect-timeline__tick-time">{{ tick.time }}</span>
              </em>
            </span>
          </div>

          <div
            v-for="lane in timelineLanes"
            :key="lane.id"
            class="detect-timeline__lane"
            :data-lane="lane.id"
            :style="{ '--lane-rows': lane.rows }"
          >
            <div class="detect-timeline__lane-label">
              <strong>{{ lane.id }}</strong>
              <span>{{ formatNumber(lane.bars.length) }}</span>
            </div>
            <div class="detect-timeline__track">
              <span
                v-for="mark in timelineTicks"
                :key="`${lane.id}-${mark.ms}-${mark.dayBoundary ? 'd' : 't'}`"
                class="detect-timeline__gridline"
                :class="{ day: mark.dayBoundary, edge: mark.edge }"
                :style="{ left: `${mark.pct}%` }"
              ></span>
              <p v-if="!lane.bars.length" class="detect-timeline__quiet">No {{ lane.id }} attacks</p>
              <button
                v-for="bar in lane.bars"
                :key="bar.key"
                type="button"
                class="detect-timeline__bar"
                :class="{ live: bar.live, compact: bar.compact }"
                :style="{
                  left: `${bar.left}%`,
                  width: `${bar.width}%`,
                  top: `calc(${bar.row} * (var(--bar-h) + var(--bar-gap)) + var(--track-pad))`,
                }"
                :aria-label="bar.ariaLabel"
                @mouseenter="showTimelineTip($event, bar)"
                @mousemove="moveTimelineTip($event)"
                @mouseleave="hideTimelineTip"
                @focus="showTimelineTip($event, bar)"
                @blur="hideTimelineTip"
                @click="openSecurityEvent(bar.event)"
              >
                <span class="detect-timeline__bar-fill"></span>
                <span class="detect-timeline__bar-label">
                  <b>{{ bar.shortLabel }}</b>
                  <em v-if="!bar.compact">{{ bar.when }}</em>
                </span>
              </button>
            </div>
          </div>

          <div class="detect-timeline__footer">
            <span>{{ timelineWindowLabel }}</span>
            <span class="detect-timeline-legend" aria-hidden="true">
              <span class="detect-timeline-legend__item detect-timeline-legend__item--l4">L4 flood</span>
              <span class="detect-timeline-legend__item detect-timeline-legend__item--l7">L7 attack</span>
              <span class="detect-timeline-legend__item detect-timeline-legend__item--live">Ongoing</span>
            </span>
          </div>
        </div>

        <Teleport to="body">
          <div
            v-if="timelineTip.visible && timelineTip.bar"
            class="detect-timeline-tip"
            :class="[`detect-timeline-tip--${timelineTip.bar.lane.toLowerCase()}`, { live: timelineTip.bar.live }]"
            :style="{ left: `${timelineTip.x}px`, top: `${timelineTip.y}px` }"
            role="tooltip"
          >
            <div class="detect-timeline-tip__head">
              <span class="detect-timeline-tip__layer">{{ timelineTip.bar.lane }}</span>
              <span v-if="timelineTip.bar.live" class="detect-timeline-tip__live">Live</span>
            </div>
            <strong class="detect-timeline-tip__title">{{ timelineTip.bar.label }}</strong>
            <dl class="detect-timeline-tip__meta">
              <div>
                <dt>Started</dt>
                <dd class="num detect-timeline-tip__time">{{ timelineTip.bar.startedLabel }}</dd>
              </div>
              <div>
                <dt>{{ timelineTip.bar.live ? 'Status' : 'Ended' }}</dt>
                <dd class="num detect-timeline-tip__time">{{ timelineTip.bar.live ? 'Ongoing' : timelineTip.bar.endedLabel }}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd class="num">{{ timelineTip.bar.durationLabel }}</dd>
              </div>
              <div v-if="timelineTip.bar.serverName">
                <dt>Edge</dt>
                <dd>{{ timelineTip.bar.serverName }}</dd>
              </div>
              <div v-if="timelineTip.bar.sources">
                <dt>Sources</dt>
                <dd class="num">{{ formatNumber(timelineTip.bar.sources) }}</dd>
              </div>
            </dl>
            <span class="detect-timeline-tip__hint">Click to open Attack Console</span>
          </div>
        </Teleport>
      </div>
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
          <h3>L7 attack periods</h3>
          <span class="dash-count-tag">{{ formatNumber(l7EventRows.length) }} total</span>
        </div>
        <p v-if="!l7EventRows.length" class="dash-empty">No L7 attack periods{{ selectedEdge === 'all' ? '' : ' on this edge' }} in {{ rangeLabel }}.</p>
        <div v-else class="dash-log dash-log--full">
          <button
            v-for="event in l7EventRows"
            :key="event.id || event.reqId"
            type="button"
            class="dash-log-line"
            @click="openSecurityEvent(event)"
          >
            <span class="dash-log-time">{{ formatLogTime(event.startedAt || event.createdAt) }}</span>
            <span class="dash-log-tag l7">{{ event.status === 'ongoing' ? 'LIVE' : 'L7' }}</span>
            <span class="dash-log-msg">
              <span>{{ l7AttackLabel(event) }}<span v-if="event.serverName" class="dash-log-edge"> · {{ event.serverName }}</span></span>
              <span class="dash-log-detail">
                <template v-if="event.description">{{ event.description }}</template>
                <template v-else-if="event.ipCount">{{ formatNumber(event.ipCount) }} sources</template>
              </span>
            </span>
          </button>
        </div>
      </div>
    </section>
    <SecurityEventDialog :event="selectedSecurityEvent" @close="selectedSecurityEvent = null" />

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
const l7EventRows = computed(() => securityEvents.value.filter((event) => {
  if (eventTag(event) !== 'L7' || !eventInRange(event)) return false
  if (appliedFilters.value.server === 'all') return true
  return String(event.serverId ?? '') === String(appliedFilters.value.server)
}))
const l7AttackLabel = (event) => {
  const raw = String(event?.attackType || event?.title || '').trim()
  if (!raw) return 'L7 attack'
  if (/l7/i.test(raw) && /attack/i.test(raw)) return raw
  return raw.toLowerCase().includes('attack') ? raw : `${raw} attack`
}

const formatLogTime = (value) => {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  if (date.toDateString() === new Date().toDateString()) return time
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

const timelineHasAttacks = computed(() => l4EventRows.value.length > 0 || l7EventRows.value.length > 0)
const timelineLiveCount = computed(() =>
  [...l4EventRows.value, ...l7EventRows.value].filter((event) => event?.status === 'ongoing').length,
)

const attackPeriodBounds = (event, startMs, endMs) => {
  const started = new Date(event?.startedAt || event?.createdAt).getTime()
  let ended = event?.status === 'ongoing'
    ? Date.now()
    : new Date(event?.endedAt || event?.startedAt || event?.createdAt).getTime()
  if (!Number.isFinite(started)) return null
  if (!Number.isFinite(ended) || ended < started) ended = started
  // Keep true times for labels; clip only for bar geometry.
  if (ended <= startMs || started >= endMs) return null
  const from = Math.max(started, startMs)
  const to = Math.min(Math.max(ended, from + 1), endMs)
  return { from, to, started, ended }
}

const pctInRange = (ms, startMs, endMs) => {
  const span = Math.max(1, endMs - startMs)
  return Math.min(100, Math.max(0, ((ms - startMs) / span) * 100))
}

const formatTimelineStamp = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const formatTimelineDuration = (started, ended, live) => {
  const start = Number(started)
  const end = live ? Date.now() : Number(ended)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return '—'
  const seconds = Math.max(0, Math.round((end - start) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

const formatTimelineWhen = (started, ended, live) => {
  const startLabel = formatLogTime(started)
  if (live) return `${startLabel} → now`
  return `${startLabel} → ${formatLogTime(ended)}`
}

const assignLaneRows = (items) => {
  const rowEnds = []
  return items.map((item) => {
    let row = rowEnds.findIndex((end) => end <= item.from)
    if (row < 0) {
      row = rowEnds.length
      rowEnds.push(item.to)
    } else {
      rowEnds[row] = item.to
    }
    return { ...item, row }
  })
}

const buildLaneBars = (rows, lane, startMs, endMs) => {
  const span = Math.max(1, endMs - startMs)
  // Short bursts stay visible without distorting long attacks.
  const minWidthPct = Math.min(1.6, Math.max(0.55, (90_000 / span) * 100))
  const prepared = rows
    .map((event) => {
      const bounds = attackPeriodBounds(event, startMs, endMs)
      if (!bounds) return null
      const left = pctInRange(bounds.from, startMs, endMs)
      let width = pctInRange(bounds.to, startMs, endMs) - left
      if (width < minWidthPct) width = Math.min(100 - left, minWidthPct)
      const live = event?.status === 'ongoing'
      const label = lane === 'L7'
        ? l7AttackLabel(event)
        : l4AttackLabel(event?.attackType || event?.title || 'L4 attack')
      const when = formatTimelineWhen(bounds.started, bounds.ended, live)
      const startedLabel = formatTimelineStamp(bounds.started)
      const endedLabel = formatTimelineStamp(bounds.ended)
      const durationLabel = formatTimelineDuration(bounds.started, bounds.ended, live)
      const serverName = event?.serverName || ''
      const sources = Number(event?.ipCount) || 0
      const compact = width < 7
      return {
        key: `${lane}-${event.reqId || event.id || bounds.from}`,
        event,
        lane,
        label,
        serverName,
        sources,
        from: bounds.from,
        to: bounds.from + (width / 100) * span,
        left,
        width,
        live,
        compact,
        shortLabel: live ? 'LIVE' : (width >= 12 ? label : lane),
        when,
        startedLabel,
        endedLabel,
        durationLabel,
        ariaLabel: `${lane} ${label}${serverName ? ` on ${serverName}` : ''}, ${startedLabel} to ${live ? 'now' : endedLabel}`,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.from - b.from || a.to - b.to)

  return assignLaneRows(prepared)
}

const formatTimelineAxisDay = (ms) => {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

const formatTimelineAxisTime = (ms, withSeconds = false) => {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  })
}

const timelineTicks = computed(() => {
  const { start: startMs, end: endMs } = resolveRangeWindow()
  const span = Math.max(1, endMs - startMs)
  const multiDay = span > 20 * 60 * 60 * 1000
  const minGap = span * (multiDay ? 0.045 : 0.035)
  const byMs = new Map()

  const upsert = (rawMs, flags = {}) => {
    const ms = Math.round(Math.min(endMs, Math.max(startMs, rawMs)))
    const prev = byMs.get(ms) || { ms, edge: false, dayBoundary: false }
    byMs.set(ms, {
      ...prev,
      edge: prev.edge || Boolean(flags.edge),
      dayBoundary: prev.dayBoundary || Boolean(flags.dayBoundary),
    })
  }

  upsert(startMs, { edge: true })
  upsert(endMs, { edge: true })

  if (multiDay) {
    const startDate = new Date(startMs)
    let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, 0, 0, 0, 0)
    while (cursor.getTime() < endMs) {
      upsert(cursor.getTime(), { dayBoundary: true })
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 0, 0, 0, 0)
    }
  }

  const targetCount = multiDay
    ? Math.min(10, Math.max(6, Math.ceil(span / (24 * 60 * 60 * 1000)) + 2))
    : span <= 6 * 60 * 60 * 1000
      ? 7
      : 8
  for (let i = 1; i < targetCount - 1; i += 1) {
    upsert(startMs + (span * i) / (targetCount - 1))
  }

  const ranked = [...byMs.values()].sort((a, b) => a.ms - b.ms)
  const kept = []
  ranked.forEach((tick) => {
    const near = kept.find((item) => Math.abs(item.ms - tick.ms) < minGap)
    if (!near) {
      kept.push({ ...tick })
      return
    }
    // Prefer edges and day boundaries over filler ticks.
    const score = (item) => (item.edge ? 3 : 0) + (item.dayBoundary ? 2 : 0)
    if (score(tick) > score(near)) {
      near.ms = tick.ms
      near.edge = near.edge || tick.edge
      near.dayBoundary = near.dayBoundary || tick.dayBoundary
    } else {
      near.edge = near.edge || tick.edge
      near.dayBoundary = near.dayBoundary || tick.dayBoundary
    }
  })

  const withSeconds = span <= 3 * 60 * 60 * 1000
  return kept
    .sort((a, b) => a.ms - b.ms)
    .map((tick) => {
      const showDay = multiDay || tick.edge
      return {
        ms: tick.ms,
        pct: pctInRange(tick.ms, startMs, endMs),
        edge: tick.edge,
        dayBoundary: tick.dayBoundary,
        day: showDay ? formatTimelineAxisDay(tick.ms) : '',
        time: formatTimelineAxisTime(tick.ms, withSeconds && !tick.dayBoundary),
      }
    })
})

const timelineWindowLabel = computed(() => {
  const { start: startMs, end: endMs } = resolveRangeWindow()
  return `${formatTimelineStamp(startMs)} → ${formatTimelineStamp(endMs)}`
})

const timelineLanes = computed(() => {
  const { start: startMs, end: endMs } = resolveRangeWindow()
  const l4Bars = buildLaneBars(l4EventRows.value, 'L4', startMs, endMs)
  const l7Bars = buildLaneBars(l7EventRows.value, 'L7', startMs, endMs)
  return [
    { id: 'L4', bars: l4Bars, rows: Math.max(1, ...l4Bars.map((bar) => bar.row + 1), 1) },
    { id: 'L7', bars: l7Bars, rows: Math.max(1, ...l7Bars.map((bar) => bar.row + 1), 1) },
  ]
})

const timelineTip = ref({
  visible: false,
  x: 0,
  y: 0,
  bar: null,
})

const placeTimelineTip = (event) => {
  const pad = 14
  const tipW = 320
  const tipH = 210
  const x = Math.min(window.innerWidth - tipW - 8, Math.max(8, event.clientX + pad))
  const y = Math.min(window.innerHeight - tipH - 8, Math.max(8, event.clientY - tipH - 8))
  timelineTip.value = {
    ...timelineTip.value,
    x,
    y,
  }
}

const showTimelineTip = (event, bar) => {
  timelineTip.value = {
    visible: true,
    x: 0,
    y: 0,
    bar,
  }
  placeTimelineTip(event)
}

const moveTimelineTip = (event) => {
  if (!timelineTip.value.visible) return
  placeTimelineTip(event)
}

const hideTimelineTip = () => {
  timelineTip.value = {
    visible: false,
    x: 0,
    y: 0,
    bar: null,
  }
}
const latestL4DropRate = computed(() => {
  const data = l4BlockedSeries.value[0]?.data || []
  if (data.length) return Number(data[data.length - 1]?.y) || 0
  return Number(l4Defense.value.blockedTraffic) || 0
})

const l4Hit = computed(() => Number(l4Defense.value.blockedTraffic) > 0 || l4EventRows.value.length > 0)
const l7Hit = computed(() => Number(l7Defense.value.blockRequestCounts) > 0 || l7EventRows.value.length > 0)

const detectionDetail = computed(() => {
  const windowLabel = rangeLabel.value
  if (l4Hit.value && l7Hit.value) return `L4 floods and L7 attacks in ${windowLabel}.`
  if (l4Hit.value) return `L4 floods in ${windowLabel}. No L7 attacks in this window.`
  if (l7Hit.value) return `L7 attacks in ${windowLabel}. No L4 floods in this window.`
  return `No L4 floods or L7 attacks in ${windowLabel}.`
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
    const [l4Summary, l4Series, l7Summary, l7Series, l4Events, l7Events, summary] = await Promise.all([
      fetchL4Summary(params),
      fetchL4Series('traffic', params),
      fetchSecuritySummary(params),
      fetchSecuritySeries('block-count', params),
      // Layer-scoped periods (not temp-block rows): same attack windows as Attack alerts.
      fetchSecurityEvents(100, params.serverId, eventRange, 'l4'),
      fetchSecurityEvents(100, params.serverId, eventRange, 'l7'),
      fetchDashboardSummary(),
    ])
    if (token !== loadToken) return
    l4Defense.value = { blockedTraffic: Number(l4Summary?.blockedTraffic ?? 0) }
    l7Defense.value = { blockRequestCounts: Number(l7Summary?.blockRequestCounts ?? 0) }
    l4BlockedSeries.value = [{ name: 'Drop rate', data: mapL4Points(l4Series) }]
    l7BlockSeries.value = [{ name: 'Refused HTTP', data: mapL7Points(l7Series) }]
    securityEvents.value = [
      ...(Array.isArray(l4Events) ? l4Events : []),
      ...(Array.isArray(l7Events) ? l7Events : []),
    ]
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
  hideTimelineTip()
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

.detect-timeline-panel {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 6%, var(--app-surface)) 0%,
      var(--app-surface) 42%
    );
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 18%, var(--app-border));
}

.detect-timeline-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detect-timeline-stat {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-height: 30px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface-muted, var(--app-surface)) 80%, transparent);
  font-size: 12px;
  color: var(--app-text-muted);
}

.detect-timeline-stat b {
  color: var(--app-text);
  font-size: 14px;
}

.detect-timeline-stat--l4 {
  border-color: color-mix(in srgb, #4A86C7 35%, var(--app-border));
  background: color-mix(in srgb, #4A86C7 12%, var(--app-surface));
}

.detect-timeline-stat--l7 {
  border-color: color-mix(in srgb, #8B6A3D 35%, var(--app-border));
  background: color-mix(in srgb, #A8894E 12%, var(--app-surface));
}

.detect-timeline-stat--live {
  border-color: color-mix(in srgb, #C94A3D 40%, var(--app-border));
  background: color-mix(in srgb, #C94A3D 14%, var(--app-surface));
  color: #C94A3D;
}

.detect-timeline {
  --lane-label-w: 64px;
  --bar-h: 28px;
  --bar-gap: 8px;
  --track-pad: 10px;
  display: grid;
  gap: 14px;
  padding: 4px 2px 2px;
}

.detect-timeline__axis {
  position: relative;
  height: 40px;
  margin-left: var(--lane-label-w);
  border-bottom: 1px solid color-mix(in srgb, var(--app-border) 80%, transparent);
}

.detect-timeline__tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: grid;
  justify-items: center;
  gap: 3px;
  color: var(--app-text-muted);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  white-space: nowrap;
  z-index: 1;
}

.detect-timeline__tick.edge,
.detect-timeline__tick.day {
  color: var(--app-text);
  font-weight: 600;
  z-index: 2;
}

.detect-timeline__tick:first-child {
  transform: translateX(0);
  justify-items: start;
}

.detect-timeline__tick:last-child {
  transform: translateX(-100%);
  justify-items: end;
}

.detect-timeline__tick i {
  width: 1px;
  height: 10px;
  background: color-mix(in srgb, var(--app-text-muted) 45%, transparent);
}

.detect-timeline__tick.day i,
.detect-timeline__tick.edge i {
  height: 14px;
  background: color-mix(in srgb, var(--app-text) 55%, transparent);
}

.detect-timeline__tick em {
  display: grid;
  gap: 1px;
  justify-items: inherit;
  font-style: normal;
  line-height: 1.15;
}

.detect-timeline__tick-day {
  font-size: 10px;
  letter-spacing: 0.01em;
}

.detect-timeline__tick-time {
  opacity: 0.82;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.detect-timeline__tick.edge .detect-timeline__tick-time,
.detect-timeline__tick.day .detect-timeline__tick-time {
  opacity: 0.95;
}

.detect-timeline__lane {
  display: grid;
  grid-template-columns: var(--lane-label-w) minmax(0, 1fr);
  gap: 10px;
  align-items: stretch;
}

.detect-timeline__lane-label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  padding-top: 2px;
}

.detect-timeline__lane-label strong {
  font-size: 13px;
  letter-spacing: 0.04em;
}

.detect-timeline__lane-label span {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  color: var(--app-text-muted);
}

.detect-timeline__lane[data-lane='L4'] .detect-timeline__lane-label strong {
  color: #4A86C7;
}

.detect-timeline__lane[data-lane='L7'] .detect-timeline__lane-label strong {
  color: #A8894E;
}

.detect-timeline__track {
  position: relative;
  min-height: calc(var(--track-pad) * 2 + var(--lane-rows) * var(--bar-h) + (var(--lane-rows) - 1) * var(--bar-gap));
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--app-border) 90%, transparent);
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--app-text) 3.5%, transparent),
      transparent 8%,
      transparent 92%,
      color-mix(in srgb, var(--app-text) 3.5%, transparent)
    ),
    color-mix(in srgb, var(--app-surface-muted, var(--app-surface)) 70%, transparent);
  overflow: hidden;
}

.detect-timeline__gridline {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: color-mix(in srgb, var(--app-border) 70%, transparent);
  pointer-events: none;
}

.detect-timeline__gridline.day,
.detect-timeline__gridline.edge {
  width: 1px;
  background: color-mix(in srgb, var(--app-text) 18%, var(--app-border));
}

.detect-timeline__gridline.day {
  background: repeating-linear-gradient(
    to bottom,
    color-mix(in srgb, var(--app-text) 28%, transparent) 0 5px,
    transparent 5px 9px
  );
}

.detect-timeline__quiet {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.detect-timeline__bar {
  position: absolute;
  height: var(--bar-h);
  margin: 0;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  color: #fff;
  box-shadow: 0 8px 18px color-mix(in srgb, #000 18%, transparent);
  transition: transform 120ms ease, filter 120ms ease;
}

.detect-timeline__bar:hover,
.detect-timeline__bar:focus-visible {
  transform: translateY(-1px) scale(1.01);
  filter: brightness(1.06);
  outline: none;
  z-index: 2;
}

.detect-timeline__bar-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #3F74B5, #5B97D6);
}

.detect-timeline__lane[data-lane='L7'] .detect-timeline__bar-fill {
  background: linear-gradient(90deg, #8F6E38, #C4A574);
}

.detect-timeline__bar.live .detect-timeline__bar-fill {
  background: linear-gradient(90deg, #A63A30, #D95B4E);
  animation: detect-live-pulse 1.6s ease-in-out infinite;
}

.detect-timeline__bar-label {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  gap: 1px;
  min-width: 0;
}

.detect-timeline__bar-label b,
.detect-timeline__bar-label em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detect-timeline__bar-label b {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.detect-timeline__bar-label em {
  font-style: normal;
  font-size: 10px;
  opacity: 0.9;
  font-variant-numeric: tabular-nums;
}

.detect-timeline__bar.compact {
  padding: 0 6px;
}

.detect-timeline__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-left: var(--lane-label-w);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  color: var(--app-text-muted);
}

.detect-timeline-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detect-timeline-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detect-timeline-legend__item::before {
  content: '';
  width: 14px;
  height: 7px;
  border-radius: 999px;
}

.detect-timeline-legend__item--l4::before {
  background: linear-gradient(90deg, #3F74B5, #5B97D6);
}

.detect-timeline-legend__item--l7::before {
  background: linear-gradient(90deg, #8F6E38, #C4A574);
}

.detect-timeline-legend__item--live::before {
  background: linear-gradient(90deg, #A63A30, #D95B4E);
}

@keyframes detect-live-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.18); }
}

.detect-timeline-tip {
  position: fixed;
  z-index: 1200;
  width: min(320px, calc(100vw - 16px));
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--app-border) 70%, #4A86C7);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, #4A86C7 14%, var(--app-surface, #111827)) 0%,
      var(--app-surface, #111827) 55%
    );
  color: var(--app-text, #f8fafc);
  box-shadow:
    0 18px 40px color-mix(in srgb, #000 42%, transparent),
    0 0 0 1px color-mix(in srgb, #fff 4%, transparent);
  pointer-events: none;
}

.detect-timeline-tip--l7 {
  border-color: color-mix(in srgb, var(--app-border) 70%, #C4A574);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, #C4A574 16%, var(--app-surface, #111827)) 0%,
      var(--app-surface, #111827) 55%
    );
}

.detect-timeline-tip.live {
  border-color: color-mix(in srgb, var(--app-border) 55%, #D95B4E);
}

.detect-timeline-tip__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.detect-timeline-tip__layer,
.detect-timeline-tip__live {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.detect-timeline-tip__layer {
  background: color-mix(in srgb, #4A86C7 22%, transparent);
  color: #8eb7e4;
}

.detect-timeline-tip--l7 .detect-timeline-tip__layer {
  background: color-mix(in srgb, #C4A574 24%, transparent);
  color: #e0c28a;
}

.detect-timeline-tip__live {
  background: color-mix(in srgb, #D95B4E 24%, transparent);
  color: #f0a39b;
}

.detect-timeline-tip__title {
  display: block;
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.3;
}

.detect-timeline-tip__meta {
  display: grid;
  gap: 8px;
  margin: 0 0 10px;
}

.detect-timeline-tip__meta > div {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.detect-timeline-tip__meta dt {
  margin: 0;
  padding-top: 1px;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted, #94a3b8);
}

.detect-timeline-tip__meta dd {
  margin: 0;
  font-size: 12px;
  color: var(--app-text, #f8fafc);
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

.detect-timeline-tip__meta dd.num,
.detect-timeline-tip__time {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
}

.detect-timeline-tip__hint {
  display: block;
  padding-top: 8px;
  border-top: 1px solid color-mix(in srgb, var(--app-border, #334155) 80%, transparent);
  font-size: 11px;
  color: var(--app-text-muted, #94a3b8);
}

@media (max-width: 720px) {
  .detect-timeline {
    --lane-label-w: 48px;
    --bar-h: 26px;
  }

  .detect-timeline__footer {
    margin-left: 0;
  }
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
