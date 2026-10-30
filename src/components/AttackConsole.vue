<template>
  <div class="attack-console-backdrop" @click.self="emit('close')">
    <section class="attack-console" role="dialog" aria-modal="true" aria-labelledby="attack-console-title">
      <header class="attack-console__header">
        <div class="attack-console__chips">
          <span class="pill" :class="{ live: ongoing }">
            <i></i>{{ ongoing ? 'Attacking' : 'Ended · mitigated' }}
          </span>
          <span class="pill layer">{{ layerChip }}</span>
          <span class="pill edge">{{ attack?.serverName || 'Edge' }}</span>
          <div class="attack-console__chips-spacer"></div>
          <button class="ghost" type="button" @click="exportReport">Export report</button>
          <button class="ghost" type="button" @click="openFullLog">Full log</button>
          <button class="icon" type="button" aria-label="Close attack view" @click="emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6L6 18"></path>
            </svg>
          </button>
        </div>

        <div class="attack-console__title-row">
          <div>
            <h2 id="attack-console-title">{{ headline }}</h2>
            <p class="mono muted">{{ subtitle }}</p>
          </div>
          <dl class="attack-console__times">
            <div>
              <dt>Started</dt>
              <dd>{{ formatClock(attack?.startedAt) || '—' }}</dd>
            </div>
            <div>
              <dt>Ended</dt>
              <dd>{{ ongoing ? '—' : (formatClock(attack?.endedAt || attack?.createdAt) || '—') }}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{{ durationLabel || '—' }}</dd>
            </div>
            <div>
              <dt>Time to block</dt>
              <dd class="warn">{{ timeToBlock }}</dd>
            </div>
          </dl>
        </div>

        <div v-if="startedMs" class="track">
          <div class="track__base"></div>
          <div class="track__warm" :style="{ width: `${blockPercent}%` }"></div>
          <div class="track__hot" :style="{ left: `${blockPercent}%` }"></div>
          <div class="track__mark start">
            <i></i>
            <span>Detected <b>{{ formatClock(attack?.startedAt) }}</b></span>
          </div>
          <div v-if="blockAt" class="track__mark mid" :style="{ left: `${blockPercent}%` }">
            <i class="hot"></i>
            <span>Block engaged <b>{{ formatClock(blockAt) }}</b></span>
          </div>
          <div class="track__mark end">
            <i :class="{ done: !ongoing }"></i>
            <span>{{ ongoing ? 'Ongoing' : 'Protection released' }} <b>{{ ongoing ? formatClock(now) : formatClock(attack?.endedAt || attack?.createdAt) }}</b></span>
          </div>
        </div>
      </header>

      <p v-if="error" class="attack-console__error">{{ error }}</p>

      <div class="attack-console__body">
        <nav class="dash-tabbar attack-console__tabs" aria-label="Attack sections" role="tablist">
          <button
            v-for="tab in attackTabs"
            :key="tab.id"
            type="button"
            role="tab"
            class="dash-tab"
            :class="{ active: activeTab === tab.id }"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
          >
            <svg class="dash-tab__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <template v-if="tab.id === 'traffic'"><path d="M3 12h4l2.5-6 5 12 2.5-6h4" /></template>
              <template v-else-if="tab.id === 'sources'"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></template>
              <template v-else><path d="M4 6h16M4 12h10M4 18h13" /></template>
            </svg>
            <span class="dash-tab__label">{{ tab.label }}</span>
          </button>
        </nav>

        <div v-show="activeTab === 'traffic'" class="attack-console__panel">
        <section class="kpis" aria-label="Summary">
          <article>
            <span>{{ isL7 ? 'Peak requests' : 'Peak ingress' }}</span>
            <p><strong>{{ peakIngress.value }}</strong><em>{{ isL7 ? 'all outcomes' : 'at the firewall' }}</em></p>
            <small v-if="peakIngress.at"><b>{{ peakIngress.dropShare }}% {{ isL7 ? 'blocked' : 'dropped' }}</b> · {{ formatClock(peakIngress.at) }}</small>
            <small v-else>No samples yet</small>
          </article>
          <article>
            <span>{{ isL7 ? 'Unique clients' : 'Sources blocked' }}</span>
            <p><strong>{{ sourceCount }}</strong><em>unique IPs</em></p>
            <small v-if="isL7">
              <b>{{ formatCount(l7BlockedIPs) }} blocked IPs</b>
              <template v-if="l7BlockedRatio != null"> · {{ Math.round(l7BlockedRatio * 100) }}% blocked</template>
            </small>
            <small v-else><b>{{ activeCount }} still active</b> · {{ Math.max(0, sourceCount - activeCount) }} released</small>
          </article>
          <article>
            <span>Attack vectors</span>
            <div v-if="vectorParts.length" class="vectors">
              <i v-for="part in vectorParts" :key="part.type" :style="{ width: part.width, background: part.color }"></i>
            </div>
            <div class="vector-legend">
              <span v-for="part in vectorParts" :key="`${part.type}-label`">
                <i :style="{ background: part.color }"></i>{{ part.type }}
                <b v-if="part.count > 0">{{ part.count }}</b>
                <em v-if="part.range" class="vector-range">{{ part.range }}</em>
              </span>
              <span v-if="!vectorParts.length">{{ primaryType }}</span>
            </div>
          </article>
          <article>
            <span>{{ isL7 ? 'Request totals' : 'Detector reports' }}</span>
            <p v-if="isL7"><strong>{{ formatCount(l7TotalRequests) }}</strong><em>{{ durationLabel ? `over ${durationLabel}` : 'requests' }}</em></p>
            <p v-else><strong>{{ attack?.eventCount ?? 0 }}</strong><em>{{ durationLabel ? `over ${durationLabel}` : 'reports' }}</em></p>
            <small>{{ modeLabel }}</small>
          </article>
        </section>

        <section class="panel">
          <header class="panel__head">
            <div>
              <h3>{{ isL7 ? 'Requests during event' : 'Traffic during event' }}</h3>
              <p>{{ chartCaption }}</p>
            </div>
            <div class="legend">
              <span><i class="sq drop"></i>{{ isL7 ? 'Blocked' : 'Dropped' }} <b>{{ droppedTotal }}</b></span>
              <span><i class="sq pass"></i>Passed <b>{{ passedTotal }}</b></span>
            </div>
          </header>
          <div ref="trafficChartEl" class="chart" role="img" :aria-label="chartCaption"></div>
          <p v-if="loaded && !hasDrops" class="empty">{{ isL7 ? 'No request timeline yet.' : 'No firewall samples yet.' }}</p>
        </section>
        </div>

        <div v-if="activeTab === 'sources'" class="attack-console__panel">
          <section class="panel sources">
            <header class="panel__head sources__head">
              <div class="sources__title">
                <h3>{{ isL7 ? 'Top clients' : 'Blocked sources' }}</h3>
                <div v-if="!isL7" class="seg" role="group" aria-label="Filter sources">
                  <button type="button" :class="{ on: srcFilter === 'active' }" @click="srcFilter = 'active'">Active {{ activeCount }}</button>
                  <button type="button" :class="{ on: srcFilter === 'all' }" @click="srcFilter = 'all'">All {{ sourceCount }}</button>
                </div>
              </div>
              <label class="search">
                <span class="sr">Search sources</span>
                <input v-model="srcQuery" type="text" placeholder="Filter by IP or prefix" />
              </label>
            </header>
            <div class="sources__cols">
              <span>Source</span>
              <span>{{ isL7 ? 'Outcome' : 'Vector' }}</span>
              <span>{{ isL7 ? 'Requests' : 'Blocked' }}</span>
              <span>Status</span>
            </div>
            <p v-if="sourcesLoading && !sources.length" class="empty">Loading sources…</p>
            <p v-else-if="loaded && !sources.length" class="empty">{{ sourcesEmptyText }}</p>
            <div
              v-else
              ref="sourcesEl"
              class="sources__list"
              @scroll.passive="onSourcesScroll"
            >
              <div v-for="source in sources" :key="source.ip" class="sources__row">
                <span class="mono">{{ source.ip }}</span>
                <span><em class="chip" :class="vectorClass(source.attackType)">{{ source.attackType || (isL7 ? 'L7' : 'L4') }}</em></span>
                <span
                  class="mono dim"
                  :title="isL7
                    ? `${formatCount(source.blocked)} blocked · ${formatCount(source.passed)} passed`
                    : (source.blocks > 1 ? `Blocked ${source.blocks} times, first at ${formatClock(source.firstBlockedAt)}` : '')"
                >
                  <template v-if="isL7">{{ formatCount(source.blocked) }} / {{ formatCount(source.requests || source.blocks) }}</template>
                  <template v-else>{{ formatClock(source.lastBlockedAt) }}</template>
                </span>
                <span class="status" :class="{ hot: source.active }">{{ isL7 ? (source.blocked > 0 ? 'Had blocks' : 'Passed') : sourceStatus(source) }}</span>
              </div>
              <p v-if="sourcesLoading" class="empty">Loading more…</p>
              <p v-else-if="sourcesHasMore" class="empty">Scroll for more</p>
            </div>
            <footer>
              <span>Showing {{ sources.length }} of {{ isL7 ? sourceCount : (srcFilter === 'active' ? `${activeCount} active` : sourceCount) }}<template v-if="srcQuery.trim()"> matching “{{ srcQuery.trim() }}”</template></span>
              <button v-if="!isL7" type="button" @click="openEdge">View all in firewall</button>
            </footer>
          </section>
        </div>

        <div v-if="activeTab === 'console'" class="attack-console__panel">
          <section ref="spartaEl" class="console">
            <header class="panel__head">
              <div>
                <h3>Sparta console</h3>
                <p class="stream" :class="{ live: ongoing }">
                  <i></i>{{ ongoing ? 'Live stream' : 'Stream closed' }} · {{ attack?.serverName || 'edge' }}<template v-if="logRangeLabel"> · {{ logRangeLabel }}</template>
                </p>
              </div>
              <div v-if="watchedCounters.length" class="watched">
                <span v-for="key in watchedCounters" :key="key">{{ key }}</span>
              </div>
            </header>
            <p v-if="spartaError && !logs.length" class="empty">{{ spartaError }}</p>
            <div
              v-else
              ref="spartaLogEl"
              class="console__log"
              @scroll.passive="onSpartaScroll"
            >
              <p v-if="spartaLoading && !logs.length" class="empty">Loading Sparta counters…</p>
              <p v-else-if="!logs.length" class="empty">{{ spartaError || (ongoing ? 'Waiting for Sparta counters…' : 'No Sparta counters in this archive.') }}</p>
              <p v-else-if="spartaLoadingOlder" class="empty">Loading earlier…</p>
              <p v-else-if="!spartaHasMore && logs.length" class="empty">Start of counters</p>
              <div v-for="(line, index) in logs" :key="`${line.time}-${index}`" class="console__row">
                <span class="mono dim">{{ formatClock(line.time) }}</span>
                <span class="counters">
                  <span v-for="counter in line.counters" :key="counter.k">
                    <b>{{ counter.k }}</b>{{ counter.v }}
                  </span>
                </span>
              </div>
            </div>
            <footer>
              <span>
                Counters shown as dropped / passed per second
                <template v-if="spartaLog.length"> · {{ spartaLog.length.toLocaleString() }}<template v-if="spartaTotal"> / {{ spartaTotal.toLocaleString() }}</template> loaded</template>
                <template v-if="spartaHasMore && logs.length"> · scroll up for earlier</template>
              </span>
              <button type="button" @click="openFullLog">Open full log</button>
            </footer>
          </section>
        </div>
      </div>

      <div
        v-if="fullLogOpen"
        class="full-log-backdrop"
        @click.self="closeFullLog"
      >
        <section class="full-log" role="dialog" aria-modal="true" aria-labelledby="full-log-title">
          <header class="full-log__head">
            <div>
              <h3 id="full-log-title">Full Sparta log</h3>
              <p class="full-log__meta mono">
                {{ attack?.serverName || 'edge' }}
                <template v-if="fullLogFileName"> · {{ fullLogFileName }}</template>
                <template v-if="fullLogTotal"> · {{ fullLogLines.length.toLocaleString() }} / {{ fullLogTotal.toLocaleString() }} lines</template>
                <template v-else-if="fullLogLines.length"> · {{ fullLogLines.length.toLocaleString() }} lines</template>
              </p>
            </div>
            <div class="full-log__actions">
              <button
                class="ghost"
                type="button"
                :disabled="fullLogDownloading || (!fullLogLines.length && !fullLogFileName)"
                @click="downloadLoadedLog"
              >
                Export loaded
              </button>
              <button
                class="ghost"
                type="button"
                :disabled="fullLogDownloading || (!fullLogFileName && !fullLogLines.length)"
                @click="downloadArchiveFile"
              >
                {{ fullLogDownloading ? 'Downloading…' : 'Download archive' }}
              </button>
              <button class="icon" type="button" aria-label="Close full log" @click="closeFullLog">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 6l12 12M18 6L6 18"></path>
                </svg>
              </button>
            </div>
          </header>
          <p v-if="fullLogError" class="full-log__error">{{ fullLogError }}</p>
          <div
            ref="fullLogEl"
            class="full-log__body"
            @scroll.passive="onFullLogScroll"
          >
            <p v-if="!fullLogLines.length && fullLogLoading" class="full-log__empty">Loading archive…</p>
            <p v-else-if="!fullLogLines.length && !fullLogLoading" class="full-log__empty">No archive file for this attack.</p>
            <div
              v-for="(line, index) in fullLogLines"
              :key="index"
              class="full-log__row"
              :class="fullLogLineClass(line.text)"
            >
              <span class="mono dim">{{ line.time ? formatClock(line.time) : '' }}</span>
              <span class="full-log__text">{{ line.text }}</span>
            </div>
            <p v-if="fullLogLines.length && fullLogLoading" class="full-log__more">Loading more…</p>
            <p v-else-if="fullLogLines.length && !fullLogHasMore" class="full-log__more">End of archive</p>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ApexCharts from 'apexcharts'
