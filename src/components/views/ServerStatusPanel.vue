<template>
  <div v-if="variant === 'snapshot'" class="host-snapshot">
    <div class="host-snapshot__status">
      <span class="host-snapshot__dot" :class="`host-snapshot__dot--${hostAliveStatus}`" />
      <span>{{ reachabilityLabel }}</span>
      <button
        type="button"
        class="host-snapshot__refresh"
        :disabled="metricsLoading || hostActionBusy"
        @click="refreshMetrics"
      >
        {{ metricsLoading ? 'Refreshing…' : 'Refresh readings' }}
      </button>
    </div>

    <div class="host-snapshot__vitals">
      <article v-for="vital in snapshotVitals" :key="vital.key" class="host-snapshot__vital">
        <span class="host-snapshot__vital-label">{{ vital.label }}</span>
        <strong :class="vital.tone">{{ vital.value }}</strong>
        <span class="host-snapshot__vital-detail">{{ vital.detail || '—' }}</span>
        <span class="host-snapshot__meter" :class="{ 'is-idle': vital.percent == null }">
          <span
            v-if="vital.percent != null"
            :class="vital.tone"
            :style="{ width: `${vital.percent}%` }"
          />
        </span>
      </article>
    </div>

    <div class="host-snapshot__sheet">
      <dl>
        <div v-for="row in snapshotConnection" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>
      <dl>
        <div v-for="row in snapshotHost" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd :class="row.tone">{{ row.value }}</dd>
        </div>
      </dl>
    </div>

    <p v-if="metricsError" class="status-error">{{ metricsError }}</p>
  </div>

  <div v-else class="server-status-panel" :class="{ 'server-status-panel--embedded': embedded }">
    <header v-if="!embedded" class="cfg-head">
      <div class="cfg-head__copy">
        <span class="cfg-head__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2.5-6 5 12 2.5-6h4" /></svg>
        </span>
        <div>
          <p class="cfg-head__kicker">Runtime</p>
          <h4>Monitor</h4>
          <p class="cfg-head__desc">Live host vitals, interface traffic and the health of Angelos, Sparta and Athens.</p>
        </div>
      </div>
    </header>

    <section class="status-card server-card">
      <header class="status-card-header">
        <div class="status-card-heading">
          <h4 class="status-card-title">Host</h4>
          <StatusCornerDot
            refreshable
            :status="hostAliveStatus"
            :loading="metricsLoading"
            :title="hostAliveTitle"
            :refresh-disabled="hostActionBusy"
            :refresh-title="metricsLoading ? 'Refreshing…' : 'Refresh server status'"
            @refresh="refreshMetrics"
          />
        </div>
        <div class="status-card-actions status-card-actions--inline">
          <button
            type="button"
            class="host-action-btn host-action-btn--restart"
            :disabled="hostActionBusy"
            @click="confirmHostAction('restart')"
          >
            Restart
          </button>
          <button
            type="button"
            class="host-action-btn host-action-btn--poweroff"
            :disabled="hostActionBusy"
            @click="confirmHostAction('poweroff')"
          >
            Power off
          </button>
        </div>
      </header>
      <div class="status-card-body">
        <div class="server-facts">
          <div class="metric-row">
            <span class="metric-label">Edge name</span>
            <span class="metric-value">{{ serverName }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Edge IP</span>
            <span class="metric-value">{{ serverIp }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Managed users</span>
            <span v-if="managedUsers.length" class="managed-users">
              <span v-for="user in managedUsers" :key="user" class="managed-user-pill">
                {{ user }}
              </span>
            </span>
            <span v-else class="metric-value">—</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">SSH</span>
            <span class="metric-value">{{ sshInfo }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Operating system</span>
            <span class="metric-value">{{ serverOs }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Kernel</span>
            <span class="metric-value">{{ kernelDisplay }}</span>
          </div>
          <div v-if="showHostname" class="metric-row">
            <span class="metric-label">Hostname</span>
            <span class="metric-value">{{ hostnameDisplay }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Uptime</span>
            <span class="metric-value">{{ uptimeDisplay }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Load</span>
            <span class="metric-value" :class="loadClass">{{ loadDisplay }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Temperature</span>
            <span class="metric-value" :class="temperatureClass">
              {{ temperatureDisplay }}
              <span v-if="temperatureLabel" class="metric-sub">{{ temperatureLabel }}</span>
            </span>
          </div>
        </div>
        <div class="server-usage">
          <UsageMetricBar
            label="CPU"
            :percent="cpuUsagePercent"
            :display-value="cpuUsageDisplay"
            :detail="cpuUsageDetail"
            :loading="metricsLoading && !metrics"
          />
          <UsageMetricBar
            label="RAM"
            :percent="memoryUsagePercent"
            :display-value="memoryUsageDisplay"
            :detail="memoryUsageDetail"
            :loading="metricsLoading && !metrics"
          />
          <UsageMetricBar
            label="Disk Usage"
            :percent="diskUsagePercent"
            :display-value="diskUsageDisplay"
            :detail="diskUsageDetail"
            :loading="metricsLoading && !metrics"
          />
          <UsageMetricBar
            v-if="showSwap"
            label="Swap"
            :percent="swapUsagePercent"
            :display-value="swapUsageDisplay"
            :detail="swapUsageDetail"
            :loading="metricsLoading && !metrics"
          />
          <UsageMetricBar
            label="Network"
            :percent="networkUsagePercent"
            :display-value="networkUsageDisplay"
            :detail="networkUsageDetail"
            :loading="metricsLoading && !metrics"
          />
        </div>
        <p v-if="metricsError" class="status-error">{{ metricsError }}</p>
      </div>
    </section>

    <EdgeNicCharts v-if="serverId" :server-id="serverId" />

    <div v-if="showServices" class="service-grid">
      <ServiceStatusCard
        title="Angelos"
        service="angelos"
        :server="localServer"
        :status="angelosStatus"
        :status-label="angelosStatusLabelText"
        :last-checked-at="lastServiceCheckedAt"
        :busy="serviceBusy.angelos"
        @start="controlService('angelos', 'start')"
        @stop="confirmServiceStop('angelos')"
        @refresh="refreshServiceStatuses"
      />

      <ServiceStatusCard
        title="Sparta"
        service="sparta"
        :server="localServer"
        :status="spartaStatus"
        :status-label="spartaStatusLabelText"
        :last-checked-at="lastServiceCheckedAt"
        :busy="serviceBusy.sparta"
        @start="controlService('sparta', 'start')"
        @stop="confirmServiceStop('sparta')"
        @refresh="refreshServiceStatuses"
      />

      <ServiceStatusCard
        title="Athens"
        service="athens"
        :server="localServer"
        :status="athensStatus"
        :status-label="athensStatusLabelText"
        :last-checked-at="lastServiceCheckedAt"
        :busy="serviceBusy.athens"
        @start="controlService('athens', 'start')"
        @stop="confirmServiceStop('athens')"
        @refresh="refreshServiceStatuses"
      />
    </div>

    <section v-if="showServices" class="status-card sparta-live">
      <div class="status-card-header">
        <h3 class="status-card-title">Sparta log</h3>
      </div>
      <div class="sparta-live__body">
        <SpartaLogView :lines="spartaLines" :error="spartaError" />
      </div>
    </section>

    <ConfirmDialog
      v-model="isConfirmDialogOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmButtonText"
      cancel-text="Cancel"
      @confirm="handleConfirmDialog"
      @cancel="clearConfirmDialog"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  controlServerService,
  fetchServerHostMetrics,
  fetchSpartaLog,
  refreshServerRuntimeStatus,
  serverHostPower,
} from '@/api/servers'
import { notifyError, notifySuccess } from '@/utils/notify'
import {
  angelosStatusLabel,
  resolveAngelosRuntimeStatus,
  resolveLayerStatus,
  runtimeStatusLabel,
} from '@/utils/serverLayerStatus'
import { formatVersionOs } from '@/utils/deployVersions'
import ConfirmDialog from '../ConfirmDialog.vue'
import EdgeNicCharts from './EdgeNicCharts.vue'
import SpartaLogView from '@/components/SpartaLogView.vue'
import ServiceStatusCard from './ServiceStatusCard.vue'
import StatusCornerDot from '../StatusCornerDot.vue'
import UsageMetricBar from '../UsageMetricBar.vue'

const SERVICE_LABELS = {
  angelos: 'Angelos',
  sparta: 'Sparta',
  athens: 'Athens',
}

const props = defineProps({
  serverId: {
    type: [Number, String],
    required: true,
  },
  server: {
    type: Object,
    default: null,
  },
  showServices: {
    type: Boolean,
    default: true,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'console',
  },
})

const emit = defineEmits(['updated'])

const statusTitle = computed(() => (props.variant === 'snapshot' ? 'Edge details' : 'Monitor Status'))
const spartaLines = ref([])
const spartaError = ref('')
let spartaTimer = 0
let spartaBusy = false

const loadSpartaLog = async () => {
  if (!props.showServices || !props.serverId || spartaBusy || document.visibilityState === 'hidden') return
  spartaBusy = true
  try {
    const payload = await fetchSpartaLog(props.serverId)
    spartaLines.value = Array.isArray(payload?.lines) ? payload.lines : []
    spartaError.value = payload?.error || ''
  } catch (err) {
    spartaError.value = err?.message || 'Sparta log is unavailable'
  } finally {
    spartaBusy = false
  }
}

const metrics = ref(null)
const metricsLoading = ref(false)
const metricsError = ref('')
const hostReachable = ref(null)
const hostActionBusy = ref(false)
const runtimeRefreshing = ref(false)
const lastServiceCheckedAt = ref(null)
const localServer = ref(props.server ? { ...props.server } : null)

const serviceBusy = reactive({
  angelos: false,
  sparta: false,
  athens: false,
})

const isConfirmDialogOpen = ref(false)
const pendingConfirmAction = ref(null)
const isConfirmBusy = ref(false)

const angelosStatus = computed(() => resolveAngelosRuntimeStatus(localServer.value))
const spartaStatus = computed(() => resolveLayerStatus(localServer.value, 'l4'))
const athensStatus = computed(() => resolveLayerStatus(localServer.value, 'l7'))

const angelosStatusLabelText = computed(() => angelosStatusLabel(localServer.value))
const spartaStatusLabelText = computed(() => runtimeStatusLabel(spartaStatus.value))
const athensStatusLabelText = computed(() => runtimeStatusLabel(athensStatus.value))

const hostAliveStatus = computed(() => {
  if (hostReachable.value === true) return 'running'
  if (hostReachable.value === false) return 'stopped'
  return 'unknown'
})

const hostAliveTitle = computed(() => {
  if (metricsLoading.value) return 'Checking if server is reachable…'
  if (hostReachable.value === true) return 'Server is alive and reachable via SSH'
  if (hostReachable.value === false) return 'Server is unreachable or not responding'
  return 'Server reachability unknown — refresh to check'
})

const serverName = computed(() => {
  const name = String(localServer.value?.name || '').trim()
  return name || '—'
})

const serverIp = computed(() => {
  const ip = String(localServer.value?.ip || '').trim()
  return ip || '—'
})

const managedUsers = computed(() => {
  const users = localServer.value?.managedUsers
  if (Array.isArray(users) && users.length) {
    return users.map((user) => String(user).trim()).filter(Boolean)
  }
  const count = localServer.value?.users
  if (count != null && Number(count) > 0) {
    return [`${count} user${Number(count) === 1 ? '' : 's'}`]
  }
  return []
})

const sshInfo = computed(() => {
  const user = String(localServer.value?.sshUser || localServer.value?.ssh_user || '').trim()
  const port = String(localServer.value?.sshPort || localServer.value?.ssh_port || '').trim()
  if (user && port) return `${user} · port ${port}`
  if (user) return user
  if (port) return `port ${port}`
  return '—'
})

const serverOs = computed(() => formatVersionOs(localServer.value?.os) || '—')

const metricsPending = computed(() => metricsLoading.value && !metrics.value)

const kernelDisplay = computed(() => {
  if (metricsPending.value) return 'Loading…'
  const kernel = String(metrics.value?.kernel || '').trim()
  return kernel || '—'
})

const hostnameDisplay = computed(() => {
  if (metricsPending.value) return 'Loading…'
  const hostname = String(metrics.value?.hostname || '').trim()
  return hostname || '—'
})

const showHostname = computed(() => {
  const hostname = String(metrics.value?.hostname || '').trim()
  if (!hostname) return false
  const name = String(localServer.value?.name || '').trim()
  return hostname.toLowerCase() !== name.toLowerCase()
})

const formatUptime = (seconds) => {
  const total = Math.floor(Number(seconds))
  if (!Number.isFinite(total) || total < 0) return '—'
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const mins = Math.floor((total % 3600) / 60)
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  if (hours > 0) return `${hours}h ${mins}m`
  if (mins > 0) return `${mins}m`
  return `${total}s`
}

const uptimeDisplay = computed(() => {
  if (metricsPending.value) return 'Loading…'
  if (!metrics.value || metrics.value.uptimeSeconds == null) return '—'
  return formatUptime(metrics.value.uptimeSeconds)
})

const formatLoadNumber = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  return num.toFixed(2)
}

const loadDisplay = computed(() => {
  if (metricsPending.value) return 'Loading…'
  if (!metrics.value) return '—'
  const load = `${formatLoadNumber(metrics.value.load1)} / ${formatLoadNumber(metrics.value.load5)} / ${formatLoadNumber(metrics.value.load15)}`
  const cores = Number(metrics.value.cpuCores)
  if (Number.isFinite(cores) && cores > 0) return `${load} · ${cores} cores`
  return load
})

const loadClass = computed(() => {
  const cores = Number(metrics.value?.cpuCores)
  const load1 = Number(metrics.value?.load1)
  if (!Number.isFinite(cores) || cores <= 0 || !Number.isFinite(load1)) return ''
  if (load1 >= cores) return 'metric-value--hot'
  if (load1 >= cores * 0.75) return 'metric-value--warm'
  return ''
})

const temperatureDisplay = computed(() => {
  if (metricsPending.value) return 'Loading…'
  const temp = Number(metrics.value?.temperatureC)
  if (!metrics.value || !Number.isFinite(temp)) return '—'
  return `${temp.toFixed(1)} °C`
})

const temperatureLabel = computed(() => {
  if (metricsPending.value) return ''
  const temp = Number(metrics.value?.temperatureC)
  if (!Number.isFinite(temp)) return ''
  return String(metrics.value?.temperatureLabel || '').trim()
})

const temperatureClass = computed(() => {
  const temp = Number(metrics.value?.temperatureC)
  if (!Number.isFinite(temp)) return ''
  if (temp >= 85) return 'metric-value--hot'
  if (temp >= 70) return 'metric-value--warm'
  return ''
})

const cpuUsageDetail = computed(() => {
  const cores = Number(metrics.value?.cpuCores)
  if (!Number.isFinite(cores) || cores <= 0) return ''
  return `${cores} core${cores === 1 ? '' : 's'}`
})

const confirmTitle = computed(() => {
  const pending = pendingConfirmAction.value
  if (!pending) return 'Confirm action'
  if (pending.type === 'host-restart') return 'Restart server?'
  if (pending.type === 'host-poweroff') return 'Power off server?'
  if (pending.type === 'service-stop') {
    return `Stop ${SERVICE_LABELS[pending.service] || pending.service}?`
  }
  return 'Confirm action'
})

const confirmMessage = computed(() => {
  const pending = pendingConfirmAction.value
  if (!pending) return 'Are you sure you want to continue?'
  if (pending.type === 'host-restart') {
    return 'This will reboot the remote host. Services may be unavailable for a short time.'
  }
  if (pending.type === 'host-poweroff') {
    return 'This will shut down the remote host immediately. SSH and services will become unavailable until the machine is powered on again.'
  }
  if (pending.type === 'service-stop') {
    const name = SERVICE_LABELS[pending.service] || pending.service
    return `This will stop ${name} on the remote host. Traffic protection and related features may be interrupted until the service is started again.`
  }
  return 'Are you sure you want to continue?'
})

const confirmButtonText = computed(() => {
  const pending = pendingConfirmAction.value
  if (isConfirmBusy.value) return 'Working…'
  if (!pending) return 'Confirm'
  if (pending.type === 'host-restart') return 'Restart'
  if (pending.type === 'host-poweroff') return 'Power off'
  if (pending.type === 'service-stop') return 'Stop'
  return 'Confirm'
})

const formatPercent = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(1)}%`
}

const formatBytesPair = (usedBytes, totalBytes, includePercent = true) => {
  if (usedBytes == null || totalBytes == null) return '—'
  const used = Number(usedBytes)
  const total = Number(totalBytes)
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return '—'
  const pair = `${formatBytes(used)} / ${formatBytes(total)}`
  if (!includePercent) return pair
  const pct = ((used / total) * 100).toFixed(1)
  return `${pair} (${pct}%)`
}

const formatBytes = (bytes) => {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value < 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

const clampPercent = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return Math.min(100, Math.max(0, num))
}

const usagePercentFromBytes = (usedBytes, totalBytes) => {
  const used = Number(usedBytes)
  const total = Number(totalBytes)
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return null
  return clampPercent((used / total) * 100)
}

const cpuUsagePercent = computed(() => {
  if (!metrics.value) return null
  return clampPercent(metrics.value.cpuPercent)
})

const memoryUsagePercent = computed(() => {
  if (!metrics.value) return null
  return usagePercentFromBytes(metrics.value.memoryUsedBytes, metrics.value.memoryTotalBytes)
})

const diskUsagePercent = computed(() => {
  if (!metrics.value) return null
  return usagePercentFromBytes(metrics.value.diskUsedBytes, metrics.value.diskTotalBytes)
})

const cpuUsageDisplay = computed(() => {
  if (metricsLoading.value && !metrics.value) return 'Loading…'
  if (cpuUsagePercent.value == null) return '—'
  return formatPercent(cpuUsagePercent.value)
})

const memoryUsageDisplay = computed(() => {
  if (metricsLoading.value && !metrics.value) return 'Loading…'
  if (memoryUsagePercent.value == null) return '—'
  return formatPercent(memoryUsagePercent.value)
})

const diskUsageDisplay = computed(() => {
  if (metricsLoading.value && !metrics.value) return 'Loading…'
  if (diskUsagePercent.value == null) return '—'
  return formatPercent(diskUsagePercent.value)
})

const memoryUsageDetail = computed(() => {
  if (!metrics.value) return ''
  const detail = formatBytesPair(metrics.value.memoryUsedBytes, metrics.value.memoryTotalBytes, false)
  return detail === '—' ? '' : detail
})

const diskUsageDetail = computed(() => {
  if (!metrics.value) return ''
  const detail = formatBytesPair(metrics.value.diskUsedBytes, metrics.value.diskTotalBytes, false)
  return detail === '—' ? '' : detail
})

const showSwap = computed(() => Number(metrics.value?.swapTotalBytes) > 0)

const swapUsagePercent = computed(() => {
  if (!metrics.value) return null
  return usagePercentFromBytes(metrics.value.swapUsedBytes, metrics.value.swapTotalBytes)
})

const swapUsageDisplay = computed(() => {
  if (metricsPending.value) return 'Loading…'
  if (swapUsagePercent.value == null) return '—'
  return formatPercent(swapUsagePercent.value)
})

const swapUsageDetail = computed(() => {
  if (!metrics.value) return ''
  const detail = formatBytesPair(metrics.value.swapUsedBytes, metrics.value.swapTotalBytes, false)
  return detail === '—' ? '' : detail
})

const formatBitRate = (bytesPerSec) => {
  const bytes = Number(bytesPerSec)
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  const bits = bytes * 8
  if (bits >= 1_000_000_000) return `${(bits / 1_000_000_000).toFixed(2)} Gbps`
  if (bits >= 1_000_000) return `${(bits / 1_000_000).toFixed(1)} Mbps`
  if (bits >= 1_000) return `${(bits / 1_000).toFixed(1)} Kbps`
  return `${Math.round(bits)} bps`
}

const formatLinkMbps = (mbps) => {
  const speed = Number(mbps)
  if (!Number.isFinite(speed) || speed <= 0) return ''
  if (speed >= 1000) {
    const gigabits = speed / 1000
    const text = Number.isInteger(gigabits) ? String(gigabits) : gigabits.toFixed(1)
    return `${text} Gbps`
  }
  return `${Math.round(speed)} Mbps`
}

const networkUsagePercent = computed(() => {
  const mbps = Number(metrics.value?.netLinkMbps)
  if (!metrics.value || !Number.isFinite(mbps) || mbps <= 0) return null
  const linkBytesPerSec = (mbps * 1_000_000) / 8
  const rx = Number(metrics.value.netRxBytesPerSec) || 0
  const tx = Number(metrics.value.netTxBytesPerSec) || 0
  return clampPercent((Math.max(rx, tx) / linkBytesPerSec) * 100)
})

const networkRateText = computed(() => {
  if (!metrics.value) return ''
  const iface = String(metrics.value.netInterface || '').trim()
  const rx = Number(metrics.value.netRxBytesPerSec) || 0
  const tx = Number(metrics.value.netTxBytesPerSec) || 0
  if (!iface && rx === 0 && tx === 0) return ''
  return `↓ ${formatBitRate(rx)} · ↑ ${formatBitRate(tx)}`
})

const networkUsageDisplay = computed(() => {
  if (metricsPending.value) return 'Loading…'
  if (!metrics.value) return '—'
  if (networkUsagePercent.value != null) return formatPercent(networkUsagePercent.value)
  return networkRateText.value || '—'
})

const networkUsageDetail = computed(() => {
  if (!metrics.value) return ''
  const parts = []
  if (networkUsagePercent.value != null && networkRateText.value) parts.push(networkRateText.value)
  const iface = String(metrics.value.netInterface || '').trim()
  const link = formatLinkMbps(metrics.value.netLinkMbps)
  if (iface) parts.push(iface)
  if (link) parts.push(`link ${link}`)
  return parts.join(' · ')
})

const reachabilityLabel = computed(() => {
  if (metricsLoading.value && hostReachable.value == null) return 'Checking whether this edge answers over SSH…'
  if (hostReachable.value === true) return 'Reachable over SSH'
  if (hostReachable.value === false) return 'Not answering over SSH'
  return 'Reachability not checked yet'
})

const vitalTone = (percent, warm, hot) => {
  if (percent == null) return ''
  if (percent >= hot) return 'is-hot'
  if (percent >= warm) return 'is-warm'
  return ''
}

const snapshotVitals = computed(() => [
  {
    key: 'cpu',
    label: 'CPU',
    value: cpuUsageDisplay.value,
    detail: cpuUsageDetail.value,
    percent: cpuUsagePercent.value,
    tone: vitalTone(cpuUsagePercent.value, 70, 90),
  },
  {
    key: 'memory',
    label: 'Memory',
    value: memoryUsageDisplay.value,
    detail: memoryUsageDetail.value,
    percent: memoryUsagePercent.value,
    tone: vitalTone(memoryUsagePercent.value, 75, 90),
  },
  {
    key: 'disk',
    label: 'Disk',
    value: diskUsageDisplay.value,
    detail: diskUsageDetail.value,
    percent: diskUsagePercent.value,
    tone: vitalTone(diskUsagePercent.value, 80, 92),
  },
  {
    key: 'network',
    label: 'Network',
    value: metricsPending.value
      ? 'Loading…'
      : (!metrics.value || !networkRateText.value
        ? '—'
        : formatBitRate(Math.max(Number(metrics.value.netRxBytesPerSec) || 0, Number(metrics.value.netTxBytesPerSec) || 0))),
    detail: [
      networkRateText.value,
      String(metrics.value?.netInterface || '').trim(),
      formatLinkMbps(metrics.value?.netLinkMbps),
    ].filter(Boolean).join(' · '),
    percent: networkUsagePercent.value,
    tone: vitalTone(networkUsagePercent.value, 70, 90),
  },
])

const snapshotConnection = computed(() => [
  { label: 'SSH', value: sshInfo.value },
  { label: 'Users', value: managedUsers.value.length ? managedUsers.value.join(', ') : '—' },
  { label: 'System', value: serverOs.value },
  { label: 'Created', value: localServer.value?.created || '—' },
])

const snapshotHost = computed(() => {
  const temperature = temperatureLabel.value
    ? `${temperatureDisplay.value} · ${temperatureLabel.value}`
    : temperatureDisplay.value
  const rows = [
    { label: 'Kernel', value: kernelDisplay.value },
    { label: 'Hostname', value: hostnameDisplay.value },
    { label: 'Uptime', value: uptimeDisplay.value },
    { label: 'Load', value: loadDisplay.value, tone: loadClass.value },
    { label: 'Temperature', value: temperature, tone: temperatureClass.value },
  ]
  if (showSwap.value) {
    const detail = swapUsageDetail.value
    rows.push({
      label: 'Swap',
      value: detail ? `${swapUsageDisplay.value} · ${detail}` : swapUsageDisplay.value,
    })
  }
  return rows
})

const mergeServerUpdate = (updated) => {
  if (!updated || typeof updated !== 'object') return
  localServer.value = {
    ...(localServer.value || {}),
    ...updated,
    serviceStatus: updated.serviceStatus ?? updated.service_status ?? localServer.value?.serviceStatus,
    l4Status: updated.l4Status ?? updated.l4_status ?? localServer.value?.l4Status,
    l7Status: updated.l7Status ?? updated.l7_status ?? localServer.value?.l7Status,
  }
  emit('updated', localServer.value)
}

const refreshMetrics = async () => {
  if (!props.serverId || metricsLoading.value) return
  metricsLoading.value = true
  metricsError.value = ''
  try {
    metrics.value = await fetchServerHostMetrics(props.serverId)
    hostReachable.value = true
  } catch (error) {
    metrics.value = null
    hostReachable.value = false
    metricsError.value = error?.message || 'Failed to load host metrics.'
    notifyError(statusTitle.value, metricsError.value)
  } finally {
    metricsLoading.value = false
  }
}

const markServiceChecked = () => {
  lastServiceCheckedAt.value = new Date()
}

const refreshServiceStatuses = async (options) => {
  if (!props.serverId || runtimeRefreshing.value) return
  const announce = options?.announce !== false
  runtimeRefreshing.value = true
  serviceBusy.angelos = true
  serviceBusy.sparta = true
  serviceBusy.athens = true
  try {
    const updated = await refreshServerRuntimeStatus(props.serverId)
    mergeServerUpdate(updated)
    markServiceChecked()
    if (announce) notifySuccess(statusTitle.value, 'The service statuses are successfully refreshed.')
  } catch (error) {
    notifyError(statusTitle.value, error?.message || 'The service statuses could not be refreshed.')
  } finally {
    runtimeRefreshing.value = false
    serviceBusy.angelos = false
    serviceBusy.sparta = false
    serviceBusy.athens = false
  }
}

const controlService = async (service, action) => {
  if (!props.serverId || serviceBusy[service]) return
  serviceBusy[service] = true
  try {
    const updated = await controlServerService(props.serverId, { service, action })
    mergeServerUpdate(updated)
    markServiceChecked()
    const label = service.charAt(0).toUpperCase() + service.slice(1)
    notifySuccess(statusTitle.value, `The ${label} ${action} command is successfully sent.`)
  } catch (error) {
    notifyError(statusTitle.value, error?.message || `The ${label} service could not be ${action}.`)
  } finally {
    serviceBusy[service] = false
  }
}

const clearConfirmDialog = () => {
  if (isConfirmBusy.value) return
  pendingConfirmAction.value = null
}

const confirmHostAction = (action) => {
  pendingConfirmAction.value = {
    type: action === 'poweroff' ? 'host-poweroff' : 'host-restart',
  }
  isConfirmDialogOpen.value = true
}

const confirmServiceStop = (service) => {
  pendingConfirmAction.value = { type: 'service-stop', service }
  isConfirmDialogOpen.value = true
}

const runHostPowerAction = async (action) => {
  hostActionBusy.value = true
  try {
    await serverHostPower(props.serverId, action)
    if (action === 'poweroff') {
      hostReachable.value = false
      metrics.value = null
    }
    notifySuccess(
      statusTitle.value,
      action === 'poweroff' ? 'The power off command is successfully sent.' : 'The restart command is successfully sent.'
    )
  } catch (error) {
    notifyError(statusTitle.value, error?.message || 'The host power action could not be completed.')
  } finally {
    hostActionBusy.value = false
  }
}

const handleConfirmDialog = async () => {
  const pending = pendingConfirmAction.value
  if (!pending || isConfirmBusy.value) return

  isConfirmBusy.value = true
  try {
    if (pending.type === 'host-restart' || pending.type === 'host-poweroff') {
      await runHostPowerAction(pending.type === 'host-poweroff' ? 'poweroff' : 'restart')
    } else if (pending.type === 'service-stop') {
      await controlService(pending.service, 'stop')
    }
  } finally {
    isConfirmBusy.value = false
    pendingConfirmAction.value = null
  }
}

watch(
  () => props.server,
  (server) => {
    localServer.value = server ? { ...server } : null
  },
  { deep: true }
)

watch(
  () => props.serverId,
  () => {
    metrics.value = null
    metricsError.value = ''
    hostReachable.value = null
    lastServiceCheckedAt.value = null
    spartaLines.value = []
    spartaError.value = ''
    void refreshMetrics()
    void refreshServiceStatuses()
    void loadSpartaLog()
  }
)

onMounted(() => {
  void refreshMetrics()
  void refreshServiceStatuses({ announce: false })
  void loadSpartaLog()
  spartaTimer = window.setInterval(loadSpartaLog, 2000)
})

onBeforeUnmount(() => {
  window.clearInterval(spartaTimer)
})
</script>

<style scoped>
.server-status-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.server-status-panel--embedded {
  padding: 0;
}

.server-status-panel--embedded .server-facts,
.server-status-panel--embedded .server-usage {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.cfg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.cfg-head__copy { display: flex; gap: 12px; min-width: 0; }

.cfg-head__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 13%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 30%, transparent);
}

.cfg-head__icon svg { width: 18px; height: 18px; }

.cfg-head__kicker {
  margin: 0 0 2px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-head h4 { margin: 0; font-size: 1.1rem; font-weight: 650; letter-spacing: -0.02em; color: var(--app-heading); }
.cfg-head__desc { margin: 3px 0 0; max-width: 44rem; font-size: 12.5px; line-height: 1.45; color: var(--app-text-muted); }

.service-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.sparta-live__body {
  padding: 12px;
}

.status-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 0.5px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-muted);
  overflow: hidden;
}

.status-card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.status-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 0.5px solid var(--app-border);
}

.status-card-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.2;
}

.status-card-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.server-facts,
.server-usage {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px 18px;
  align-items: start;
}

.server-usage {
  padding-top: 14px;
  border-top: 0.5px solid var(--app-border);
}

.status-card-body :deep(.usage-metric) {
  margin-top: 2px;
}

.status-card-body :deep(.usage-metric-value) {
  white-space: normal;
  text-align: right;
}

.metric-row,
.status-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.metric-label,
.status-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.metric-value,
.status-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
  text-align: left;
  line-height: 1.35;
  word-break: break-word;
}

.metric-sub {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  font-weight: 500;
  color: var(--app-text-muted);
}

.metric-value--warm {
  color: var(--dorian-warn, #e0a83f);
}

.metric-value--hot {
  color: var(--dorian-danger, #e15241);
}

.status-error {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--dorian-danger, #e15241);
}

.managed-users {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.managed-user-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 12%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 30%, transparent);
}

.status-card-actions--inline {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}

.host-action-btn {
  flex: 0 0 auto;
  min-width: 88px;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 6px 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.host-action-btn--restart {
  border: 0.5px solid var(--app-border-strong);
  background: transparent;
  color: var(--app-text);
}

.host-action-btn--restart:hover:not(:disabled) {
  background: var(--app-surface);
  color: var(--app-heading);
}

.host-action-btn--poweroff {
  border: 0.5px solid color-mix(in srgb, var(--dorian-danger, #e15241) 50%, transparent);
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 10%, transparent);
  color: var(--dorian-danger, #e15241);
}

.host-action-btn--poweroff:hover:not(:disabled) {
  background: var(--dorian-danger, #e15241);
  border-color: var(--dorian-danger, #e15241);
  color: #fff;
}

.host-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn,
.primary-btn {
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.secondary-btn {
  border: 0.5px solid var(--app-border-strong);
  background: transparent;
  color: var(--app-text);
}

.secondary-btn:hover:not(:disabled) {
  background: var(--app-surface);
}

.primary-btn {
  border: 1px solid var(--app-accent);
  background: var(--app-accent);
  color: #fff;
}

.primary-btn.danger-btn {
  border-color: var(--dorian-danger, #e15241);
  background: var(--dorian-danger, #e15241);
}

.secondary-btn:disabled,
.primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.host-snapshot {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.host-snapshot__status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  font-size: var(--type-caption);
  color: var(--app-text-muted);
}

.host-snapshot__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-text-muted);
  flex: 0 0 auto;
}

.host-snapshot__dot--running {
  background: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.16);
}

.host-snapshot__dot--stopped {
  background: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.14);
}

.host-snapshot__refresh {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-accent);
  font: inherit;
  font-size: var(--type-caption);
  font-weight: 600;
  cursor: pointer;
}

.host-snapshot__refresh:disabled {
  opacity: 0.55;
  cursor: default;
}

.host-snapshot__vitals {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.host-snapshot__vital {
  min-width: 0;
  padding: 12px 12px 10px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--app-bg) 72%, var(--app-surface-solid, var(--app-surface)));
}

.host-snapshot__vital-label {
  display: block;
  font-size: var(--type-caption);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.host-snapshot__vital strong {
  display: block;
  margin-top: 4px;
  font-size: 1.35rem;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--app-heading);
  font-variant-numeric: tabular-nums;
  word-break: break-word;
}

.host-snapshot__vital-detail {
  display: block;
  min-height: 2.6em;
  margin-top: 4px;
  font-size: var(--type-caption);
  line-height: 1.35;
  color: var(--app-text-muted);
  word-break: break-word;
}

.host-snapshot__meter {
  display: block;
  height: 3px;
  margin-top: 8px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--app-border) 80%, transparent);
  overflow: hidden;
}

.host-snapshot__meter > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--dorian-viper-400, var(--app-accent));
}

.host-snapshot__meter.is-idle {
  opacity: 0.45;
}

.host-snapshot__vital strong.is-warm {
  color: #d97706;
}

.host-snapshot__vital strong.is-hot {
  color: #dc2626;
}

.host-snapshot__meter > span.is-warm {
  background: #d97706;
}

.host-snapshot__meter > span.is-hot {
  background: #dc2626;
}

.host-snapshot__sheet {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 32px;
}

.host-snapshot__sheet dl {
  margin: 0;
}

.host-snapshot__sheet dl div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 10px;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--app-border) 75%, transparent);
}

.host-snapshot__sheet dt {
  margin: 0;
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-text-muted);
}

.host-snapshot__sheet dd {
  margin: 0;
  font-size: var(--type-base);
  line-height: 1.35;
  color: var(--app-heading);
  word-break: break-word;
}

.host-snapshot__sheet dd.metric-value--warm {
  color: #d97706;
}

.host-snapshot__sheet dd.metric-value--hot {
  color: #dc2626;
}

@media (max-width: 1100px) {
  .server-facts,
  .server-usage,
  .server-status-panel--embedded .server-facts,
  .server-status-panel--embedded .server-usage {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .server-facts,
  .server-usage,
  .service-grid,
  .server-status-panel--embedded .server-facts,
  .server-status-panel--embedded .server-usage {
    grid-template-columns: 1fr;
  }

  .status-card-header {
    flex-wrap: wrap;
  }

  .host-snapshot__vitals,
  .host-snapshot__sheet {
    grid-template-columns: 1fr;
  }
}
</style>
