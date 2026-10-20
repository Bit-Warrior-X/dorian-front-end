<template>
  <article class="efc" :class="[`efc--${health.tone}`, { 'efc--refreshing': refreshing }]">
    <header class="efc__head">
      <span class="efc__avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3.5" y="4" width="17" height="6.5" rx="1.6" />
          <rect x="3.5" y="13.5" width="17" height="6.5" rx="1.6" />
          <path d="M7 7.25h.01M7 16.75h.01M11 7.25h6M11 16.75h6" />
        </svg>
        <i class="efc__avatar-dot" />
      </span>

      <div class="efc__identity">
        <div class="efc__title-row">
          <h4 class="efc__name" :title="server.name">{{ server.name || `Edge #${server.id}` }}</h4>
          <span class="efc__tier" :class="`efc__tier--${tierKey}`">{{ server.license || 'Unlicensed' }}</span>
        </div>
        <p class="efc__sub">
          <span class="num">{{ server.ip || 'No IP' }}</span>
          <template v-if="metric?.hostname"><i aria-hidden="true">·</i><span>{{ metric.hostname }}</span></template>
          <template v-if="systemLabel"><i aria-hidden="true">·</i><span>{{ systemLabel }}</span></template>
        </p>
      </div>

      <span class="efc__health" :class="`efc__health--${health.tone}`">
        <i aria-hidden="true" />
        {{ refreshing ? 'Checking…' : health.label }}
      </span>

      <div ref="menuEl" class="efc__menu">
        <button class="efc__icon-btn" type="button" aria-label="Edge actions" :aria-expanded="menuOpen" @click.stop="menuOpen = !menuOpen">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" />
          </svg>
        </button>
        <div v-if="menuOpen" class="efc__dropdown" role="menu">
          <button type="button" role="menuitem" @click="act('configure')">Configure</button>
          <button type="button" role="menuitem" @click="act('edit')">Edit details</button>
          <button type="button" role="menuitem" @click="act('license')">License</button>
          <button type="button" role="menuitem" @click="act('upgrade')">Upgrade software</button>
          <button type="button" role="menuitem" :disabled="refreshing" @click="act('refresh')">
            {{ refreshing ? 'Refreshing…' : 'Refresh status' }}
          </button>
          <hr />
          <button type="button" role="menuitem" class="danger" @click="act('delete')">Delete edge</button>
        </div>
      </div>
    </header>

    <section class="efc__net" aria-label="Network throughput">
      <div class="efc__net-head">
        <div class="efc__rate rx">
          <span class="efc__rate-label"><i aria-hidden="true" />Receive</span>
          <strong class="num">{{ rateValue(metric?.netRxBytesPerSec) }}</strong>
        </div>
        <div class="efc__rate tx">
          <span class="efc__rate-label"><i aria-hidden="true" />Send</span>
          <strong class="num">{{ rateValue(metric?.netTxBytesPerSec) }}</strong>
        </div>
        <div class="efc__net-meta">
          <span class="num">{{ linkLabel }}</span>
          <span class="efc__live" :class="{ on: hasLive }">{{ hasLive ? 'Live' : metric?.error ? 'Unreachable' : 'Waiting' }}</span>
        </div>
      </div>

      <div class="efc__spark">
        <svg v-if="spark" viewBox="0 0 300 72" preserveAspectRatio="none" role="img" :aria-label="`Network history for ${server.name}`">
          <defs>
            <linearGradient :id="`efc-rx-${server.id}`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--efc-rx)" stop-opacity="0.32" />
              <stop offset="100%" stop-color="var(--efc-rx)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <line v-for="y in [18, 36, 54]" :key="y" x1="0" :y1="y" x2="300" :y2="y" class="efc__grid" />
          <path :d="spark.rxArea" :fill="`url(#efc-rx-${server.id})`" />
          <path :d="spark.rxLine" class="efc__line rx" />
          <path :d="spark.txLine" class="efc__line tx" />
        </svg>
        <div v-else class="efc__spark-empty">
          {{ metric?.error ? 'Host unreachable over SSH' : 'Collecting samples…' }}
        </div>
        <span v-if="spark" class="efc__spark-peak num">peak {{ rateValue(spark.peak) }}</span>
        <span v-if="spark" class="efc__spark-window">{{ spark.window }}</span>
      </div>
    </section>

    <section class="efc__vitals" aria-label="Host vitals">
      <div v-for="vital in vitals" :key="vital.key" class="efc__vital">
        <svg class="efc__ring" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="16" class="efc__ring-track" />
          <circle
            cx="20"
            cy="20"
            r="16"
            class="efc__ring-fill"
            :class="vital.tone"
            :stroke-dasharray="`${ringLength} ${ringLength}`"
            :stroke-dashoffset="ringOffset(vital.percent)"
          />
        </svg>
        <div class="efc__vital-copy">
          <span class="efc__vital-label">{{ vital.label }}</span>
          <strong class="num" :class="vital.tone">{{ vital.value }}</strong>
          <span class="efc__vital-detail">{{ vital.detail }}</span>
        </div>
      </div>
    </section>

    <dl class="efc__facts">
      <div><dt>Uptime</dt><dd class="num">{{ uptimeLabel }}</dd></div>
      <div><dt>Load avg</dt><dd class="num">{{ loadLabel }}</dd></div>
      <div><dt>Version</dt><dd class="num">{{ versionLabel }}</dd></div>
      <div><dt>License</dt><dd :class="`efc__expiry--${expiryTone}`">{{ expiryLabel }}</dd></div>
    </dl>

    <footer class="efc__foot">
      <div class="efc__services">
        <span v-for="svc in services" :key="svc.id" class="efc__svc" :class="`efc__svc--${svc.status}`" :title="`${svc.name}: ${svc.label}`">
          <i aria-hidden="true" />{{ svc.short }}
        </span>
      </div>
      <button class="efc__cta" type="button" @click="emit('configure')">
        Configure
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
      </button>
    </footer>
  </article>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  resolveAngelosRuntimeStatus,
  resolveLayerStatus,
  runtimeStatusLabel,
} from '@/utils/serverLayerStatus'