import { downloadAttackSpartaArchive, fetchAttackConsole, fetchAttackSources, fetchAttackSpartaArchive } from '@/api/dashboard'
import { notifyError, notifySuccess } from '@/utils/notify'
import { getApexChartColors, getApexSeriesColors, getApexTooltipTheme } from '@/utils/chartTheme'

const props = defineProps({
  reqId: { type: String, required: true },
})
const emit = defineEmits(['close'])
const router = useRouter()

const SAMPLE_MS = 5000
const attackTabsAll = [
  { id: 'traffic', label: 'Traffic' },
  { id: 'sources', label: 'Blocked sources' },
  { id: 'console', label: 'Sparta console' },
]
const attackTabsL7 = [
  { id: 'traffic', label: 'Requests' },
  { id: 'sources', label: 'Top clients' },
]
const L7_BUCKET_SECONDS = 10
const SOURCE_PAGE = 25
const DROP_RENDER_CAP = 720
const SPARTA_PAGE = 120
const SPARTA_MAX_LINES = 240
const COUNTER_ORDER = ['SYN', 'ACK', 'RST', 'PSH+ACK', 'STOMP', 'HANDSHAKE', 'FIN', 'UDP', 'ICMP', 'GRE']
const COUNTERS_FOR_TOKEN = {
  SYN: ['SYN'],
  ACK: ['ACK'],
  RST: ['RST'],
  STOMP: ['PSH+ACK', 'STOMP'],
  PSH: ['PSH+ACK', 'STOMP'],
  HANDSHAKE: ['HANDSHAKE'],
  SOCKET: ['FIN'],
  FIN: ['FIN'],
  UDP: ['UDP'],
  ICMP: ['ICMP'],
  GRE: ['GRE'],
}

const attack = ref(null)
const l7Incident = ref(null)
const windowRange = ref({ start: null, end: null })
const drops = ref([])
const sources = ref([])
const activeCount = ref(0)
const sourceCount = ref(0)
const clockSkew = ref(0)
const attackTypes = ref([])
const protection = ref('')
const spartaLog = ref([])
const spartaError = ref('')
const spartaLogEl = ref(null)
const spartaNext = ref(0)
const spartaHasMore = ref(true)
const spartaTotal = ref(0)
const spartaFileName = ref('')
const spartaLoading = ref(false)
const spartaLoadingOlder = ref(false)
let spartaScrollLock = false
const error = ref('')
const loaded = ref(false)
const activeTab = ref('traffic')
let sourcesFetched = false
const now = ref(Date.now())
const srcFilter = ref('active')
let srcFilterChosen = false
const srcQuery = ref('')
const sourcesEl = ref(null)
const sourcesHasMore = ref(true)
const sourcesNext = ref(0)
const sourcesLoading = ref(false)
let sourcesSearchTimer = 0
const trafficChartEl = ref(null)
const spartaEl = ref(null)
const fullLogOpen = ref(false)
const fullLogEl = ref(null)
const fullLogLines = ref([])
const fullLogTotal = ref(0)
const fullLogNext = ref(0)
const fullLogHasMore = ref(false)
const fullLogFileName = ref('')
const fullLogError = ref('')
const fullLogLoading = ref(false)
const fullLogDownloading = ref(false)
const FULL_LOG_PAGE = 200
let trafficChart = null
let pollTimer = 0
let clockTimer = 0
let spartaPollTimer = 0

