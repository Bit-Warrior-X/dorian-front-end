<template>
  <section class="dash-attacks" :class="{ live: liveAttacks.length }" aria-label="Attack alerts">
    <div class="dash-attacks__head">
      <h3>
        <span class="dash-attacks__dot" :class="{ live: liveAttacks.length }" aria-hidden="true"></span>
        Attack alerts
      </h3>
      <div class="dash-attacks__stats">
        <span><b class="num">{{ attacksToday.length }}</b> {{ attacksToday.length === 1 ? 'attack' : 'attacks' }} today</span>
        <span><b class="num">{{ formatNumber(sourcesToday) }}</b> sources blocked today</span>
        <RouterLink class="dash-panel-link" :to="{ name: detectionRoute }">Detection</RouterLink>
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
        <template v-else> · no attacks recorded{{ isAllServers ? '' : ' on this edge' }}</template>
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

    <SecurityEventDialog :event="selectedSecurityEvent" @close="selectedSecurityEvent = null" />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import SecurityEventDialog from '@/components/SecurityEventDialog.vue'
import { openAttackConsole } from '@/stores/attackAlert'
import { fetchSecurityEvents } from '@/api/dashboard'
import { getApexSeriesColors } from '@/utils/chartTheme'

const props = defineProps({
  /** Edge filter: `'all'` or a server id. */
  serverId: {
    type: [String, Number],
    default: 'all',
  },
  detectionRoute: {
    type: String,
    default: 'attack-detection',
  },
  refreshMs: {
    type: Number,
    default: 10_000,
  },
})

const securityEvents = ref([])
const selectedSecurityEvent = ref(null)
const nowMs = ref(Date.now())
let clockTimer = null
let pollTimer = null
let pollInFlight = false

const isAllServers = computed(() => {
  const raw = props.serverId
  return raw === 'all' || raw === '' || raw == null
})

const scopedPeriods = computed(() => securityEvents.value.filter((period) => (
  isAllServers.value || String(period.serverId ?? '') === String(props.serverId)
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

const formatNumber = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0'
  return numeric.toLocaleString()
}

const formatLogTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const openSecurityEvent = (event) => {
  if (event?.reqId) {
    openAttackConsole(event.reqId)
    return
  }
  selectedSecurityEvent.value = event
}

const loadSecurityEvents = async () => {
  if (pollInFlight) return
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  pollInFlight = true
  try {
    const payload = await fetchSecurityEvents(30)
    securityEvents.value = Array.isArray(payload) ? payload : []
  } catch {
    securityEvents.value = []
  } finally {
    pollInFlight = false
  }
}

const onVisible = () => {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    void loadSecurityEvents()
  }
}

watch(() => props.serverId, () => {
  // Scope is computed — no reload needed; refresh for freshness when filter changes.
  void loadSecurityEvents()
})

onMounted(() => {
  void loadSecurityEvents()
  clockTimer = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
  pollTimer = window.setInterval(() => {
    void loadSecurityEvents()
  }, props.refreshMs)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisible)
  }
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
  if (pollTimer) window.clearInterval(pollTimer)
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisible)
  }
})
</script>

<style scoped>
.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
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

.dash-attack-vectors i {
  display: block;
  height: 100%;
  min-width: 4px;
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

.dash-panel-link {
  color: var(--dorian-viper-400, var(--app-accent));
  font-weight: 600;
  text-decoration: none;
}

.dash-panel-link:hover {
  text-decoration: underline;
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

@media (prefers-reduced-motion: reduce) {
  .dash-attacks__dot.live,
  .dash-live-attack__badge i {
    animation: none;
  }
}
</style>