const props = defineProps({
  server: { type: Object, required: true },
  /** Latest host-metrics probe; `{ error: true }` when the probe failed. */
  metric: { type: Object, default: null },
  /** Throughput history `{ t, rx, tx }` in bytes/s, oldest first. */
  samples: { type: Array, default: () => [] },
  refreshing: { type: Boolean, default: false },
  expiryLabel: { type: String, default: '—' },
  expiryTone: { type: String, default: 'none' },
  versionLabel: { type: String, default: '—' },
  osLabel: { type: String, default: '' },
})

const emit = defineEmits(['configure', 'edit', 'license', 'upgrade', 'refresh', 'delete'])

const menuOpen = ref(false)
const menuEl = ref(null)

const act = (name) => {
  menuOpen.value = false
  emit(name)
}

const onDocClick = (event) => {
  if (menuOpen.value && menuEl.value && !menuEl.value.contains(event.target)) menuOpen.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

const angelos = computed(() => resolveAngelosRuntimeStatus(props.server))

const health = computed(() => {
  if (props.metric?.error) return { tone: 'danger', label: 'Unreachable' }
  if (angelos.value === 'stopped') return { tone: 'danger', label: 'Offline' }
  const cpu = props.metric?.cpuPercent
  if (cpu != null && cpu >= 90) return { tone: 'danger', label: 'Critical load' }
  if (cpu != null && cpu >= 70) return { tone: 'warn', label: 'High load' }
  if (angelos.value === 'running') return { tone: 'ok', label: 'Healthy' }
  if (angelos.value === 'deployed') return { tone: 'info', label: 'Deployed' }
  return { tone: 'muted', label: 'Unknown' }
})

const tierKey = computed(() => String(props.server.license || 'none').toLowerCase())

const systemLabel = computed(() => props.osLabel || props.metric?.kernel || '')

const hasLive = computed(() => props.metric != null && !props.metric.error && props.metric.netRxBytesPerSec != null)

const formatBitRate = (bytesPerSec) => {
  const bits = Number(bytesPerSec) * 8
  if (!Number.isFinite(bits) || bits < 0) return '—'
  if (bits >= 1e9) return `${(bits / 1e9).toFixed(2)} Gbps`
  if (bits >= 1e6) return `${(bits / 1e6).toFixed(1)} Mbps`
  if (bits >= 1e3) return `${(bits / 1e3).toFixed(1)} Kbps`
  return `${Math.round(bits)} bps`
}

const rateValue = (bytesPerSec) => {
  if (!props.metric) return '…'
  if (props.metric.error && bytesPerSec == null) return '—'
  return bytesPerSec == null ? '—' : formatBitRate(bytesPerSec)
}

const linkLabel = computed(() => {
  const mbps = Number(props.metric?.netLinkMbps)
  const iface = props.metric?.netInterface || ''
  const speed = Number.isFinite(mbps) && mbps > 0 ? (mbps >= 1000 ? `${mbps / 1000} Gbps` : `${mbps} Mbps`) : ''
  return [iface, speed].filter(Boolean).join(' · ') || 'NIC'
})

const buildPath = (points, key, max, closeArea = false) => {
  const n = points.length
  const coords = points.map((p, i) => {
    const x = n === 1 ? 300 : (i / (n - 1)) * 300
    const y = 68 - (Math.max(0, Number(p[key]) || 0) / max) * 60
    return [x, y]
  })
  let d = `M${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`
  for (let i = 1; i < coords.length; i += 1) {
    const [x0, y0] = coords[i - 1]
    const [x1, y1] = coords[i]
    const cx = (x0 + x1) / 2
    d += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
  }
  if (closeArea) d += ` L300,72 L${coords[0][0].toFixed(1)},72 Z`
  return d
}

const spark = computed(() => {
  const points = props.samples
  if (!Array.isArray(points) || points.length < 2) return null
  const peak = Math.max(1, ...points.map((p) => Math.max(Number(p.rx) || 0, Number(p.tx) || 0)))
  const max = peak * 1.12
  const spanMin = Math.max(1, Math.round((points.at(-1).t - points[0].t) / 60000))
  return {
    rxLine: buildPath(points, 'rx', max),
    rxArea: buildPath(points, 'rx', max, true),
    txLine: buildPath(points, 'tx', max),
    peak,
    window: spanMin >= 60 ? `last ${Math.round(spanMin / 60)}h` : `last ${spanMin}m`,
  }
})

const ringLength = 2 * Math.PI * 16
const ringOffset = (percent) => {
  const p = percent == null ? 0 : Math.min(100, Math.max(0, percent))
  return ringLength * (1 - p / 100)
}

const pct = (used, total) => {
  const t = Number(total)
  const u = Number(used)
  if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(u)) return null
  return Math.min(100, Math.max(0, Math.round((u / t) * 100)))
}

