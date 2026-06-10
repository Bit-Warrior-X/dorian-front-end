<template>
  <div class="server-status-panel">
    <div class="status-grid">
      <section class="status-card">
        <header class="status-card-header">
          <h4 class="status-card-title">Server</h4>
          <StatusCornerDot
            refreshable
            :status="hostAliveStatus"
            :loading="metricsLoading"
            :title="hostAliveTitle"
            :refresh-disabled="hostActionBusy"
            :refresh-title="metricsLoading ? 'Refreshing…' : 'Refresh server status'"
            @refresh="refreshMetrics"
          />
        </header>
        <div class="status-card-body">
          <div class="metric-row">
            <span class="metric-label">Server name</span>
            <span class="metric-value">{{ serverName }}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Server IP</span>
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
          <div class="metric-divider" aria-hidden="true"></div>
          <UsageMetricBar
            label="CPU"
            :percent="cpuUsagePercent"
            :display-value="cpuUsageDisplay"
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
          <p v-if="metricsError" class="status-error">{{ metricsError }}</p>
        </div>
        <footer class="status-card-actions status-card-actions--row">
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
        </footer>
      </section>

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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  controlServerService,
  fetchServerHostMetrics,
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
})

const emit = defineEmits(['updated'])

const MONITOR_TITLE = 'Monitor Status'
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
    notifyError(MONITOR_TITLE, metricsError.value)
  } finally {
    metricsLoading.value = false
  }
}

const markServiceChecked = () => {
  lastServiceCheckedAt.value = new Date()
}

const refreshServiceStatuses = async () => {
  if (!props.serverId || runtimeRefreshing.value) return
  runtimeRefreshing.value = true
  serviceBusy.angelos = true
  serviceBusy.sparta = true
  serviceBusy.athens = true
  try {
    const updated = await refreshServerRuntimeStatus(props.serverId)
    mergeServerUpdate(updated)
    markServiceChecked()
    notifySuccess(MONITOR_TITLE, 'The service statuses are successfully refreshed.')
  } catch (error) {
    notifyError(MONITOR_TITLE, error?.message || 'The service statuses could not be refreshed.')
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
    notifySuccess(MONITOR_TITLE, `The ${label} ${action} command is successfully sent.`)
  } catch (error) {
    notifyError(MONITOR_TITLE, error?.message || `The ${label} service could not be ${action}.`)
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
      MONITOR_TITLE,
      action === 'poweroff' ? 'The power off command is successfully sent.' : 'The restart command is successfully sent.'
    )
  } catch (error) {
    notifyError(MONITOR_TITLE, error?.message || 'The host power action could not be completed.')
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
    void refreshMetrics()
    void refreshServiceStatuses()
  }
)

onMounted(() => {
  void refreshMetrics()
  void refreshServiceStatuses()
})
</script>

<style scoped>
.server-status-panel {
  padding: 16px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.status-card {
  display: flex;
  flex-direction: column;
  min-height: 380px;
  border: 1px solid var(--app-border-strong);
  border-radius: 14px;
  background: var(--app-surface-solid);
  overflow: hidden;
}

.status-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--app-border-strong);
}

.status-card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
  line-height: 1.2;
}

.status-card-body {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-card-body :deep(.usage-metric) {
  margin-top: 2px;
}

.metric-row,
.status-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.metric-label,
.status-label {
  font-size: 0.9rem;
  color: var(--app-text-muted);
  font-weight: 600;
}

.metric-value,
.status-value {
  font-size: 0.88rem;
  color: var(--app-text);
  text-align: left;
  line-height: 1.35;
  word-break: break-word;
}

.status-error {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #b91c1c;
}

.metric-divider {
  height: 1px;
  margin: 2px 0;
  background: var(--app-border-strong);
}

.managed-users {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.managed-user-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border: 1px solid rgba(168, 85, 247, 0.25);
}

.status-card-actions--row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--app-border-strong);
}

.host-action-btn {
  flex: 1 1 0;
  min-width: 0;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.host-action-btn--restart {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface);
  color: var(--app-text-secondary);
}

.host-action-btn--restart:hover:not(:disabled) {
  background: var(--app-surface-hover);
  border-color: var(--app-border-strong);
  color: var(--app-text);
}

.host-action-btn--poweroff {
  border: 1px solid #dc2626;
  background: #dc2626;
  color: #fff;
}

.host-action-btn--poweroff:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}

.host-action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secondary-btn,
.primary-btn {
  display: inline-flex;
  align-items: center;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.secondary-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface);
  color: var(--app-text-secondary);
}

.secondary-btn:hover:not(:disabled) {
  background: var(--app-surface-hover);
}

.primary-btn {
  border: 1px solid var(--app-accent);
  background: var(--app-accent);
  color: #fff;
}

.primary-btn.danger-btn {
  border-color: #dc2626;
  background: #dc2626;
}

.secondary-btn:disabled,
.primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
  .server-status-panel {
    overflow-x: auto;
  }

  .status-grid {
    min-width: 960px;
  }
}
</style>
