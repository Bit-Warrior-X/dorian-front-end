<template>
  <div class="l7-console-backdrop" @click.self="emit('close')">
    <section class="l7-console" role="dialog" aria-modal="true" aria-labelledby="l7-console-title">
      <header class="l7-console__header">
        <div class="l7-console__chips">
          <span class="pill" :class="{ live: stillActive }">
            <i></i>{{ stillActive ? 'Active · temp-block' : 'Ended · expired' }}
          </span>
          <span class="pill layer">L7 · Temporary block</span>
          <span class="pill edge">{{ event?.serverName || 'Edge' }}</span>
          <div class="l7-console__chips-spacer"></div>
          <RouterLink class="ghost" :to="{ name: 'server-blacklist' }" @click="emit('close')">
            Temporary blocks
          </RouterLink>
          <button class="icon" type="button" aria-label="Close" @click="emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6L6 18"></path>
            </svg>
          </button>
        </div>

        <div class="l7-console__title-row">
          <div>
            <h2 id="l7-console-title" class="mono">{{ event?.sourceIp || 'Temporary block' }}</h2>
            <p class="mono muted">{{ subtitle }}</p>
          </div>
          <dl class="l7-console__times">
            <div>
              <dt>Blocked</dt>
              <dd>{{ formatClock(blockedMs) || '—' }}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{{ formatClock(expiresMs) || '—' }}</dd>
            </div>
            <div>
              <dt>TTL</dt>
              <dd>{{ ttlLabel }}</dd>
            </div>
            <div>
              <dt>Remaining</dt>
              <dd :class="{ warn: stillActive }">{{ remainingLabel }}</dd>
            </div>
          </dl>
        </div>

        <div v-if="blockedMs" class="track">
          <div class="track__base"></div>
          <div class="track__warm" :style="{ width: `${progressPercent}%` }"></div>
          <div class="track__hot" :style="{ left: `${progressPercent}%` }"></div>
          <div class="track__mark start">
            <i></i>
            <span>Blocked <b>{{ formatClock(blockedMs) }}</b></span>
          </div>
          <div class="track__mark end">
            <i :class="{ done: !stillActive }"></i>
            <span>{{ stillActive ? 'Holding' : 'Released' }} <b>{{ formatClock(stillActive ? now : expiresMs) }}</b></span>
          </div>
        </div>
      </header>

      <div class="l7-console__body">
        <section class="facts" aria-label="Block details">
          <article>
            <span>Trigger rule</span>
            <p><strong>{{ ruleLabel(event?.triggerRule) }}</strong></p>
            <small class="mono">{{ event?.triggerRule || '—' }}</small>
          </article>
          <article>
            <span>Site</span>
            <p><strong>{{ event?.siteDomain || (event?.siteId ? `Site ${event.siteId}` : '—') }}</strong></p>
            <small>{{ event?.siteId ? `id ${event.siteId}` : 'No site attached' }}</small>
          </article>
          <article>
            <span>Edge</span>
            <p><strong>{{ event?.serverName || '—' }}</strong></p>
            <small class="mono">{{ event?.serverIp || (event?.serverId ? `id ${event.serverId}` : '—') }}</small>
          </article>
          <article>
            <span>Geo</span>
            <p><strong>{{ geoLabel }}</strong></p>
            <small>From edge report</small>
          </article>
        </section>

        <section class="panel">
          <header class="panel__head">
            <div>
              <h3>Request</h3>
              <p class="panel__desc">URL that triggered the temporary block</p>
            </div>
          </header>
          <p class="request mono">{{ event?.url || '(no URL recorded)' }}</p>
        </section>

        <section class="panel">
          <header class="panel__head">
            <div>
              <h3>Same-IP history</h3>
              <p class="panel__desc">
                Other Temporary block adds for {{ event?.sourceIp || 'this IP' }}
                <template v-if="rangeLabel"> · {{ rangeLabel }}</template>
              </p>
            </div>
            <span v-if="related.length" class="count">{{ related.length }}</span>
          </header>
          <p v-if="relatedLoading" class="empty">Loading related blocks…</p>
          <p v-else-if="relatedError" class="empty">{{ relatedError }}</p>
          <p v-else-if="!related.length" class="empty">No other temp-block events for this IP in range.</p>
          <div v-else class="history">
            <button
              v-for="row in related"
              :key="row.id || `${row.sourceIp}-${row.blockedAt}`"
              type="button"
              class="history__row"
              :class="{ current: isCurrent(row) }"
              @click="emit('select', row)"
            >
              <span class="mono dim">{{ formatClock(row.blockedAt) }}</span>
              <span class="badge">{{ ruleLabel(row.triggerRule) }}</span>
              <span class="mono uri" :title="row.url || ''">{{ row.url || '(no URL)' }}</span>
              <span class="dim">{{ row.siteDomain || row.serverName || '—' }}</span>
            </button>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { FIREWALL_RULE_TYPES, fetchSecurityAttacks } from '@/api/securityAnalytics'

