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
          <button class="ghost" type="button" @click="showRawLogs">Raw logs</button>
          <button class="icon" type="button" aria-label="Close attack view" @click="emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6L6 18"></path>
            </svg>
          </button>
        </div>

        <div class="attack-console__title-row">
          <div>
            <h2 id="attack-console-title">{{ headline }}</h2>
            <p class="mono muted">{{ attack?.title || 'L4 attack' }}</p>
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
        <section class="kpis" aria-label="Summary">
          <article>
            <span>Peak ingress</span>
            <p><strong>{{ peakIngress.value }}</strong><em>at the firewall</em></p>
            <small v-if="peakIngress.at"><b>{{ peakIngress.dropShare }}% dropped</b> · {{ formatClock(peakIngress.at) }}</small>
            <small v-else>No samples yet</small>
          </article>
          <article>
            <span>Sources blocked</span>
            <p><strong>{{ sourceCount }}</strong><em>unique IPs</em></p>
            <small><b>{{ activeCount }} still active</b> · {{ Math.max(0, sourceCount - activeCount) }} released</small>
          </article>
          <article>
            <span>Attack vectors</span>
            <div v-if="vectorParts.length" class="vectors">
              <i v-for="part in vectorParts" :key="part.type" :style="{ width: part.width, background: part.color }"></i>
            </div>
            <div class="vector-legend">
              <span v-for="part in vectorParts" :key="`${part.type}-label`">
                <i :style="{ background: part.color }"></i>{{ part.type }} <b>{{ part.count }}</b>
              </span>
              <span v-if="!vectorParts.length">{{ primaryType }}</span>
            </div>
          </article>
          <article>
            <span>Detector reports</span>
            <p><strong>{{ attack?.eventCount ?? 0 }}</strong><em>{{ durationLabel ? `over ${durationLabel}` : 'reports' }}</em></p>
            <small>{{ modeLabel }}</small>
          </article>
        </section>

        <section class="panel">
          <header class="panel__head">
            <div>
              <h3>Traffic during event</h3>
              <p>{{ chartCaption }}</p>
            </div>
            <div class="legend">
              <span><i class="sq drop"></i>Dropped <b>{{ droppedTotal }}</b></span>
              <span><i class="sq pass"></i>Passed <b>{{ passedTotal }}</b></span>
            </div>
          </header>
          <div ref="trafficChartEl" class="chart" role="img" :aria-label="chartCaption"></div>
          <p v-if="loaded && !hasDrops" class="empty">No firewall samples yet.</p>
        </section>

        <div class="split">
          <section class="panel sources">
            <header class="panel__head sources__head">
              <div class="sources__title">
                <h3>Blocked sources</h3>
                <div class="seg" role="group" aria-label="Filter sources">
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
              <span>Source</span><span>Vector</span><span>Blocked</span><span>Status</span>
            </div>
            <p v-if="loaded && !visibleSources.length" class="empty">{{ sourcesEmptyText }}</p>
            <div v-else class="sources__list">
              <div v-for="source in visibleSources" :key="source.ip" class="sources__row">
                <span class="mono">{{ source.ip }}</span>
                <span><em class="chip" :class="vectorClass(source.attackType)">{{ source.attackType || 'L4' }}</em></span>
                <span class="mono dim" :title="source.blocks > 1 ? `Blocked ${source.blocks} times, first at ${formatClock(source.firstBlockedAt)}` : ''">{{ formatClock(source.lastBlockedAt) }}</span>
                <span class="status" :class="{ hot: source.active }">{{ sourceStatus(source) }}</span>
              </div>
            </div>
            <footer>
              <span>Showing {{ visibleSources.length }} of {{ srcFilter === 'active' ? `${activeCount} active` : sourceCount }}</span>
              <button type="button" @click="openEdge">View all in firewall</button>
            </footer>
          </section>

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
            <p v-if="spartaError" class="empty">{{ spartaError }}</p>
            <div v-else class="console__log">
              <p v-if="loaded && !logs.length" class="empty">{{ ongoing ? 'Waiting for Sparta counters…' : 'No Sparta counters in this time range.' }}</p>
              <div v-for="(line, index) in logs" :key="index" class="console__row">
                <span class="mono dim">{{ formatClock(line.time) }}</span>
                <span class="counters">
                  <span v-for="counter in line.counters" :key="counter.k">
                    <b>{{ counter.k }}</b>{{ counter.v }}
                  </span>
                </span>
              </div>
            </div>
            <footer>
              <span>Counters shown as dropped / passed per second</span>
              <button type="button" @click="openEdge">Open full log</button>
            </footer>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ApexCharts from 'apexcharts'