const isL7 = computed(() => String(attack.value?.layer || '').toUpperCase() === 'L7' || Boolean(l7Incident.value))
const attackTabs = computed(() => (isL7.value ? attackTabsL7 : attackTabsAll))
const ongoing = computed(() => attack.value?.status === 'ongoing')
const hasDrops = computed(() => drops.value.length > 0)
const primaryType = computed(() => attackTypes.value[0]?.type || attack.value?.attackType || (isL7.value ? 'L7' : 'L4'))
const headline = computed(() => {
  const names = attackTypes.value.map((item) => item.type).filter(Boolean).slice(0, 3)
  const suffix = isL7.value ? 'attack' : 'flood'
  if (names.length > 1) return `${names.join(' + ')} ${suffix}`
  return `${names[0] || primaryType.value} ${suffix}`
})
const subtitle = computed(() => {
  const names = attackTypes.value.map((item) => item.type).filter(Boolean)
  if (names.length > 1) return names.join(' · ')
  if (isL7.value) {
    const peak = Number(l7Incident.value?.peak_rps || 0)
    const peakBlocked = Number(l7Incident.value?.peak_blocked_rps || 0)
    const ips = Number(l7Incident.value?.unique_ips || attack.value?.ipCount || 0)
    const ratio = Number(l7Incident.value?.blocked_ratio)
    return [
      peak > 0 ? `peak ${peak.toLocaleString()} rps` : '',
      peakBlocked > 0 ? `${peakBlocked.toLocaleString()} blocked/s` : '',
      Number.isFinite(ratio) && ratio > 0 ? `${Math.round(ratio * 100)}% blocked` : '',
      ips > 0 ? `${ips.toLocaleString()} unique IPs` : '',
    ].filter(Boolean).join(' · ') || attack.value?.title || 'L7 attack'
  }
  const events = Array.isArray(attack.value?.events) ? attack.value.events : []
  const technical = events.map((event) => event?.data || event?.attackType || '').find((value) => /ATTACK|BLOCK|PROTEC/i.test(value))
  return technical || attack.value?.attackType || attack.value?.title || 'L4 attack'
})
const layerChip = computed(() => {
  if (isL7.value) {
    const label = (attackTypes.value.map((item) => item.type).join(' ') || primaryType.value)
    return `L7 · ${label || 'HTTP'}`
  }
  const label = (attackTypes.value.map((item) => item.type).join(' ') || primaryType.value).toUpperCase()
  if (label.includes('UDP')) return 'L4 · UDP'
  if (label.includes('ICMP')) return 'L4 · ICMP'
  if (label.includes('GRE')) return 'L4 · GRE'
  return 'L4 · TCP'
})
const protectionOn = computed(() => {
  if (isL7.value) return ongoing.value
  const raw = String(protection.value || '')
  if (raw.includes('END')) return false
  if (raw.includes('START')) return true
  return ongoing.value
})
const modeLabel = computed(() => {
  if (isL7.value) {
    return ongoing.value ? 'Detector: under attack · Athens' : 'Detector: normal · Athens'
  }
  const events = Array.isArray(attack.value?.events) ? attack.value.events : []
  const blob = [
    attack.value?.title,
    attack.value?.attackType,
    protection.value,
    ...events.map((event) => `${event?.data || ''} ${event?.attackType || ''}`),
    ...sources.value.map((source) => source.attackType || ''),
  ].join(' ')
  if (/FIXED/i.test(blob)) return 'Mode: fixed block · XDP'
  if (/BURST/i.test(blob)) return 'Mode: burst block · XDP'
  return protectionOn.value ? 'Protection on · XDP' : 'Protection off · XDP'
})
const startedMs = computed(() => {
  const parsed = Date.parse(attack.value?.startedAt || '')
  return Number.isFinite(parsed) ? parsed : null
})
const blockAt = computed(() => {
  const times = sources.value.map((source) => Date.parse(source.firstBlockedAt || '')).filter(Number.isFinite)
  return times.length ? Math.min(...times) : null
})
const blockPercent = computed(() => {
  if (!startedMs.value || !blockAt.value) return 30
  const end = ongoing.value ? now.value : Date.parse(attack.value?.endedAt || attack.value?.createdAt || '') || now.value
  const span = Math.max(end - startedMs.value, 1)
  return Math.min(78, Math.max(14, ((blockAt.value - startedMs.value) / span) * 100))
})
const durationLabel = computed(() => formatDuration(startedMs.value, ongoing.value ? now.value : Date.parse(attack.value?.endedAt || attack.value?.createdAt || '')))
const timeToBlock = computed(() => {
  if (!startedMs.value || !blockAt.value) return '—'
  return formatDuration(startedMs.value, blockAt.value) || '0s'
})
const endedMs = computed(() => {
  if (ongoing.value) return now.value
  const parsed = Date.parse(attack.value?.endedAt || attack.value?.createdAt || '')
  return Number.isFinite(parsed) ? parsed : null
})
const l7Totals = computed(() => (l7Incident.value?.totals && typeof l7Incident.value.totals === 'object' ? l7Incident.value.totals : {}))
const l7TotalRequests = computed(() => Number(l7Totals.value.requests) || drops.value.reduce((sum, point) => sum + (Number(point.blocked) || 0) + (Number(point.allowed) || 0), 0))
const l7BlockedRatio = computed(() => {
  const ratio = Number(l7Incident.value?.blocked_ratio)
  if (Number.isFinite(ratio) && ratio >= 0) return ratio
  const requests = l7TotalRequests.value
  const blocked = Number(l7Totals.value.blocked)
  if (requests > 0 && Number.isFinite(blocked)) return blocked / requests
  return null
})
const l7BlockedIPs = computed(() => Number(l7Incident.value?.blocked_ips) || 0)
const peakIngress = computed(() => {
  if (isL7.value) {
    const peak = Number(l7Incident.value?.peak_rps) || 0
    const peakAt = Number(l7Incident.value?.peak_rps_at) || 0
    const ratio = l7BlockedRatio.value
    if (peak > 0) {
      return {
        value: formatRps(peak),
        at: peakAt > 0 ? peakAt * 1000 : null,
        dropShare: ratio != null ? Math.round(ratio * 100) : 0,
      }
    }
    let best = null
    drops.value.forEach((point) => {
      const blocked = Number(point.blocked) || 0
      const total = blocked + (Number(point.allowed) || 0)
      if (!best || total > best.total) best = { total, blocked, at: Date.parse(point.timestamp) }
    })
    if (!best || best.total <= 0) return { value: formatRps(0), at: null, dropShare: 0 }
    return {
      value: formatRps(best.total / L7_BUCKET_SECONDS),
      at: Number.isFinite(best.at) ? best.at : null,
      dropShare: Math.round((best.blocked / best.total) * 100),
    }
  }
  let best = null
  drops.value.forEach((point) => {
    const blocked = Number(point.blocked) || 0
    const total = blocked + (Number(point.allowed) || 0)
    if (!best || total > best.total) best = { total, blocked, at: Date.parse(point.timestamp) }
  })
  if (!best || best.total <= 0) return { value: formatBandwidthValue(0), at: null, dropShare: 0 }
  return {
    value: formatBandwidthValue(bytesToKbps(best.total)),
    at: Number.isFinite(best.at) ? best.at : null,
    dropShare: Math.round((best.blocked / best.total) * 100),
  }
})
const droppedTotal = computed(() => {
  if (isL7.value) {
    const blocked = Number(l7Totals.value.blocked)
    if (Number.isFinite(blocked) && blocked > 0) return formatCount(blocked)
    return formatCount(drops.value.reduce((sum, point) => sum + (Number(point.blocked) || 0), 0))
  }
  return formatBytes(drops.value.reduce((sum, point) => sum + (Number(point.blocked) || 0), 0))
})
const passedTotal = computed(() => {
  if (isL7.value) {
    const passed = Number(l7Totals.value.passed)
    if (Number.isFinite(passed) && passed >= 0) return formatCount(passed)
    return formatCount(drops.value.reduce((sum, point) => sum + (Number(point.allowed) || 0), 0))
  }
  return formatBytes(drops.value.reduce((sum, point) => sum + (Number(point.allowed) || 0), 0))
})
const vectorParts = computed(() => {
  const scored = attackTypes.value.map((item) => Math.max(Number(item.count) || 0, 1))
  const total = scored.reduce((sum, value) => sum + value, 0) || 1
  return attackTypes.value.slice(0, 4).map((item, index) => {
    const count = Number(item.count) || 0
    const weight = Math.max(count, 1)
    return {
      type: item.type,
      count,
      startedAt: item.startedAt || '',
      endedAt: item.endedAt || '',
      range: vectorRangeLabel(item.startedAt, item.endedAt),
      width: `${Math.max(6, Math.round((weight / total) * 100))}%`,
      color: vectorColor(item.type, index),
    }
  })
})