const props = defineProps({
  event: { type: Object, required: true },
  range: { type: String, default: '24h' },
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  serverId: { type: [String, Number], default: 'all' },
  siteId: { type: [String, Number], default: 'all' },
  rangeLabel: { type: String, default: '' },
})

const emit = defineEmits(['close', 'select'])

const now = ref(Date.now())
const related = ref([])
const relatedLoading = ref(false)
const relatedError = ref('')
let clockTimer = 0

const ruleLabelMap = Object.fromEntries(FIREWALL_RULE_TYPES.map((row) => [row.ruleType, row.label]))
const ruleLabel = (value) => {
  const key = String(value || '').trim()
  if (!key) return 'Temporary block'
  return ruleLabelMap[key] || key
}

const parseMs = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Date.parse(value || '')
  return Number.isFinite(parsed) ? parsed : 0
}

const blockedMs = computed(() => parseMs(props.event?.blockedAt || props.event?.timestamp || props.event?.createdAt))
const ttlSeconds = computed(() => {
  const ttl = Number(props.event?.ttlSeconds)
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 0
})
const expiresMs = computed(() => (blockedMs.value && ttlSeconds.value ? blockedMs.value + ttlSeconds.value * 1000 : 0))
const stillActive = computed(() => expiresMs.value > 0 && now.value < expiresMs.value)

