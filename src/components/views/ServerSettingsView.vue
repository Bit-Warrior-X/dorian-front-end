<template>
  <div class="edge-cfg">
    <header class="edge-cfg__topbar">
      <div class="edge-cfg__topbar-left">
        <p class="edge-cfg__kicker">Infrastructure</p>
        <h2 class="info-hint-heading">
          <span>Configure edge</span>
          <InfoHint
            text="Edit basic info, monitor runtime health, listening ports, and L4 defense for the selected edge."
            aria-label="Configure edge help"
          />
        </h2>
      </div>
      <div class="edge-cfg__picker">
        <label for="server-settings-target">Edge</label>
        <select
          id="server-settings-target"
          :value="selectedServer === '' || selectedServer == null ? '' : String(selectedServer)"
          @change="onServerPicked"
        >
          <option disabled value="">Select an edge</option>
          <option v-for="server in serverOptions" :key="server.id" :value="String(server.id)">
            {{ server.name || server.ip || `Edge #${server.id}` }}
          </option>
        </select>
      </div>
    </header>

    <div v-if="!selectedServerData" class="edge-cfg__empty">
      <h3 class="info-hint-heading">
        <span>Choose an edge</span>
        <InfoHint
          text="Pick a node above to monitor runtime health, listening ports, and L4 protection."
          aria-label="Choose an edge help"
        />
      </h3>
    </div>

    <template v-else>
      <section class="edge-cfg__statusbar" :class="`edge-cfg__statusbar--${angelosStatusClass(selectedServerData)}`" aria-label="Edge status">
        <span class="edge-cfg__avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3.5" y="4" width="17" height="6.5" rx="1.6" />
            <rect x="3.5" y="13.5" width="17" height="6.5" rx="1.6" />
            <path d="M7 7.25h.01M7 16.75h.01M11 7.25h6M11 16.75h6" />
          </svg>
        </span>
        <div class="edge-cfg__status-copy">
          <strong>{{ selectedServerData.name || selectedServerData.ip || `Edge #${selectedServerData.id}` }}</strong>
          <span>{{ statusSummary }}</span>
        </div>
        <div class="edge-cfg__status-pills">
          <span class="layer-status-dots layer-status-dots--meta">
            <LayerStatusDot
              layer="l4"
              :status="resolveLayerStatus(selectedServerData, 'l4')"
              :description="layerDotDescription(selectedServerData, 'l4')"
              :aria-label="layerDotTitle(selectedServerData, 'l4')"
            />
            <LayerStatusDot
              layer="l7"
              :status="resolveLayerStatus(selectedServerData, 'l7')"
              :description="layerDotDescription(selectedServerData, 'l7')"
              :aria-label="layerDotTitle(selectedServerData, 'l7')"
            />
          </span>
          <div
            class="edge-cfg__angelos"
            :class="`edge-cfg__angelos--${angelosStatusClass(selectedServerData)}`"
          >
            <span class="edge-cfg__angelos-dot" aria-hidden="true"></span>
            <strong>Angelos {{ angelosStatusLabel(selectedServerData) }}</strong>
          </div>
          <span class="edge-cfg__pill">{{ selectedServerData.license || 'No license' }}</span>
          <span v-if="selectedServerData.ip" class="edge-cfg__pill edge-cfg__pill--muted num">
            {{ selectedServerData.ip }}
          </span>
        </div>
      </section>

      <nav class="edge-cfg__tabs" aria-label="Edge configuration sections" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          class="edge-cfg__tab"
          :class="{
            active: activeTab === tab.id,
            'edge-cfg__tab--locked': isL4TabLocked(tab.id),
          }"
          :aria-selected="activeTab === tab.id"
          :aria-disabled="isL4TabLocked(tab.id) ? 'true' : undefined"
          :title="isL4TabLocked(tab.id) ? 'Requires a valid L4 license' : tab.hint"
          @click="selectTab(tab.id)"
        >
          <svg class="edge-cfg__tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <template v-if="tab.id === 'basic-info'"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></template>
            <template v-else-if="tab.id === 'server-status'"><path d="M3 12h4l2.5-6 5 12 2.5-6h4" /></template>
            <template v-else-if="tab.id === 'listening-ports'"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 9v6M15 9v6M9 12h6" /></template>
            <template v-else-if="tab.id === 'l4-config'"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /></template>
            <template v-else-if="tab.id === 'l4-blacklist'"><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></template>
            <template v-else><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></template>
          </svg>
          <span class="edge-cfg__tab-label">{{ tab.label }}</span>
          <svg v-if="isL4TabLocked(tab.id)" class="edge-cfg__tab-lock" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
          <span v-else-if="tab.requiresL4" class="edge-cfg__tab-tag">L4</span>
        </button>
      </nav>

      <section
        ref="tabsBodyEl"
        class="edge-cfg__panel"
      >
        <ServerBasicSettingsPanel
          v-if="activeTab === 'basic-info' && selectedServerData"
          :key="`basic-info-${selectedServer}`"
          :server="selectedServerData"
          @updated="onServerStatusUpdated"
        />
        <ServerStatusPanel
          v-else-if="activeTab === 'server-status' && selectedServerData"
          :server-id="selectedServer"
          :server="selectedServerData"
          @updated="onServerStatusUpdated"
        />
        <ListeningPortsPanel
          v-else-if="activeTab === 'listening-ports'"
          :key="`listening-ports-${selectedServer}`"
          :server-id="selectedServer"
        />
        <L4DdosDefensePanel
          v-else-if="activeTab === 'l4-config' && l4LicenseValid"
          :key="`l4-config-${selectedServer}`"
          :server-id="selectedServer"
        />
        <L4BlacklistPanel
          v-else-if="activeTab === 'l4-blacklist' && l4LicenseValid"
          :key="`l4-blacklist-${selectedServer}`"
          :server-id="selectedServer"
        />
        <L4WhitelistPanel
          v-else-if="activeTab === 'l4-whitelist' && l4LicenseValid"
          :key="`l4-whitelist-${selectedServer}`"
          :server-id="selectedServer"
        />
        <div v-else-if="activeConfigRows.length" class="edge-cfg__table-wrap">
          <table class="edge-cfg__table">
            <thead>
              <tr>
                <th>Setting</th>
                <th>Value</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in activeConfigRows" :key="row.name">
                <td>{{ row.name }}</td>
                <td>
                  <span v-if="row.type === 'toggle'" class="edge-cfg__value" :class="{ on: row.value === 'On' }">
                    {{ row.value }}
                  </span>
                  <span v-else>{{ row.value }}</span>
                </td>
                <td class="edge-cfg__note">{{ row.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchServers } from '@/api/servers'
import L4DdosDefensePanel from './L4DdosDefensePanel.vue'
import L4BlacklistPanel from './L4BlacklistPanel.vue'
import L4WhitelistPanel from './L4WhitelistPanel.vue'
import LayerStatusDot from '../LayerStatusDot.vue'
import InfoHint from '../InfoHint.vue'
import ListeningPortsPanel from './ListeningPortsPanel.vue'
import ServerStatusPanel from './ServerStatusPanel.vue'
import ServerBasicSettingsPanel from './ServerBasicSettingsPanel.vue'
import { notifyWarning } from '@/utils/notify'
import {
  angelosStatusClass,
  angelosStatusLabel,
  isL4LicenseValid,
  l4LicenseBlockMessage,
  layerDotDescription,
  layerDotTitle,
  resolveLayerStatus,
} from '@/utils/serverLayerStatus'

const route = useRoute()
const router = useRouter()
const serverOptions = ref([])
const selectedServer = ref('')
const tabsBodyEl = ref(null)
const selectedServerData = computed(() =>
  serverOptions.value.find((server) => Number(server.id) === Number(selectedServer.value)),
)

const serverIdFromQuery = () => {
  const raw = Array.isArray(route.query.server) ? route.query.server[0] : route.query.server
  if (raw == null || String(raw).trim() === '') return null
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

const statusSummary = computed(() => {
  const server = selectedServerData.value
  if (!server) return ''
  const users = Array.isArray(server.managedUserIds) ? server.managedUserIds.length : Number(server.users) || 0
  const parts = [
    server.version ? `Version ${server.version}` : '',
    server.os || '',
    server.sshUser ? `SSH ${server.sshUser}@${server.sshPort || 22}` : '',
    `${users} assigned user${users === 1 ? '' : 's'}`,
  ]
  return parts.filter(Boolean).join(' · ')
})

const loadServers = async () => {
  try {
    const data = await fetchServers()
    serverOptions.value = Array.isArray(data) ? data : []
  } catch {
    serverOptions.value = []
  }

  const requested = serverIdFromQuery()
  if (requested != null) {
    selectedServer.value = requested
    return
  }
  if ((selectedServer.value === '' || selectedServer.value == null) && serverOptions.value.length) {
    selectedServer.value = Number(serverOptions.value[0].id)
  }
}

const tabs = [
  { id: 'basic-info', label: 'Basic info', hint: 'Edge name, IP, SSH credentials and assigned users.' },
  { id: 'server-status', label: 'Monitor', hint: 'Host metrics and Angelos / Sparta / Athens service health.' },
  { id: 'listening-ports', label: 'Ports', hint: 'Ports that accept client traffic on this edge.' },
  { id: 'l4-config', label: 'XDP', hint: 'How Sparta attaches to the NIC and reacts to L4 floods.', requiresL4: true },
  { id: 'l4-blacklist', label: 'Block IP', hint: 'Blocked source IPs for this edge’s XDP path.', requiresL4: true },
  { id: 'l4-whitelist', label: 'Allow IP', hint: 'Trusted source IPs that bypass L4 blocking.', requiresL4: true },
]

const L4_TAB_IDS = new Set(tabs.filter((tab) => tab.requiresL4).map((tab) => tab.id))

const l4LicenseValid = computed(() => isL4LicenseValid(selectedServerData.value))

const isL4TabLocked = (tabId) => L4_TAB_IDS.has(tabId) && !l4LicenseValid.value

const notifyL4LicenseBlocked = (tabId) => {
  const tab = tabs.find((item) => item.id === tabId)
  notifyWarning(tab?.label || 'L4', l4LicenseBlockMessage(selectedServerData.value))
}

const activeTab = ref('server-status')
const activeConfigRows = computed(() => {
  const active = tabs.find((tab) => tab.id === activeTab.value)
  if (!active) return []
  if (
    active.id === 'basic-info'
    || active.id === 'server-status'
    || active.id === 'listening-ports'
    || active.id === 'l4-config'
    || active.id === 'l4-blacklist'
    || active.id === 'l4-whitelist'
  ) {
    return []
  }
  return active.rows
})

const selectTab = (tabId) => {
  if (L4_TAB_IDS.has(tabId) && !l4LicenseValid.value) {
    notifyL4LicenseBlocked(tabId)
    if (L4_TAB_IDS.has(activeTab.value)) activeTab.value = 'server-status'
    return
  }
  activeTab.value = tabId
  requestAnimationFrame(() => {
    tabsBodyEl.value?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  })
}

const applyRouteQuery = () => {
  if (String(route.query.tab || '').toLowerCase() === 'license') {
    void router.replace({
      name: 'server-license',
      query: route.query.server != null ? { server: route.query.server } : {},
    })
    return
  }

  const requested = serverIdFromQuery()
  if (requested != null) {
    selectedServer.value = requested
  }
  const tab = String(route.query.tab || '').toLowerCase()
  if (['basic', 'monitor-server', 'server-status'].includes(tab)) {
    selectTab('server-status')
  } else if (['basic-info', 'details', 'edit'].includes(tab)) {
    selectTab('basic-info')
  } else if (tab === 'listening-ports') {
    selectTab('listening-ports')
  } else if (tab === 'l4-blacklist' || tab === 'blacklist') {
    selectTab('l4-blacklist')
  } else if (tab === 'l4-whitelist' || tab === 'whitelist') {
    selectTab('l4-whitelist')
  } else if (tab === 'l4-config' || tab === 'l4-ddos' || tab === 'l4') {
    selectTab('l4-config')
  }
}

const onServerStatusUpdated = (updated) => {
  if (!updated?.id) return
  const index = serverOptions.value.findIndex((server) => Number(server.id) === Number(updated.id))
  if (index === -1) return
  serverOptions.value[index] = {
    ...serverOptions.value[index],
    ...updated,
    serviceStatus: updated.serviceStatus ?? updated.service_status ?? serverOptions.value[index].serviceStatus,
    l4Status: updated.l4Status ?? updated.l4_status ?? serverOptions.value[index].l4Status,
    l7Status: updated.l7Status ?? updated.l7_status ?? serverOptions.value[index].l7Status,
  }
}

let pickingServer = false

const onServerPicked = (event) => {
  const id = Number(event.target.value)
  if (!Number.isFinite(id)) return
  pickingServer = true
  selectedServer.value = id
  const nextQuery = { ...route.query, server: String(id) }
  void router.replace({ name: 'server-settings', query: nextQuery }).finally(() => {
    pickingServer = false
  })
}

watch(
  () => route.fullPath,
  () => {
    applyRouteQuery()
  },
)

watch(selectedServer, (id) => {
  if (pickingServer) return
  const requested = serverIdFromQuery()
  if (requested != null && Number(id) !== requested) {
    selectedServer.value = requested
  }
})

watch(selectedServerData, (server) => {
  const tabId = activeTab.value
  if (!server || !L4_TAB_IDS.has(tabId) || isL4LicenseValid(server)) return
  activeTab.value = 'server-status'
  notifyL4LicenseBlocked(tabId)
})

onMounted(() => {
  void loadServers().then(async () => {
    applyRouteQuery()
    await nextTick()
    const requested = serverIdFromQuery()
    if (requested != null) selectedServer.value = requested
  })
})
</script>

<style scoped>
.edge-cfg {
  --cfg-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 1680px;
  margin: 0 auto;
  min-height: 100%;
  font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.edge-cfg__topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.edge-cfg__kicker {
  margin: 0 0 3px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.edge-cfg__topbar-left h2 {
  margin: 0 0 3px;
  font-size: 1.4rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
  line-height: 1.2;
}

.edge-cfg__topbar-left p:last-child {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.edge-cfg__picker {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 240px;
}

.edge-cfg__picker label {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.edge-cfg__picker select {
  border: 1px solid var(--app-input-border);
  border-radius: 6px;
  padding: 9px 12px;
  font-size: 13.5px;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
  min-width: 260px;
}

.edge-cfg__picker select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.edge-cfg__empty {
  padding: 36px 20px;
  border: 1px solid var(--app-border);
  border-radius: var(--cfg-radius);
  background: var(--app-surface);
  text-align: center;
  color: var(--app-text-muted);
}

.edge-cfg__empty h3 {
  margin: 0 0 6px;
  color: var(--app-heading);
  font-size: 1.05rem;
}

.edge-cfg__empty p {
  margin: 0;
  font-size: 13.5px;
}

.edge-cfg__statusbar {
  --status-tone: var(--app-text-muted);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 14px;
  padding: 12px 14px;
  border: 0.5px solid var(--app-border);
  border-radius: 12px;
  background:
    radial-gradient(90% 140% at 0% 0%, color-mix(in srgb, var(--status-tone) 9%, transparent) 0%, transparent 60%),
    var(--app-surface);
}

.edge-cfg__statusbar--running { --status-tone: var(--dorian-viper-400, #3fbd85); }
.edge-cfg__statusbar--deployed { --status-tone: var(--dorian-l4, #6b9fd4); }
.edge-cfg__statusbar--stopped { --status-tone: var(--dorian-danger, #e15241); }

.edge-cfg__avatar {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--status-tone);
  background: color-mix(in srgb, var(--status-tone) 13%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--status-tone) 30%, transparent);
}

.edge-cfg__avatar svg { width: 19px; height: 19px; }

.edge-cfg__status-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.edge-cfg__status-copy strong {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--app-heading);
}

.edge-cfg__status-copy span {
  font-size: 12px;
  color: var(--app-text-muted);
}

.edge-cfg__status-pills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.layer-status-dots--meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}

.edge-cfg__angelos {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 0.5px solid transparent;
}

.edge-cfg__angelos-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}

.edge-cfg__angelos strong {
  font-size: 11.5px;
  font-weight: 650;
  line-height: 1.2;
}

.edge-cfg__angelos--running {
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 13%, transparent);
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 30%, transparent);
}

.edge-cfg__angelos--running .edge-cfg__angelos-dot {
  animation: edge-cfg-pulse 1.8s ease-in-out infinite;
}

.edge-cfg__angelos--deployed {
  color: var(--dorian-l4, #6b9fd4);
  background: color-mix(in srgb, var(--dorian-l4, #6b9fd4) 13%, transparent);
  border-color: color-mix(in srgb, var(--dorian-l4, #6b9fd4) 30%, transparent);
}

.edge-cfg__angelos--stopped {
  color: var(--dorian-danger, #e15241);
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 13%, transparent);
  border-color: color-mix(in srgb, var(--dorian-danger, #e15241) 32%, transparent);
}

.edge-cfg__angelos--unknown {
  color: var(--app-text-muted);
  background: var(--app-surface-muted);
  border-color: var(--app-border);
}

@keyframes edge-cfg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.edge-cfg__pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 650;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  color: var(--app-text);
  background: var(--app-surface-muted);
  border: 0.5px solid var(--app-border);
}

.edge-cfg__pill--muted {
  color: var(--app-text-muted);
}

.edge-cfg__tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
  overflow-x: auto;
  scrollbar-width: none;
}

.edge-cfg__tabs::-webkit-scrollbar { display: none; }

.edge-cfg__tab {
  flex: 1 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 14px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.edge-cfg__tab:hover:not(.active):not(.edge-cfg__tab--locked) {
  color: var(--app-heading);
  background: var(--app-surface-muted);
}

.edge-cfg__tab:focus-visible {
  outline: 2px solid var(--app-accent);
  outline-offset: -2px;
}

.edge-cfg__tab.active {
  color: var(--dorian-viper-400, var(--app-accent));
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 12%, var(--app-surface-muted));
  box-shadow: inset 0 0 0 0.5px color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 40%, transparent);
}

.edge-cfg__tab--locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.edge-cfg__tab-icon { width: 16px; height: 16px; flex-shrink: 0; }

.edge-cfg__tab-label {
  font-size: 13px;
  font-weight: 600;
}

.edge-cfg__tab-lock { width: 12px; height: 12px; }

.edge-cfg__tab-tag {
  padding: 1px 5px;
  border-radius: 4px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--dorian-l4, #6b9fd4);
  background: color-mix(in srgb, var(--dorian-l4, #6b9fd4) 14%, transparent);
}

.edge-cfg__panel {
  border: 0.5px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface);
  padding: 18px;
  min-height: 320px;
}

.edge-cfg__table-wrap {
  overflow-x: auto;
}

.edge-cfg__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 540px;
}

.edge-cfg__table th,
.edge-cfg__table td {
  text-align: left;
  padding: 11px 12px;
  font-size: 13px;
  color: var(--app-text);
  border-bottom: 1px solid var(--app-border);
}

.edge-cfg__table th {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--app-text-muted);
  font-weight: 650;
  background: color-mix(in srgb, var(--app-surface-elevated) 80%, transparent);
}

.edge-cfg__note {
  color: var(--app-text-muted);
}

.edge-cfg__value {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 650;
  color: var(--app-text-muted);
  background: rgba(139, 151, 143, 0.12);
  border: 1px solid rgba(139, 151, 143, 0.2);
}

.edge-cfg__value.on {
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.14);
  border-color: rgba(46, 158, 108, 0.28);
}

@media (max-width: 760px) {
  .edge-cfg__tab { flex: 0 0 auto; }
  .edge-cfg__status-pills { width: 100%; }
}
</style>