const vectorRangeLabel = (startedAt, endedAt) => {
  const start = formatShortClockSafe(startedAt)
  const end = formatShortClockSafe(endedAt)
  if (start && end) return `${start}–${end}`
  if (start) return `from ${start}`
  return ''
}
const watchedCounters = computed(() => {
  const labels = [
    ...attackTypes.value.map((item) => item.type),
    attack.value?.attackType,
    attack.value?.title,
  ].map((value) => String(value || '').toUpperCase())
  const tokens = new Set(labels.flatMap((label) => label.split(/[^A-Z0-9]+/)).filter(Boolean))
  const keys = new Set([...tokens].flatMap((token) => COUNTERS_FOR_TOKEN[token] || []))
  return COUNTER_ORDER.filter((key) => keys.has(key))
})
const logs = computed(() => {
  const watched = new Set(watchedCounters.value)
  return spartaLog.value
    .slice(-SPARTA_MAX_LINES)
    .map(parseLogLine)
    .filter((line) => line?.isCounter || line?.counters?.length)
    .map((line) => {
      // Prefer attack-vector counters when present, but never hide the whole line.
      const focused = watched.size
        ? line.counters.filter((counter) => watched.has(counter.k))
        : line.counters
      return {
        ...line,
        counters: focused.length ? focused : line.counters,
      }
    })
    .filter((line) => line.counters.length)
})
const logRangeLabel = computed(() => {
  const { start, end } = windowRange.value
  return start && end ? `${formatClock(start)} – ${formatClock(end)}` : ''
})
const sourcesEmptyText = computed(() => {
  if (srcQuery.value.trim()) return 'No sources match that address.'
  if (srcFilter.value === 'active' && sourceCount.value > 0) return 'No sources are blocked right now.'
  return 'No source addresses recorded for this attack.'
})
const sourceStatus = (source) => {
  if (!source.active) return 'Released'
  const remaining = Math.round((Date.parse(source.releasesAt || '') - (now.value + clockSkew.value)) / 1000)
  return Number.isFinite(remaining) && remaining > 0 ? `Blocking · ${remaining}s` : 'Blocking'
}
const chartCaption = computed(() => {
  const { start, end } = windowRange.value
  const range = start && end ? `${formatShortClock(start)} – ${formatShortClock(end)} · ` : ''
  if (isL7.value) {
    return `${range}${L7_BUCKET_SECONDS} s buckets · requests/s · includes before/after context · shaded = attack window`
  }
  return `${range}${SAMPLE_MS / 1000} s samples · shaded = vector windows`
})

const formatDuration = (start, end) => {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return ''
  const seconds = Math.max(0, Math.round((end - start) / 1000))
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  if (minutes <= 0) return `${remain}s`
  return `${minutes}m ${String(remain).padStart(2, '0')}s`
}

const formatClock = (value) => {
  const parsed = typeof value === 'number'
    ? value
    : value instanceof Date
      ? value.getTime()
      : Date.parse(value || '')
  if (!Number.isFinite(parsed)) return ''
  // Always browser-local 24h — must match chart axis/tooltip formatters.
  return new Date(parsed).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const formatShortClock = (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

/** ApexCharts datetime labels/tooltips — force local TZ (datetimeUTC flags are unreliable across versions). */
const formatChartTime = (value) => {
  const parsed = typeof value === 'number' ? value : Date.parse(value || '')
  if (!Number.isFinite(parsed)) return ''
  return new Date(parsed).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const formatBandwidthValue = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 Kbps'
  if (numeric >= 1024 * 1024) return `${(numeric / (1024 * 1024)).toFixed(1)} Gbps`
  if (numeric >= 1024) return `${(numeric / 1024).toFixed(1)} Mbps`
  return `${Math.round(numeric)} Kbps`
}

const formatCount = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0'
  if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}M`
  if (numeric >= 10_000) return `${Math.round(numeric / 1000)}k`
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}k`
  return Math.round(numeric).toLocaleString()
}

const formatRps = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 rps'
  return `${formatCount(numeric)} rps`
}

const bytesToKbps = (bytes) => ((Number(bytes) || 0) * 8) / 1024