const ttlLabel = computed(() => {
  if (!ttlSeconds.value) return '—'
  const seconds = ttlSeconds.value
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  if (minutes < 60) return remain ? `${minutes}m ${remain}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins ? `${hours}h ${mins}m` : `${hours}h`
})

const remainingLabel = computed(() => {
  if (!expiresMs.value) return '—'
  const delta = Math.round((expiresMs.value - now.value) / 1000)
  if (delta <= 0) return 'Expired'
  if (delta < 60) return `${delta}s`
  const minutes = Math.floor(delta / 60)
  const seconds = delta % 60
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, '0')}s`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${String(mins).padStart(2, '0')}m`
})

const progressPercent = computed(() => {
  if (!blockedMs.value || !expiresMs.value || expiresMs.value <= blockedMs.value) return stillActive.value ? 0 : 100
  const ratio = (Math.min(now.value, expiresMs.value) - blockedMs.value) / (expiresMs.value - blockedMs.value)
  return Math.max(0, Math.min(100, Math.round(ratio * 100)))
})

const geoLabel = computed(() => {
  const parts = [props.event?.city, props.event?.country].map((part) => String(part || '').trim()).filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
})

const subtitle = computed(() => {
  const parts = [
    ruleLabel(props.event?.triggerRule),
    props.event?.siteDomain,
    props.event?.url,
  ].map((part) => String(part || '').trim()).filter(Boolean)
  return parts.join(' · ') || 'L7 temporary block'
})

const formatClock = (value) => {
  const ms = parseMs(value)
  if (!ms) return ''
  return new Date(ms).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const isCurrent = (row) => {
  if (props.event?.id && row?.id) return Number(props.event.id) === Number(row.id)
  return String(row?.blockedAt || '') === String(props.event?.blockedAt || '')
    && String(row?.url || '') === String(props.event?.url || '')
}

const loadRelated = async () => {
  const ip = String(props.event?.sourceIp || '').trim()
  if (!ip) {
    related.value = []
    return
  }
  relatedLoading.value = true
  relatedError.value = ''
  try {
    const params = {
      range: props.range || '24h',
      serverId: props.serverId,
      siteId: props.siteId,
      limit: 40,
      ip,
    }
    if (props.start) params.start = props.start
    if (props.end) params.end = props.end
    const rows = await fetchSecurityAttacks('recent', params)
    related.value = Array.isArray(rows) ? rows : []
  } catch (err) {
    relatedError.value = err?.message || 'Related blocks could not be loaded.'
    related.value = []
  } finally {
    relatedLoading.value = false
  }
}

watch(() => [props.event?.sourceIp, props.event?.id, props.range, props.start, props.end, props.serverId, props.siteId], loadRelated)

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
  loadRelated()
})

onBeforeUnmount(() => {
  window.clearInterval(clockTimer)
})
</script>

<style scoped>
.l7-console-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--app-overlay);
}

.l7-console {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(960px, 100%);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  border: 1px solid var(--app-border-strong);
  border-radius: 16px;
  background: var(--app-surface-solid);
  color: var(--app-text);
  box-shadow: 0 24px 80px var(--app-shadow);
  font-size: 14px;
}

.l7-console__header {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 28px 18px;
  border-bottom: 1px solid var(--app-border);
}

.l7-console__chips,
.l7-console__title-row,
.panel__head {
  display: flex;
  align-items: center;
}

.l7-console__chips {
  gap: 8px;
  flex-wrap: wrap;
}

.l7-console__chips-spacer { flex: 1; }

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
  animation: l7-pulse 1.6s ease-out infinite;
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
.icon {
  border: 1px solid var(--app-btn-surface-border);
  border-radius: 8px;
  background: var(--app-btn-surface-bg);
  color: var(--app-btn-surface-fg);
  cursor: pointer;
  text-decoration: none;
}

.ghost {
  display: inline-flex;
  align-items: center;
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

.l7-console__title-row {
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.l7-console h2 {
  margin: 0;
  color: var(--app-heading);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.mono { font-family: var(--font-mono, ui-monospace, monospace); }
.muted, .dim { color: var(--app-text-muted); }
.l7-console__title-row .muted { margin: 4px 0 0; font-size: 11px; }

.l7-console__times {
  display: flex;
  gap: 28px;
  margin: 0;
}

.l7-console__times dt {
  color: var(--app-text-muted);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.l7-console__times dd {
  margin: 2px 0 0;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 13px;
}

.l7-console__times .warn { color: var(--dorian-warn); }

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
.track__hot {
  width: 4px;
  margin-left: -2px;
  background: var(--dorian-warn);
}

.track__mark {
  position: absolute;
  top: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.track__mark.start { left: 0; }
.track__mark.end { right: 0; align-items: flex-end; text-align: right; }

.track__mark i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--dorian-warn);
  background: var(--app-surface-solid);
}

.track__mark i.done {
  background: var(--dorian-warn);
}

.track__mark span {
  color: var(--app-text-muted);
  font-size: 11px;
}

.track__mark b {
  color: var(--app-heading);
  font-weight: 600;
}

.l7-console__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 28px 24px;
  overflow: auto;
}

.facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.facts article {
  padding: 14px 14px 12px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-muted);
}

.facts span {
  display: block;
  margin-bottom: 8px;
  color: var(--app-text-muted);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.facts p {
  margin: 0;
  color: var(--app-heading);
  font-size: 15px;
  line-height: 1.3;
}

.facts small {
  display: block;
  margin-top: 6px;
  color: var(--app-text-muted);
  font-size: 11px;
}

.panel {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-muted);
  overflow: hidden;
}

.panel__head {
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 0;
}

.panel__head h3 {
  margin: 0;
  color: var(--app-heading);
  font-size: 14px;
}

.panel__desc {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 12px;
}

.count {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--app-surface-elevated);
  color: var(--app-text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.request {
  margin: 12px 16px 16px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--app-surface-solid);
  color: var(--app-heading);
  word-break: break-all;
  line-height: 1.45;
}

.empty {
  margin: 12px 16px 16px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.history {
  display: flex;
  flex-direction: column;
  margin: 8px 0 0;
  max-height: 280px;
  overflow: auto;
}

.history__row {
  display: grid;
  grid-template-columns: 140px 140px minmax(0, 1fr) 120px;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 10px 16px;
  border: 0;
  border-top: 1px solid var(--app-border);
  background: transparent;
  color: var(--app-heading);
  text-align: left;
  cursor: pointer;
}

.history__row:hover,
.history__row.current {
  background: color-mix(in srgb, #ffffff 4%, transparent);
}

.badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  height: 22px;
  padding: 0 8px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--dorian-warn) 14%, transparent);
  color: var(--dorian-warn);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.uri {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

@keyframes l7-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--dorian-danger) 45%, transparent); }
  70% { box-shadow: 0 0 0 8px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

@media (max-width: 860px) {
  .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .history__row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

@media (max-width: 560px) {
  .l7-console__header,
  .l7-console__body { padding-left: 16px; padding-right: 16px; }
  .facts { grid-template-columns: 1fr; }
  .l7-console__times { flex-wrap: wrap; gap: 14px 20px; }
}
</style>