const formatUsage = (used, total) => {
  const t = Number(total)
  if (!Number.isFinite(t) || t <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exp = Math.min(units.length - 1, Math.floor(Math.log(t) / Math.log(1024)))
  const scale = (v) => {
    const n = (Number(v) || 0) / 1024 ** exp
    return n >= 100 ? n.toFixed(0) : String(Number(n.toFixed(1)))
  }
  return `${scale(used)}/${scale(t)} ${units[exp]}`
}

const tone = (p, warn = 70, danger = 90) => {
  if (p == null) return 'idle'
  if (p >= danger) return 'danger'
  if (p >= warn) return 'warn'
  return 'ok'
}

const vitals = computed(() => {
  const m = props.metric
  const pending = !m ? '…' : m.error && m.cpuPercent == null ? '—' : null
  const cpu = m?.cpuPercent == null ? null : Math.round(Number(m.cpuPercent))
  const mem = pct(m?.memoryUsedBytes, m?.memoryTotalBytes)
  const disk = pct(m?.diskUsedBytes, m?.diskTotalBytes)
  const temp = m?.temperatureC == null ? null : Math.round(Number(m.temperatureC))
  return [
    {
      key: 'cpu',
      label: 'CPU',
      value: pending ?? (cpu == null ? '—' : `${cpu}%`),
      detail: m?.cpuCores ? `${m.cpuCores} cores` : '—',
      percent: cpu,
      tone: tone(cpu),
    },
    {
      key: 'mem',
      label: 'Memory',
      value: pending ?? (mem == null ? '—' : `${mem}%`),
      detail: formatUsage(m?.memoryUsedBytes, m?.memoryTotalBytes),
      percent: mem,
      tone: tone(mem, 80, 92),
    },
    {
      key: 'disk',
      label: 'Disk',
      value: pending ?? (disk == null ? '—' : `${disk}%`),
      detail: formatUsage(m?.diskUsedBytes, m?.diskTotalBytes),
      percent: disk,
      tone: tone(disk, 80, 92),
    },
    {
      key: 'temp',
      label: 'Temp',
      value: pending ?? (temp == null ? '—' : `${temp}°C`),
      detail: m?.temperatureLabel || (temp == null ? 'no sensor' : 'package'),
      percent: temp,
      tone: tone(temp, 70, 85),
    },
  ]
})

const uptimeLabel = computed(() => {
  const s = Number(props.metric?.uptimeSeconds)
  if (!Number.isFinite(s) || s <= 0) return props.metric ? '—' : '…'
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  if (d > 0) return `${d}d ${h}h`
  return `${h}h ${Math.floor((s % 3600) / 60)}m`
})

const loadLabel = computed(() => {
  const m = props.metric
  if (!m) return '…'
  if (m.load1 == null) return '—'
  return [m.load1, m.load5, m.load15].map((v) => Number(v || 0).toFixed(2)).join('  ')
})

const services = computed(() => {
  const l4 = resolveLayerStatus(props.server, 'l4')
  const l7 = resolveLayerStatus(props.server, 'l7')
  return [
    { id: 'angelos', short: 'Angelos', name: 'Angelos', status: angelos.value, label: runtimeStatusLabel(angelos.value) },
    { id: 'sparta', short: 'L4 Sparta', name: 'Sparta (L4)', status: l4, label: runtimeStatusLabel(l4) },
    { id: 'athens', short: 'L7 Athens', name: 'Athens (L7)', status: l7, label: runtimeStatusLabel(l7) },
  ]
})
</script>

<style scoped>
.efc {
  --efc-rx: var(--dorian-viper-400, #3fbd85);
  --efc-tx: var(--dorian-l4, #6b9fd4);
  --efc-tone: var(--dorian-viper-400, #3fbd85);
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: 14px;
  border: 0.5px solid var(--app-border);
  background:
    radial-gradient(120% 70% at 0% 0%, color-mix(in srgb, var(--efc-tone) 9%, transparent) 0%, transparent 55%),
    var(--app-surface);
  overflow: visible;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.efc:hover {
  border-color: color-mix(in srgb, var(--efc-tone) 38%, var(--app-border));
  box-shadow: 0 10px 28px -18px color-mix(in srgb, var(--efc-tone) 60%, transparent);
}

.efc--ok { --efc-tone: var(--dorian-viper-400, #3fbd85); }
.efc--warn { --efc-tone: var(--dorian-warn, #e0a83f); }
.efc--danger { --efc-tone: var(--dorian-danger, #e15241); }
.efc--info { --efc-tone: var(--dorian-l4, #6b9fd4); }
.efc--muted { --efc-tone: var(--app-text-muted); }

.efc--refreshing { opacity: 0.85; }

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

/* Header */
.efc__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 14px 14px 12px 16px;
}

.efc__avatar {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--efc-tone);
  background: color-mix(in srgb, var(--efc-tone) 13%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--efc-tone) 30%, var(--app-border));
}

.efc__avatar svg { width: 19px; height: 19px; }

.efc__avatar-dot {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--efc-tone);
  border: 2px solid var(--app-surface);
}

.efc--ok .efc__avatar-dot { animation: efc-pulse 2s ease-out infinite; }

.efc__identity { min-width: 0; }

.efc__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.efc__name {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--app-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.efc__tier {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 5px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  background: var(--app-surface-muted);
  border: 0.5px solid var(--app-border);
}

.efc__tier--unified { color: var(--dorian-viper-400, #3fbd85); border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 35%, var(--app-border)); }
.efc__tier--l4 { color: var(--dorian-l4, #6b9fd4); border-color: color-mix(in srgb, var(--dorian-l4, #6b9fd4) 35%, var(--app-border)); }
.efc__tier--l7 { color: var(--dorian-l7, #b08cf0); border-color: color-mix(in srgb, var(--dorian-l7, #b08cf0) 35%, var(--app-border)); }
.efc__tier--trial { color: var(--dorian-warn, #e0a83f); border-color: color-mix(in srgb, var(--dorian-warn, #e0a83f) 35%, var(--app-border)); }

.efc__sub {
  margin: 3px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 11.5px;
  color: var(--app-text-muted);
  white-space: nowrap;
  overflow: hidden;
}

.efc__sub span { overflow: hidden; text-overflow: ellipsis; }
.efc__sub i { font-style: normal; opacity: 0.6; }

.efc__health {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
  color: var(--efc-tone);
  background: color-mix(in srgb, var(--efc-tone) 13%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--efc-tone) 30%, transparent);
}

.efc__health i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.efc__menu { position: relative; }

.efc__icon-btn {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 0.5px solid transparent;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
}

.efc__icon-btn:hover,
.efc__icon-btn[aria-expanded='true'] {
  color: var(--app-heading);
  border-color: var(--app-border);
  background: var(--app-surface-muted);
}

.efc__icon-btn svg { width: 16px; height: 16px; }

.efc__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  min-width: 180px;
  padding: 5px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface-elevated, var(--app-surface));
  box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.55);
}

.efc__dropdown button {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text);
  font: inherit;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
}

.efc__dropdown button:hover:not(:disabled) { background: var(--app-surface-muted); }
.efc__dropdown button:disabled { opacity: 0.5; cursor: not-allowed; }
.efc__dropdown button.danger { color: var(--dorian-danger, #e15241); }
.efc__dropdown hr { margin: 4px 2px; border: 0; border-top: 0.5px solid var(--app-border); }

/* Network */
.efc__net {
  margin: 0 14px;
  padding: 12px 12px 8px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.efc__net-head {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 22px;
  align-items: end;
}

.efc__rate { display: flex; flex-direction: column; gap: 3px; min-width: 0; }

.efc__rate-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.efc__rate-label i { width: 8px; height: 3px; border-radius: 2px; }
.efc__rate.rx .efc__rate-label i { background: var(--efc-rx); }
.efc__rate.tx .efc__rate-label i { background: var(--efc-tx); }

.efc__rate strong {
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--app-heading);
  white-space: nowrap;
}

.efc__net-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 0;
  font-size: 11px;
  color: var(--app-text-muted);
}

.efc__net-meta > span:first-child {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.efc__live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.efc__live::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-border-strong);
}

.efc__live.on { color: var(--efc-rx); }
.efc__live.on::before { background: var(--efc-rx); animation: efc-pulse 2s ease-out infinite; }

.efc__spark {
  position: relative;
  height: 72px;
  margin-top: 10px;
}

.efc__spark svg { display: block; width: 100%; height: 100%; overflow: visible; }

.efc__grid { stroke: var(--app-border); stroke-width: 1; stroke-dasharray: 2 4; vector-effect: non-scaling-stroke; }

.efc__line {
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.efc__line.rx { stroke: var(--efc-rx); }
.efc__line.tx { stroke: var(--efc-tx); stroke-dasharray: 4 3; }

.efc__spark-empty {
  height: 100%;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 0.5px dashed var(--app-border-strong);
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.efc__spark-peak,
.efc__spark-window {
  position: absolute;
  top: -2px;
  font-size: 10px;
  color: var(--app-text-muted);
}

.efc__spark-peak { left: 0; }
.efc__spark-window { right: 0; }

/* Vitals */
.efc__vitals {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 14px 0;
}

.efc__vital {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 9px 10px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.efc__ring { width: 34px; height: 34px; flex-shrink: 0; transform: rotate(-90deg); }
.efc__ring-track { fill: none; stroke: var(--app-border); stroke-width: 4; }

.efc__ring-fill {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
  stroke: var(--app-border-strong);
  transition: stroke-dashoffset 0.6s ease;
}

.efc__ring-fill.ok { stroke: var(--dorian-viper-400, #3fbd85); }
.efc__ring-fill.warn { stroke: var(--dorian-warn, #e0a83f); }
.efc__ring-fill.danger { stroke: var(--dorian-danger, #e15241); }

.efc__vital-copy { display: flex; flex-direction: column; min-width: 0; }

.efc__vital-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.efc__vital-copy strong {
  font-size: 15px;
  font-weight: 650;
  line-height: 1.2;
  color: var(--app-heading);
}

.efc__vital-copy strong.warn { color: var(--dorian-warn, #e0a83f); }
.efc__vital-copy strong.danger { color: var(--dorian-danger, #e15241); }

.efc__vital-detail {
  font-size: 10.5px;
  color: var(--app-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Facts */
.efc__facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 12px 14px 0;
  padding: 10px 0 0;
  border-top: 0.5px solid var(--app-border);
}

.efc__facts > div { min-width: 0; padding: 0 10px; }
.efc__facts > div:first-child { padding-left: 2px; }
.efc__facts > div + div { border-left: 0.5px solid var(--app-border); }

.efc__facts dt {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.efc__facts dd {
  margin: 3px 0 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--app-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.efc__expiry--expired { color: var(--dorian-danger, #e15241) !important; }
.efc__expiry--expiring { color: var(--dorian-warn, #e0a83f) !important; }

/* Footer */
.efc__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 14px;
  border-top: 0.5px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface-muted) 60%, transparent);
  border-radius: 0 0 14px 14px;
}

.efc__services { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; flex: 1; }

.efc__svc {
  --svc: var(--app-text-muted);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--app-text);
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
  white-space: nowrap;
}

.efc__svc i { width: 7px; height: 7px; border-radius: 50%; background: var(--svc); }
.efc__svc--running { --svc: var(--dorian-viper-400, #3fbd85); }
.efc__svc--stopped { --svc: var(--dorian-danger, #e15241); }
.efc__svc--deployed { --svc: var(--dorian-l4, #6b9fd4); }
.efc__svc--unknown { --svc: var(--dorian-warn, #e0a83f); }
.efc__svc--na { opacity: 0.55; text-decoration: line-through; }

.efc__cta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  padding: 8px 13px;
  border: none;
  border-radius: 8px;
  font: inherit;
  font-size: 12.5px;
  font-weight: 650;
  cursor: pointer;
  color: var(--app-btn-primary-fg, #08120e);
  background: var(--app-btn-primary-bg, var(--dorian-viper-500, #2e9e6c));
  transition: background 0.15s ease, transform 0.15s ease;
}

.efc__cta:hover { background: var(--app-btn-primary-hover, var(--dorian-viper-700, #1f6e4a)); }
.efc__cta svg { width: 12px; height: 12px; transition: transform 0.15s ease; }
.efc__cta:hover svg { transform: translateX(2px); }

@keyframes efc-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--efc-tone) 55%, transparent); }
  70% { box-shadow: 0 0 0 6px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

@media (max-width: 720px) {
  .efc__head { grid-template-columns: auto minmax(0, 1fr) auto; }
  .efc__health { grid-column: 2; justify-self: start; }
  .efc__menu { grid-row: 1; grid-column: 3; }
  .efc__vitals,
  .efc__facts { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 8px; }
  .efc__facts > div:nth-child(3) { border-left: 0; padding-left: 2px; }
  .efc__net-head { grid-template-columns: auto auto; }
  .efc__net-meta { grid-column: 1 / -1; align-items: flex-start; flex-direction: row; gap: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .efc__avatar-dot,
  .efc__live.on::before { animation: none; }
}
</style>