const formatBytes = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let current = numeric
  let index = 0
  while (current >= 1000 && index < units.length - 1) {
    current /= 1000
    index += 1
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[index]}`
}

const vectorColor = (type, index) => {
  const colors = getApexSeriesColors()
  const label = String(type || '').toUpperCase()
  if (label.includes('STOMP') || label.includes('PSH')) return colors.l7
  if (label.includes('UDP')) return colors.l4
  if (label.includes('ICMP') || label.includes('GRE')) return colors.teal
  if (label.includes('RST')) return colors.danger || colors.l7
  if (label.includes('SYN')) return colors.viper
  if (label.includes('ACK')) return colors.warn
  return [colors.warn, colors.l7, colors.l4, colors.viper][index % 4]
}

const formatShortClockSafe = (value) => {
  const parsed = Date.parse(value || '')
  if (!Number.isFinite(parsed)) return ''
  return formatShortClock(parsed)
}

const vectorClass = (type) => {
  const label = String(type || '').toUpperCase()
  if (label.includes('STOMP') || label.includes('PSH')) return 'stomp'
  if (label.includes('UDP')) return 'udp'
  return 'ack'
}

const parseLogLine = (entry) => {
  const body = String(entry?.text || '')
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/^\[\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}\]\s*/, '')
    .trim()
  if (!body) return null
  const time = entry?.time || ''
  const counters = []
  const pattern = /([A-Z][A-Z0-9+]*)\s*:\s*([0-9]+(?:\/[0-9]+)?)/g
  let match = pattern.exec(body)
  while (match) {
    counters.push({ k: match[1], v: match[2] })
    match = pattern.exec(body)
  }
  const known = counters.some((counter) => /^(?:SYN|ACK|PSH|RST|FIN|UDP|ICMP|GRE|STOMP|HANDSHAKE)/.test(counter.k))
  return { time, body, isCounter: known || counters.length > 0, counters }
}

const bucketSeries = (rows, keys, bucketMs) => {
  const buckets = new Map()
  rows.forEach((point) => {
    const timestamp = Date.parse(point.timestamp)
    if (!Number.isFinite(timestamp)) return
    const bucket = Math.floor(timestamp / bucketMs) * bucketMs
    const entry = buckets.get(bucket) || { count: 0 }
    entry.count += 1
    keys.forEach((key) => {
      entry[key] = (entry[key] || 0) + (Number(point[key]) || 0)
    })
    buckets.set(bucket, entry)
  })
  return Object.fromEntries(keys.map((key) => [
    key,
    [...buckets.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([timestamp, entry]) => [timestamp, Math.round(entry[key] / entry.count)]),
  ]))
}

const cssVar = (name, fallback) => {
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

const chartSeries = () => {
  if (isL7.value) {
    const smoothed = bucketSeries(drops.value, ['allowed', 'blocked'], L7_BUCKET_SECONDS * 1000)
    const toRps = (points) => points.map(([timestamp, count]) => [
      timestamp,
      Math.round(((Number(count) || 0) / L7_BUCKET_SECONDS) * 10) / 10,
    ])
    return [
      { name: 'Passed', data: toRps(smoothed.allowed) },
      { name: 'Blocked', data: toRps(smoothed.blocked) },
    ]
  }
  const smoothed = bucketSeries(drops.value, ['allowed', 'blocked'], SAMPLE_MS)
  const toRate = (points) => points.map(([timestamp, bytes]) => [timestamp, bytesToKbps(bytes)])
  return [
    { name: 'Passed', data: toRate(smoothed.allowed) },
    { name: 'Dropped', data: toRate(smoothed.blocked) },
  ]
}

const chartAnnotations = (seriesColors) => {
  const warn = seriesColors.warn
  const xaxis = []
  const vectorWindows = attackTypes.value
    .map((item, index) => {
      const start = Date.parse(item.startedAt || '')
      const end = Date.parse(item.endedAt || '')
      if (!Number.isFinite(start)) return null
      return {
        type: item.type || `Vector ${index + 1}`,
        start,
        end: Number.isFinite(end) && end > start ? end : (endedMs.value || now.value),
        color: vectorColor(item.type, index),
      }
    })
    .filter(Boolean)
  if (vectorWindows.length) {
    vectorWindows.forEach((window, index) => {
      xaxis.push({
        x: window.start,
        x2: window.end,
        fillColor: window.color || warn,
        opacity: 0.1,
        borderColor: window.color || warn,
        strokeDashArray: 3,
        label: {
          text: window.type,
          position: 'top',
          orientation: 'horizontal',
          textAnchor: 'start',
          offsetX: 6,
          offsetY: 6 + index * 18,
          borderWidth: 0,
          style: { background: 'transparent', color: seriesColors.sand, fontSize: '11px', fontWeight: 500 },
        },
      })
    })
  } else if (startedMs.value) {
    xaxis.push({
      x: startedMs.value,
      x2: endedMs.value || now.value,
      fillColor: warn,
      opacity: 0.07,
      borderColor: warn,
      strokeDashArray: 3,
      label: {
        text: 'Attack window',
        position: 'top',
        orientation: 'horizontal',
        textAnchor: 'start',
        offsetX: 6,
        offsetY: 6,
        borderWidth: 0,
        style: { background: 'transparent', color: seriesColors.sand, fontSize: '11px', fontWeight: 500 },
      },
    })
  }
  if (blockAt.value) {
    xaxis.push({
      x: blockAt.value,
      borderColor: warn,
      strokeDashArray: 0,
      borderWidth: 1.5,
      label: {
        text: 'Block engaged',
        position: 'top',
        orientation: 'horizontal',
        textAnchor: 'start',
        offsetX: 6,
        offsetY: 28 + Math.max(0, vectorWindows.length - 1) * 18,
        borderColor: cssVar('--dorian-gold-dim', warn),
        borderRadius: 4,
        style: {
          background: cssVar('--dorian-gold-dim', 'transparent'),
          color: warn,
          fontSize: '11px',
          fontWeight: 600,
          padding: { left: 8, right: 8, top: 3, bottom: 3 },
        },
      },
    })
  }
  return { xaxis }
}

const renderCharts = async () => {
  await nextTick()
  if (!trafficChartEl.value) return
  const theme = getApexChartColors()
  const seriesColors = getApexSeriesColors()
  const series = chartSeries()
  const times = series[0].data.map((point) => point[0])
  const labelStyle = { colors: theme.label, fontSize: '11px', fontFamily: 'var(--font-mono, ui-monospace, monospace)' }
  const options = {
    chart: {
      type: 'area',
      height: 260,
      stacked: true,
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
      fontFamily: 'inherit',
      parentHeightOffset: 0,
    },
    series,
    colors: [seriesColors.viper, seriesColors.danger],
    stroke: { curve: 'monotoneCubic', width: 1.5 },
    fill: { type: 'solid', opacity: [0.28, 0.55] },
    dataLabels: { enabled: false },
    grid: {
      borderColor: theme.grid,
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 8, right: 12, top: 4 },
    },
    legend: { show: false },
    annotations: chartAnnotations(seriesColors),
    xaxis: {
      type: 'datetime',
      min: windowRange.value.start ?? (times.length ? times[0] : undefined),
      max: windowRange.value.end ?? (times.length ? times[times.length - 1] : undefined),
      tickAmount: 5,
      labels: {
        style: labelStyle,
        datetimeUTC: false,
        formatter: formatChartTime,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      crosshairs: { stroke: { color: theme.crosshair, width: 1, dashArray: 3 } },
    },
    yaxis: {
      min: 0,
      tickAmount: 4,
      forceNiceScale: true,
      labels: {
        minWidth: 64,
        style: labelStyle,
        formatter: isL7.value ? formatRps : formatBandwidthValue,
      },
    },
    tooltip: {
      theme: getApexTooltipTheme(),
      shared: true,
      x: { formatter: formatChartTime },
      y: { formatter: isL7.value ? formatRps : formatBandwidthValue },
    },
  }
  if (!trafficChart) {
    trafficChart = new ApexCharts(trafficChartEl.value, options)
    await trafficChart.render()
    return
  }
  await trafficChart.updateOptions(options, false, false)
}

let loading = false

const load = async () => {
  if (loading) return
  loading = true
  try {
    const payload = await fetchAttackConsole(props.reqId)
    attack.value = payload?.attack || null
    l7Incident.value = payload?.l7 || null
    const windowStart = Date.parse(payload?.windowStart || '')
    const windowEnd = Date.parse(payload?.windowEnd || '')
    windowRange.value = {
      start: Number.isFinite(windowStart) ? windowStart : null,
      end: Number.isFinite(windowEnd) ? windowEnd : null,
    }
    const dropRows = Array.isArray(payload?.drops) ? payload.drops : []
    drops.value = dropRows.length > DROP_RENDER_CAP
      ? dropRows.filter((_, index) => index === 0 || index === dropRows.length - 1 || index % Math.ceil(dropRows.length / DROP_RENDER_CAP) === 0).slice(0, DROP_RENDER_CAP)
      : dropRows
    // Backend already merges panel before/after metrics with the incident timeline.
    // Fall back to timeline alone only if drops were empty (older API).
    if (!drops.value.length && l7Incident.value && Array.isArray(l7Incident.value.timeline) && l7Incident.value.timeline.length) {
      drops.value = l7Incident.value.timeline.map((bucket) => ({
        timestamp: new Date(Number(bucket.t || 0) * 1000).toISOString(),
        blocked: Number(bucket.blocked || 0),
        allowed: Number(bucket.passed != null ? bucket.passed : Math.max(0, Number(bucket.requests || 0) - Number(bucket.blocked || 0) - Number(bucket.rapid_reset || 0) - Number(bucket.malformed || 0))),
      }))
    }
    activeCount.value = Number(payload?.activeCount) || 0
    sourceCount.value = Number(payload?.sourceCount) || Number(l7Incident.value?.unique_ips) || 0
    const serverTime = Date.parse(payload?.serverTime || '')
    clockSkew.value = Number.isFinite(serverTime) ? serverTime - Date.now() : 0
    if (!srcFilterChosen) {
      srcFilter.value = isL7.value || activeCount.value <= 0 ? 'all' : 'active'
    }
    attackTypes.value = Array.isArray(payload?.attackTypes) ? payload.attackTypes : []
    protection.value = payload?.protection || ''
    if (l7Incident.value && Array.isArray(l7Incident.value.top_ips)) {
      sources.value = l7Incident.value.top_ips.slice(0, 80).map((row) => ({
        ip: row.ip,
        attackType: Number(row.blocked) > 0 ? 'blocked' : 'passed',
        firstBlockedAt: attack.value?.startedAt || '',
        lastBlockedAt: attack.value?.endedAt || attack.value?.startedAt || '',
        releasesAt: '',
        blocks: Number(row.blocked) || Number(row.requests) || 0,
        requests: Number(row.requests) || 0,
        blocked: Number(row.blocked) || 0,
        passed: Number(row.passed) || 0,
        active: attack.value?.status === 'ongoing' && Number(row.blocked) > 0,
      }))
      sourcesFetched = true
      sourcesHasMore.value = false
    }
    if (activeTab.value === 'console' && String(attack.value?.layer || '').toUpperCase() === 'L7') {
      activeTab.value = 'traffic'
    }
    error.value = ''
    loaded.value = true
    await renderCharts()
  } catch (err) {
    error.value = err?.message || 'The attack view could not be loaded.'
  } finally {
    loading = false
  }
}

const resetSources = () => {
  sources.value = []
  sourcesNext.value = 0
  sourcesHasMore.value = true
}

const ensureSources = () => {
  if (sourcesFetched || sourcesLoading.value) return
  sourcesFetched = true
  loadSources({ reset: true })
}

const startSpartaPoll = () => {
  if (spartaPollTimer) return
  if (!spartaLog.value.length) loadSpartaPage()
  spartaPollTimer = window.setInterval(pollSpartaLive, 5000)
}

const stopSpartaPoll = () => {
  if (!spartaPollTimer) return
  window.clearInterval(spartaPollTimer)
  spartaPollTimer = 0
}

const loadSources = async ({ reset = false } = {}) => {
  if (sourcesLoading.value) return
  if (!reset && sources.value.length && !sourcesHasMore.value) return
  if (reset) resetSources()
  sourcesLoading.value = true
  try {
    const payload = await fetchAttackSources(props.reqId, {
      offset: sourcesNext.value,
      limit: SOURCE_PAGE,
      q: srcQuery.value,
      active: srcFilter.value === 'active',
    })
    const chunk = Array.isArray(payload?.sources) ? payload.sources : []
    const seen = new Set(sources.value.map((item) => item.ip))
    const unique = chunk.filter((item) => item?.ip && !seen.has(item.ip))
    sources.value = sources.value.concat(unique)
    sourcesNext.value = Number(payload?.next) || (sourcesNext.value + chunk.length)
    sourcesHasMore.value = Boolean(payload?.hasMore) && chunk.length > 0
    if (Number.isFinite(Number(payload?.activeCount))) activeCount.value = Number(payload.activeCount)
    if (Number.isFinite(Number(payload?.sourceCount))) sourceCount.value = Number(payload.sourceCount)
  } catch {
    if (reset) sources.value = []
    sourcesHasMore.value = false
  } finally {
    sourcesLoading.value = false
  }
}

const onSourcesScroll = () => {
  const el = sourcesEl.value
  if (!el || sourcesLoading.value || !sourcesHasMore.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 64) {
    loadSources()
  }
}

const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

const exportReport = () => {
  const vectorLines = attackTypes.value.map((item) => {
    const window = [item.startedAt, item.endedAt].filter(Boolean).map(formatClock).join(' → ')
    return `- ${item.type}${item.count ? ` × ${item.count}` : ''}${window ? ` (${window})` : ''}`
  })
  const lines = [
    '# Dorian attack report',
    `req_id: ${props.reqId}`,
    `title: ${headline.value}`,
    `edge: ${attack.value?.serverName || '—'}`,
    `status: ${ongoing.value ? 'ongoing' : 'ended'}`,
    `started: ${attack.value?.startedAt || '—'}`,
    `ended: ${attack.value?.endedAt || attack.value?.createdAt || '—'}`,
    `duration: ${durationLabel.value || '—'}`,
    `sources: ${sourceCount.value} (${activeCount.value} active)`,
    `detector_reports: ${attack.value?.eventCount ?? 0}`,
    protection.value ? `protection: ${protection.value}` : '',
    '',
    '## Vectors',
    ...(vectorLines.length ? vectorLines : ['- (none)']),
    '',
    '## Blocked sources',
    'ip\tvector\tfirst_blocked\tlast_blocked\tstatus',
    ...sources.value.map((source) => [
      source.ip,
      source.attackType || 'L4',
      source.firstBlockedAt || '',
      source.lastBlockedAt || '',
      source.active ? 'blocking' : 'released',
    ].join('\t')),
    '',
    '## Sparta counters (console sample)',
    ...spartaLog.value.slice(0, 500).map((line) => `${line.time || ''}\t${line.text || ''}`),
    spartaLog.value.length > 500 ? `… ${spartaLog.value.length - 500} more counter lines in Full log` : '',
    '',
    'Open Full log → Download archive for the complete Sparta attack file.',
  ]
  const blob = new Blob([`${lines.filter((line) => line !== null && line !== undefined).join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
  saveBlob(blob, `attack-${props.reqId}-report.txt`)
  notifySuccess('Attack export', 'Report downloaded.')
}