import { fetchAttackConsole } from '@/api/dashboard'
import { getApexChartColors, getApexSeriesColors, getApexTooltipTheme } from '@/utils/chartTheme'

const props = defineProps({
  reqId: { type: String, required: true },
})
const emit = defineEmits(['close'])
const router = useRouter()

const SAMPLE_MS = 5000
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
const error = ref('')
const loaded = ref(false)
const now = ref(Date.now())
const srcFilter = ref('active')
let srcFilterChosen = false
const srcQuery = ref('')
const trafficChartEl = ref(null)
const spartaEl = ref(null)
let trafficChart = null
let pollTimer = 0
let clockTimer = 0

const ongoing = computed(() => attack.value?.status === 'ongoing')
const hasDrops = computed(() => drops.value.length > 0)
const primaryType = computed(() => attackTypes.value[0]?.type || attack.value?.attackType || 'L4')
const headline = computed(() => {
  const names = attackTypes.value.map((item) => item.type).filter(Boolean).slice(0, 3)
  if (names.length > 1) return `${names.join(' + ')} flood`
  return `${names[0] || primaryType.value} flood`
})
const layerChip = computed(() => {
  const label = primaryType.value.toUpperCase()
  if (label.includes('UDP')) return 'L4 · UDP'
  if (label.includes('ICMP')) return 'L4 · ICMP'
  if (label.includes('GRE')) return 'L4 · GRE'
  return 'L4 · TCP'
})
const protectionOn = computed(() => {
  const raw = String(protection.value || '')
  if (raw.includes('END')) return false
  if (raw.includes('START')) return true
  return ongoing.value
})
const modeLabel = computed(() => {
  const title = String(attack.value?.title || '')
  if (title.includes('FIXED')) return 'Mode: fixed block · XDP'
  if (title.includes('BURST')) return 'Mode: burst block · XDP'
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
const peakIngress = computed(() => {
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
const droppedTotal = computed(() => formatBytes(drops.value.reduce((sum, point) => sum + (Number(point.blocked) || 0), 0)))
const passedTotal = computed(() => formatBytes(drops.value.reduce((sum, point) => sum + (Number(point.allowed) || 0), 0)))
const vectorParts = computed(() => {
  const total = attackTypes.value.reduce((sum, item) => sum + (Number(item.count) || 0), 0) || 1
  return attackTypes.value.slice(0, 4).map((item, index) => ({
    type: item.type,
    count: item.count,
    width: `${Math.max(6, Math.round(((Number(item.count) || 0) / total) * 100))}%`,
    color: vectorColor(item.type, index),
  }))
})
const visibleSources = computed(() => {
  const query = srcQuery.value.trim().toLowerCase()
  return sources.value.filter((source) => (
    (srcFilter.value === 'all' || source.active)
    && (!query || String(source.ip || '').toLowerCase().includes(query))
  ))
})
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
    .map(parseLogLine)
    .filter((line) => line?.isCounter)
    .map((line) => ({
      ...line,
      counters: watched.size ? line.counters.filter((counter) => watched.has(counter.k)) : line.counters,
    }))
    .filter((line) => line.counters.length)
})
const logRangeLabel = computed(() => {
  const { start, end } = windowRange.value
  return start && end ? `${formatClock(start)} – ${formatClock(end)}` : ''
})
const sourcesEmptyText = computed(() => {
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
  return `${range}${SAMPLE_MS / 1000} s samples · shaded = attack window`
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
  return new Date(parsed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatShortClock = (value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

const formatBandwidthValue = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return '0 Kbps'
  if (numeric >= 1024 * 1024) return `${(numeric / (1024 * 1024)).toFixed(1)} Gbps`
  if (numeric >= 1024) return `${(numeric / 1024).toFixed(1)} Mbps`
  return `${Math.round(numeric)} Kbps`
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
  if (label.includes('ACK') || label.includes('SYN') || label.includes('RST')) return colors.warn
  return [colors.warn, colors.l7, colors.l4, colors.viper][index % 4]
}

const vectorClass = (type) => {
  const label = String(type || '').toUpperCase()
  if (label.includes('STOMP') || label.includes('PSH')) return 'stomp'
  if (label.includes('UDP')) return 'udp'
  return 'ack'
}

const parseLogLine = (entry) => {
  const body = String(entry?.text || '').replace(/\x1b\[[0-9;]*m/g, '').trim()
  if (!body) return null
  const time = entry?.time || ''
  const isCounter = /\b(?:SYN|ACK|PSH|RST|FIN|UDP|ICMP|GRE|STOMP)\s*:/.test(body)
  const counters = []
  if (isCounter) {
    const pattern = /([A-Z][A-Z0-9+]*)\s*:\s*([0-9]+(?:\/[0-9]+)?)/g
    let match = pattern.exec(body)
    while (match) {
      counters.push({ k: match[1], v: match[2] })
      match = pattern.exec(body)
    }
  }
  return { time, body, isCounter: isCounter && counters.length > 0, counters }
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
  if (startedMs.value) {
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
        offsetY: 28,
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
      labels: { style: labelStyle, datetimeUTC: false, format: 'HH:mm' },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      crosshairs: { stroke: { color: theme.crosshair, width: 1, dashArray: 3 } },
    },
    yaxis: {
      min: 0,
      tickAmount: 4,
      forceNiceScale: true,
      labels: { minWidth: 64, style: labelStyle, formatter: formatBandwidthValue },
    },
    tooltip: {
      theme: getApexTooltipTheme(),
      shared: true,
      x: { format: 'HH:mm:ss' },
      y: { formatter: formatBandwidthValue },
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
    const windowStart = Date.parse(payload?.windowStart || '')
    const windowEnd = Date.parse(payload?.windowEnd || '')
    windowRange.value = {
      start: Number.isFinite(windowStart) ? windowStart : null,
      end: Number.isFinite(windowEnd) ? windowEnd : null,
    }
    drops.value = Array.isArray(payload?.drops) ? payload.drops : []
    sources.value = Array.isArray(payload?.sources) ? payload.sources : []
    activeCount.value = Number(payload?.activeCount) || 0
    sourceCount.value = Number(payload?.sourceCount) || sources.value.length
    const serverTime = Date.parse(payload?.serverTime || '')
    clockSkew.value = Number.isFinite(serverTime) ? serverTime - Date.now() : 0
    if (!srcFilterChosen) {
      srcFilter.value = activeCount.value > 0 ? 'active' : 'all'
      srcFilterChosen = true
    }
    attackTypes.value = Array.isArray(payload?.attackTypes) ? payload.attackTypes : []
    protection.value = payload?.protection || ''
    spartaLog.value = Array.isArray(payload?.spartaLog) ? payload.spartaLog : []
    spartaError.value = payload?.spartaError || ''
    error.value = ''
    loaded.value = true
    await renderCharts()
  } catch (err) {
    error.value = err?.message || 'The attack view could not be loaded.'
  } finally {
    loading = false
  }
}

const exportReport = () => {
  const lines = [
    headline.value,
    attack.value?.title || '',
    attack.value?.serverName || '',
    `Started ${formatClock(attack.value?.startedAt) || '—'}`,
    `Duration ${durationLabel.value || '—'}`,
    `Sources ${sourceCount.value} (${activeCount.value} active)`,
    `Reports ${attack.value?.eventCount ?? 0}`,
    '',
    ...sources.value.map((source) => `${source.ip}\t${source.attackType || 'L4'}\t${formatClock(source.firstBlockedAt)}\t${source.active ? 'blocking' : 'released'}`),
  ]
  const blob = new Blob([lines.filter(Boolean).join('\n')], { type: 'text/plain' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `attack-${props.reqId}.txt`
  link.click()
  URL.revokeObjectURL(link.href)
}

const showRawLogs = () => {
  spartaEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

const openEdge = () => {
  const id = attack.value?.serverId
  if (!id) return
  emit('close')
  router.push({ name: 'server-settings', query: { server: String(id) } })
}

onMounted(() => {
  load()
  pollTimer = window.setInterval(load, 3000)
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  window.clearInterval(pollTimer)
  window.clearInterval(clockTimer)
  trafficChart?.destroy()
})

watch(() => props.reqId, () => {
  trafficChart?.destroy()
  trafficChart = null
  srcFilterChosen = false
  load()
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
  padding: 20px 28px 24px;
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

.vector-legend span { display: inline-flex; align-items: center; gap: 6px; }
.vector-legend i { width: 8px; height: 8px; border-radius: 2px; }

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
  min-height: 420px;
  max-height: 460px;
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

@media (max-width: 980px) {
  .kpis, .split, .attack-console__times { grid-template-columns: 1fr 1fr; display: grid; }
  .attack-console__times { display: grid; gap: 12px; }
  .sources, .console { max-height: none; }
}
</style>