const downloadLoadedLog = () => {
  if (!fullLogLines.value.length) {
    notifyError('Sparta log', 'Load the archive first, then export.')
    return
  }
  const body = fullLogLines.value.map((line) => line.text || '').join('\n')
  const name = fullLogFileName.value
    ? fullLogFileName.value.replace(/\.log$/i, '') + `-loaded-${fullLogLines.value.length}.log`
    : `sparta-attack-${props.reqId}-loaded.log`
  saveBlob(new Blob([`${body}\n`], { type: 'text/plain;charset=utf-8' }), name)
  notifySuccess('Sparta log', `Exported ${fullLogLines.value.length.toLocaleString()} loaded lines.`)
}

const downloadArchiveFile = async () => {
  if (fullLogDownloading.value) return
  fullLogDownloading.value = true
  try {
    const { blob, fileName, size } = await downloadAttackSpartaArchive(props.reqId)
    saveBlob(blob, fileName)
    const mb = size > 0 ? ` (${(size / (1024 * 1024)).toFixed(1)} MB)` : ''
    notifySuccess('Sparta log', `Archive downloaded${mb}.`)
  } catch (err) {
    notifyError('Sparta log', err?.message || 'Archive download failed.')
  } finally {
    fullLogDownloading.value = false
  }
}

const openEdge = () => {
  const id = attack.value?.serverId
  if (!id) return
  emit('close')
  router.push({ name: 'server-settings', query: { server: String(id) } })
}

const fullLogLineClass = (text) => {
  const body = String(text || '')
  if (/\bCRITIC\b/.test(body)) return 'lvl-critic'
  if (/\bNOTICE\b/.test(body)) return 'lvl-notice'
  if (/\bALERT\b|\bDETECT\b/.test(body)) return 'lvl-alert'
  if (/\bDEBUG\b/.test(body)) return 'lvl-debug'
  if (/^\s*#/.test(body)) return 'lvl-meta'
  if (/\b(?:SYN|ACK|PSH|RST|FIN|UDP|ICMP|GRE|STOMP)\s*:/.test(body)) return 'lvl-counter'
  return ''
}

const resetSpartaLog = () => {
  spartaLog.value = []
  spartaError.value = ''
  spartaNext.value = 0
  spartaHasMore.value = true
  spartaTotal.value = 0
  spartaFileName.value = ''
  spartaLoadingOlder.value = false
  spartaScrollLock = false
}

const lineKey = (line) => `${line?.time || ''}\t${line?.text || ''}`

const newerThan = (line, last) => {
  if (!last) return true
  const left = Date.parse(line?.time || '')
  const right = Date.parse(last?.time || '')
  if (Number.isFinite(left) && Number.isFinite(right) && left !== right) return left > right
  return lineKey(line) !== lineKey(last)
}

const capSpartaLines = (lines) => {
  if (lines.length <= SPARTA_MAX_LINES) return lines
  return lines.slice(lines.length - SPARTA_MAX_LINES)
}

const lockSpartaScroll = async (fn) => {
  spartaScrollLock = true
  try {
    await fn()
  } finally {
    await nextTick()
    window.setTimeout(() => {
      spartaScrollLock = false
    }, 80)
  }
}

const scrollSpartaToBottom = async () => {
  await lockSpartaScroll(async () => {
    await nextTick()
    const el = spartaLogEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

const extractCounterLines = (rows) => {
  const out = []
  for (const row of Array.isArray(rows) ? rows : []) {
    const parsed = parseLogLine(row)
    if (!parsed?.isCounter || !parsed.counters.length) continue
    out.push({
      time: row?.time || parsed.time || '',
      text: parsed.body,
    })
  }
  return out
}

const loadSpartaPage = async ({ older = false, replace = false } = {}) => {
  if (spartaLoading.value) return
  if (older && (!spartaHasMore.value || spartaLog.value.length >= SPARTA_MAX_LINES)) {
    if (spartaLog.value.length >= SPARTA_MAX_LINES) spartaHasMore.value = false
    return
  }
  spartaLoading.value = true
  spartaLoadingOlder.value = older
  try {
    // Use the same archive endpoint as Full log (proven to work), then keep
    // only counter lines. First open loads near the end of the file.
    let fileOffset = 0
    let total = spartaTotal.value
    if (!older || replace || !spartaLog.value.length) {
      const probe = await fetchAttackSpartaArchive(props.reqId, {
        offset: 0,
        limit: 1,
        skipTotal: false,
      })
      if (probe?.error) spartaError.value = probe.error
      else spartaError.value = ''
      total = Number(probe?.total) || 0
      if (total > 0) spartaTotal.value = total
      if (probe?.fileName) spartaFileName.value = probe.fileName
      else if (probe?.file) spartaFileName.value = String(probe.file).split('/').pop() || ''
      fileOffset = Math.max(0, total - SPARTA_PAGE)
      spartaNext.value = fileOffset
    } else {
      fileOffset = Math.max(0, spartaNext.value - SPARTA_PAGE)
    }

    const payload = await fetchAttackSpartaArchive(props.reqId, {
      offset: fileOffset,
      limit: SPARTA_PAGE,
      skipTotal: total > 0,
    })
    if (payload?.error) spartaError.value = payload.error
    else if (!spartaError.value) spartaError.value = ''
    if (Number(payload?.total) > 0) {
      total = Number(payload.total)
      spartaTotal.value = total
    }
    if (payload?.fileName) spartaFileName.value = payload.fileName
    else if (payload?.file) spartaFileName.value = String(payload.file).split('/').pop() || spartaFileName.value

    const chunk = extractCounterLines(payload?.lines)
    if (older && spartaLog.value.length) {
      const el = spartaLogEl.value
      const prevHeight = el?.scrollHeight || 0
      const prevTop = el?.scrollTop || 0
      const room = Math.max(0, SPARTA_MAX_LINES - spartaLog.value.length)
      const kept = room ? chunk.slice(Math.max(0, chunk.length - room)) : []
      if (!kept.length) {
        spartaHasMore.value = fileOffset > 0
        spartaNext.value = fileOffset
        return
      }
      await lockSpartaScroll(async () => {
        spartaLog.value = kept.concat(spartaLog.value)
        await nextTick()
        if (el) el.scrollTop = prevTop + (el.scrollHeight - prevHeight)
      })
      spartaNext.value = fileOffset
      spartaHasMore.value = fileOffset > 0 && spartaLog.value.length < SPARTA_MAX_LINES
    } else {
      const previous = replace ? [] : spartaLog.value
      const last = previous[previous.length - 1]
      const lastSeen = last ? lineKey(last) : ''
      const seenAt = lastSeen ? chunk.findIndex((line) => lineKey(line) === lastSeen) : -1
      const fresh = !previous.length
        ? chunk
        : seenAt >= 0
          ? chunk.slice(seenAt + 1)
          : chunk.filter((line) => newerThan(line, last))
      if (!previous.length || replace) {
        spartaLog.value = capSpartaLines(chunk)
        await scrollSpartaToBottom()
      } else if (fresh.length) {
        const el = spartaLogEl.value
        const pinned = el && el.scrollHeight - el.scrollTop - el.clientHeight < 48
        spartaLog.value = capSpartaLines(previous.concat(fresh))
        if (pinned) await scrollSpartaToBottom()
      } else if (!spartaLog.value.length) {
        spartaLog.value = capSpartaLines(chunk)
        await scrollSpartaToBottom()
      }
      spartaNext.value = fileOffset
      spartaHasMore.value = fileOffset > 0 && spartaLog.value.length < SPARTA_MAX_LINES
      if (!chunk.length && !spartaLog.value.length && !spartaError.value) {
        spartaError.value = total > 0
          ? 'Archive loaded, but no counter lines were found.'
          : 'No archive file for this attack.'
      }
    }
  } catch (err) {
    spartaError.value = err?.message || 'Sparta log is unavailable'
    if (replace || !spartaLog.value.length) spartaHasMore.value = false
  } finally {
    spartaLoading.value = false
    spartaLoadingOlder.value = false
  }
}

const onSpartaScroll = () => {
  const el = spartaLogEl.value
  if (!el || spartaScrollLock || spartaLoading.value || !spartaHasMore.value) return
  if (el.scrollTop <= 24) {
    loadSpartaPage({ older: true })
  }
}

const pollSpartaLive = async () => {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  if (spartaLoading.value || !ongoing.value) return
  if (!spartaFileName.value) {
    await loadSpartaPage({ replace: true })
    return
  }
  await loadSpartaPage()
}

const resetFullLog = () => {
  fullLogLines.value = []
  fullLogTotal.value = 0
  fullLogNext.value = 0
  fullLogHasMore.value = false
  fullLogFileName.value = ''
  fullLogError.value = ''
}

const closeFullLog = () => {
  fullLogOpen.value = false
}

const loadFullLogPage = async () => {
  if (fullLogLoading.value) return
  if (fullLogOpen.value && fullLogLines.value.length && !fullLogHasMore.value) return
  fullLogLoading.value = true
  fullLogError.value = ''
  try {
    const skipTotal = fullLogTotal.value > 0
    const payload = await fetchAttackSpartaArchive(props.reqId, {
      offset: fullLogNext.value,
      limit: FULL_LOG_PAGE,
      skipTotal,
    })
    if (payload?.error) {
      fullLogError.value = payload.error
    }
    const chunk = Array.isArray(payload?.lines) ? payload.lines : []
    fullLogLines.value = fullLogLines.value.concat(chunk)
    if (Number(payload?.total) > 0) fullLogTotal.value = Number(payload.total)
    fullLogNext.value = Number(payload?.next) || (fullLogNext.value + chunk.length)
    fullLogHasMore.value = Boolean(payload?.hasMore)
    if (payload?.fileName) fullLogFileName.value = payload.fileName
    else if (payload?.file) fullLogFileName.value = String(payload.file).split('/').pop() || ''
    if (!chunk.length && !fullLogLines.value.length && !fullLogError.value) {
      fullLogError.value = 'No archive file for this attack.'
    }
  } catch (err) {
    fullLogError.value = err?.message || 'The Sparta archive could not be loaded.'
    fullLogHasMore.value = false
  } finally {
    fullLogLoading.value = false
  }
}

const openFullLog = async () => {
  resetFullLog()
  fullLogOpen.value = true
  await loadFullLogPage()
}

const onFullLogScroll = () => {
  const el = fullLogEl.value
  if (!el || fullLogLoading.value || !fullLogHasMore.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 140) {
    loadFullLogPage()
  }
}

const consolePollMs = () => (isL7.value && ongoing.value ? 4000 : 8000)

const restartPoll = () => {
  window.clearInterval(pollTimer)
  pollTimer = window.setInterval(load, consolePollMs())
}

onMounted(async () => {
  await load()
  srcFilterChosen = true
  restartPoll()
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  window.clearInterval(pollTimer)
  window.clearInterval(spartaPollTimer)
  window.clearInterval(clockTimer)
  window.clearTimeout(sourcesSearchTimer)
  trafficChart?.destroy()
})

watch([isL7, ongoing], () => {
  restartPoll()
})

watch(() => props.reqId, async () => {
  trafficChart?.destroy()
  trafficChart = null
  srcFilterChosen = false
  srcQuery.value = ''
  activeTab.value = 'traffic'
  sourcesFetched = false
  stopSpartaPoll()
  closeFullLog()
  resetFullLog()
  resetSpartaLog()
  resetSources()
  await load()
  srcFilterChosen = true
})

watch(activeTab, async (tab) => {
  if (tab === 'traffic') {
    await nextTick()
    trafficChart?.resize?.()
  }
  if (tab === 'sources') ensureSources()
  if (tab === 'console') startSpartaPoll()
  else stopSpartaPoll()
})

watch(srcQuery, () => {
  if (!srcFilterChosen) return
  window.clearTimeout(sourcesSearchTimer)
  sourcesSearchTimer = window.setTimeout(() => {
    loadSources({ reset: true })
  }, 280)
})

watch(srcFilter, () => {
  if (!srcFilterChosen) return
  loadSources({ reset: true })
})
</script>

<style scoped>
.attack-console-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--app-overlay);
}

.attack-console {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(1120px, 100%);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border: 1px solid var(--app-border-strong);
  border-radius: 16px;
  background: var(--app-surface-solid);
  color: var(--app-text);
  box-shadow: 0 24px 80px var(--app-shadow);
  font-size: 14px;
}

.attack-console__header {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 28px 18px;
  border-bottom: 1px solid var(--app-border);
}

.attack-console__chips,
.attack-console__title-row,
.panel__head,
.sources__title,
.legend,
.seg {
  display: flex;
  align-items: center;
}

.attack-console__chips {
  gap: 8px;
  flex-wrap: wrap;
}

.attack-console__chips-spacer { flex: 1; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 9px;
  border: 1px solid var(--app-border-strong);
  border-radius: 999px;
  background: var(--app-surface-muted);
  color: var(--app-text-secondary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pill i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-text-muted);
}

.pill.live {
  border-color: color-mix(in srgb, var(--dorian-danger) 45%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-danger) 16%, transparent);
  color: var(--dorian-danger);
}

.pill.live i {
  background: var(--dorian-danger);
  animation: attack-pulse 1.6s ease-out infinite;
}

.pill.layer {
  border-color: color-mix(in srgb, var(--dorian-warn) 45%, var(--app-border));
  background: var(--dorian-gold-dim);
  color: var(--dorian-warn);
  text-transform: none;
}

.pill.edge {
  border-color: var(--app-border);
  background: var(--app-surface-elevated);
  color: var(--app-text-secondary);
  font-family: var(--font-mono, ui-monospace, monospace);
  letter-spacing: 0;
  text-transform: none;
}

.ghost,
.icon,
footer button {
  border: 1px solid var(--app-btn-surface-border);
  border-radius: 8px;
  background: var(--app-btn-surface-bg);
  color: var(--app-btn-surface-fg);
  cursor: pointer;
}

.ghost {
  height: 32px;
  padding: 0 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border-color: transparent;
  color: var(--app-text-muted);
}

.icon svg { width: 18px; height: 18px; }

.attack-console__title-row {
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.attack-console h2 {
  margin: 0;
  color: var(--app-heading);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.mono { font-family: var(--font-mono, ui-monospace, monospace); }
.muted, .dim { color: var(--app-text-muted); }
.attack-console__title-row .muted { margin: 4px 0 0; font-size: 11px; }

.attack-console__times {
  display: flex;
  gap: 28px;
  margin: 0;
}

.attack-console__times dt {
  color: var(--app-text-muted);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.attack-console__times dd {
  margin: 2px 0 0;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 13px;
}

.attack-console__times .warn { color: var(--dorian-warn); }

.track {
  position: relative;
  height: 46px;
  margin-top: 4px;
}

.track__base,
.track__warm,
.track__hot {
  position: absolute;
  top: 9px;
  height: 4px;
  border-radius: 2px;
}

.track__base { left: 0; right: 0; background: var(--app-border-strong); }
.track__warm { left: 0; background: color-mix(in srgb, var(--dorian-warn) 45%, var(--app-border)); }
.track__hot { right: 0; background: var(--dorian-warn); }

.track__mark {
  position: absolute;
  top: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.track__mark.start { left: 0; }
.track__mark.mid { transform: translateX(-8px); }
.track__mark.end { right: 0; align-items: flex-end; }

.track__mark i {
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  border: 3px solid var(--app-text-secondary);
  border-radius: 50%;
  background: var(--app-surface-solid);
}

.track__mark i.hot { border-color: var(--dorian-warn); }
.track__mark i.done { background: var(--app-text-secondary); }

.track__mark span {
  color: var(--app-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.track__mark b {
  color: var(--app-text-muted);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-weight: 500;
}

.attack-console__error { margin: 12px 28px 0; color: var(--dorian-danger); }

.attack-console__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: auto;
  padding: 16px 28px 24px;
}

.attack-console__tabs {
  flex: none;
}

.attack-console__panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.kpis article,
.panel {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-elevated);
}

.kpis article {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
}

.kpis span,
.panel h3 {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 500;
}

.kpis p {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
}

.kpis strong {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.kpis em, .kpis small { color: var(--app-text-muted); font-style: normal; font-size: 12px; }
.kpis small b { color: var(--dorian-warn); font-weight: 500; }

.vectors {
  display: flex;
  gap: 2px;
  height: 8px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 4px;
}

.vector-legend {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.vector-legend span { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.vector-legend i { width: 8px; height: 8px; border-radius: 2px; }
.vector-range {
  color: var(--app-text-muted);
  font-style: normal;
  font-variant-numeric: tabular-nums;
  font-size: 0.85em;
}

.panel { padding: 18px 20px 14px; }
.panel__head { justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.panel h3 { color: var(--app-heading); font-size: 15px; font-weight: 600; }
.panel__head p { margin: 2px 0 0; color: var(--app-text-muted); font-size: 12px; }
.legend { gap: 16px; color: var(--app-text-secondary); font-size: 12px; }
.legend b { font-family: var(--font-mono, ui-monospace, monospace); font-weight: 500; }
.sq { display: inline-block; width: 10px; height: 10px; margin-right: 6px; border-radius: 2px; vertical-align: middle; }
.drop { background: var(--dorian-danger); }
.pass { background: var(--dorian-viper-400); }

.seg {
  gap: 0;
  padding: 3px;
  border: 1px solid var(--app-border);
  border-radius: 9px;
  background: var(--app-surface-muted);
}

.seg button {
  height: 30px;
  min-width: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.seg button.on { background: var(--app-surface-hover); color: var(--app-heading); font-weight: 600; }

.chart { min-height: 260px; margin-top: 12px; }
.empty { margin: 8px 0 12px; color: var(--app-text-muted); font-size: 13px; }

.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 16px;
}

.sources, .console {
  display: flex;
  flex-direction: column;
  min-height: 520px;
  max-height: none;
  flex: 1;
}

.sources { padding: 0; overflow: hidden; }
.sources__head, .sources__cols, .sources footer, .console header, .console footer { padding-left: 18px; padding-right: 18px; }
.sources__head { padding-top: 16px; flex-direction: column; align-items: stretch; gap: 12px; }
.sources__title { justify-content: space-between; gap: 12px; }
.search {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-input-bg);
}
.search input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--app-text);
  font: inherit;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 13px;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.sources__cols, .sources__row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 0.9fr) minmax(0, 0.8fr);
  align-items: center;
  gap: 8px;
}
.sources__cols {
  padding-top: 10px;
  padding-bottom: 10px;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
  color: var(--app-text-muted);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.sources__cols span:last-child, .sources__row .status { text-align: right; }
.sources__list { flex: 1; min-height: 0; overflow: auto; }
.sources__row {
  height: 40px;
  padding: 0 18px;
  border-bottom: 1px solid var(--app-border);
  font-size: 13px;
}
.chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 5px;
  background: var(--dorian-gold-dim);
  color: var(--dorian-warn);
  font-size: 11px;
  font-style: normal;
  font-weight: 600;
}
.chip.stomp { background: color-mix(in srgb, var(--dorian-l7) 18%, transparent); color: var(--dorian-l7); }
.chip.udp { background: color-mix(in srgb, var(--dorian-l4) 18%, transparent); color: var(--dorian-l4); }
.status { color: var(--app-text-muted); font-size: 12px; }
.status.hot { color: var(--dorian-warn); }
.status.hot::before, .stream.live i { content: ''; }
.status.hot::before {
  content: '● ';
}

.console {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-bg);
  overflow: hidden;
}
.console header { padding-top: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--app-border); }
.stream { display: inline-flex; align-items: center; gap: 6px; }
.stream i, .stream.live i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-text-muted);
}
.stream.live i { background: var(--dorian-viper-400); }
.console__log {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 0;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12.5px;
}
.console__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 18px;
}
.watched { display: flex; flex-wrap: wrap; gap: 6px; }
.watched span {
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  border: 1px solid var(--app-border);
  border-radius: 5px;
  background: var(--app-surface-muted);
  color: var(--app-text-secondary);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  font-weight: 600;
}
.counters { display: flex; flex-wrap: wrap; gap: 6px; }
.counters span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 20px;
  padding: 0 7px;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  background: var(--app-surface-elevated);
  color: var(--app-text);
}
.counters b { color: var(--app-text-muted); font-weight: 500; }

.sources footer, .console footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  border-top: 1px solid var(--app-border);
  color: var(--app-text-muted);
  font-size: 12px;
}
.console footer { border-top-color: var(--app-border); }
footer button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-text-secondary);
  font: inherit;
  font-size: 12px;
  text-decoration: underline;
}

@keyframes attack-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dorian-danger) 55%, transparent); }
  70% { box-shadow: 0 0 0 7px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

.full-log-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: color-mix(in srgb, var(--app-overlay, rgba(0, 0, 0, 0.45)) 88%, transparent);
}
.full-log {
  display: flex;
  flex-direction: column;
  width: min(1400px, calc(100vw - 40px));
  height: min(900px, calc(100vh - 40px));
  max-height: calc(100vh - 40px);
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-bg);
  box-shadow: 0 18px 48px color-mix(in srgb, #000 35%, transparent);
}
.full-log__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--app-border);
}
.full-log__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.full-log__actions .ghost {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-muted, transparent);
  color: var(--app-text-secondary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.full-log__actions .ghost:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.full-log__head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}
.full-log__meta {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 12px;
}
.full-log__error {
  margin: 0;
  padding: 10px 18px;
  color: var(--dorian-danger);
  border-bottom: 1px solid var(--app-border);
  font-size: 13px;
}
.full-log__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 0 12px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 10.5px;
  line-height: 1.35;
}
.full-log__row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 10px;
  padding: 1px 14px;
  white-space: pre-wrap;
  word-break: break-word;
}
.full-log__row .dim { color: var(--app-text-muted); }
.full-log__text { color: var(--app-text-secondary); }
.full-log__row.lvl-critic .full-log__text { color: var(--dorian-danger); }
.full-log__row.lvl-notice .full-log__text,
.full-log__row.lvl-alert .full-log__text { color: var(--dorian-warn); }
.full-log__row.lvl-debug .full-log__text { color: var(--app-text-muted); }
.full-log__row.lvl-meta .full-log__text { color: var(--app-text-muted); font-style: italic; }
.full-log__row.lvl-counter .full-log__text { color: var(--app-text); }
.full-log__empty,
.full-log__more {
  margin: 12px 18px;
  color: var(--app-text-muted);
  font-size: 12px;
}

@media (max-width: 980px) {
  .kpis, .split, .attack-console__times { grid-template-columns: 1fr 1fr; display: grid; }
  .attack-console__times { display: grid; gap: 12px; }
  .sources, .console { max-height: none; }
}
</style>
