<template>
  <div class="edge-cfg">
    <header class="edge-cfg__topbar">
      <div class="edge-cfg__topbar-left">
        <p class="edge-cfg__kicker">Infrastructure</p>
        <h2 class="info-hint-heading">
          <span>Configure edge</span>
          <InfoHint
            text="Monitor runtime health, listening ports, and L4 defense for the selected edge."
            aria-label="Configure edge help"
          />
        </h2>
      </div>
      <div class="edge-cfg__picker">
        <label for="server-settings-target">Edge</label>
        <select
          id="server-settings-target"
          v-model.number="selectedServer"
        >
          <option disabled value="">Select an edge</option>
          <option v-for="server in serverOptions" :key="server.id" :value="server.id">
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
      <section class="edge-cfg__statusbar" aria-label="Edge status">
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
            <strong>{{ angelosStatusLabel(selectedServerData) }}</strong>
          </div>
          <span class="edge-cfg__pill">{{ selectedServerData.license || 'No license' }}</span>
          <span v-if="selectedServerData.ip" class="edge-cfg__pill edge-cfg__pill--muted num">
            {{ selectedServerData.ip }}
          </span>
        </div>
      </section>

      <nav class="edge-cfg__tabs" aria-label="Edge configuration sections">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="edge-cfg__tab"
          :class="{ active: activeTab === tab.id }"
          @click="selectTab(tab.id)"
        >
          <span class="edge-cfg__tab-label info-hint-heading">
            <span>{{ tab.label }}</span>
            <InfoHint v-if="tab.hint" :text="tab.hint" :aria-label="`${tab.label} help`" />
          </span>
        </button>
      </nav>

      <section
        ref="tabsBodyEl"
        class="edge-cfg__panel"
      >
        <ServerStatusPanel
          v-if="activeTab === 'server-status' && selectedServerData"
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
          v-else-if="activeTab === 'l4-config'"
          :key="`l4-config-${selectedServer}`"
          :server-id="selectedServer"
        />
        <L4BlacklistPanel
          v-else-if="activeTab === 'l4-blacklist'"
          :key="`l4-blacklist-${selectedServer}`"
          :server-id="selectedServer"
        />
        <L4WhitelistPanel
          v-else-if="activeTab === 'l4-whitelist'"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchServers } from '@/api/servers'
import L4DdosDefensePanel from './L4DdosDefensePanel.vue'
import L4BlacklistPanel from './L4BlacklistPanel.vue'
import L4WhitelistPanel from './L4WhitelistPanel.vue'
import LayerStatusDot from '../LayerStatusDot.vue'
import InfoHint from '../InfoHint.vue'
import ListeningPortsPanel from './ListeningPortsPanel.vue'
import ServerStatusPanel from './ServerStatusPanel.vue'
import {
  angelosStatusClass,
  angelosStatusLabel,
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
  serverOptions.value.find((server) => server.id === selectedServer.value),
)

const statusSummary = computed(() => {
  const server = selectedServerData.value
  if (!server) return ''
  const angelos = angelosStatusLabel(server)
  const license = server.license || 'unlicensed'
  const ip = server.ip ? ` · ${server.ip}` : ''
  return `Angelos ${angelos} · ${license}${ip}`
})

const loadServers = async () => {
  try {
    const data = await fetchServers()
    serverOptions.value = Array.isArray(data) ? data : []
  } catch {
    serverOptions.value = []
  }

  if (!selectedServer.value && serverOptions.value.length) {
    selectedServer.value = serverOptions.value[0].id
  }
}

const tabs = [
  { id: 'server-status', label: 'Monitor', hint: 'Host metrics and Angelos / Sparta / Athens service health.' },
  { id: 'listening-ports', label: 'Ports', hint: 'Ports that accept client traffic on this edge.' },
  { id: 'l4-config', label: 'XDP', hint: 'How Sparta attaches to the NIC and reacts to L4 floods.' },
  { id: 'l4-blacklist', label: 'Block IP', hint: 'Blocked source IPs for this edge’s XDP path.' },
  { id: 'l4-whitelist', label: 'Allow IP', hint: 'Trusted source IPs that bypass L4 blocking.' },
]

const activeTab = ref(tabs[0].id)
const activeConfigRows = computed(() => {
  const active = tabs.find((tab) => tab.id === activeTab.value)
  if (!active) return []
  if (
    active.id === 'server-status'
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

  const raw = route.query.server
  if (raw != null && String(raw).trim() !== '') {
    const id = Number(raw)
    if (!Number.isNaN(id)) {
      selectedServer.value = id
    }
  }
  const tab = String(route.query.tab || '').toLowerCase()
  if (['basic', 'monitor-server', 'server-status'].includes(tab)) {
    selectTab('server-status')
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
  const index = serverOptions.value.findIndex((server) => server.id === updated.id)
  if (index === -1) return
  serverOptions.value[index] = {
    ...serverOptions.value[index],
    ...updated,
    serviceStatus: updated.serviceStatus ?? updated.service_status ?? serverOptions.value[index].serviceStatus,
    l4Status: updated.l4Status ?? updated.l4_status ?? serverOptions.value[index].l4Status,
    l7Status: updated.l7Status ?? updated.l7_status ?? serverOptions.value[index].l7Status,
  }
}

watch(
  () => route.fullPath,
  () => {
    applyRouteQuery()
  },
)

onMounted(() => {
  void loadServers().then(() => {
    applyRouteQuery()
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: var(--cfg-radius);
  background: var(--app-surface);
}

.edge-cfg__status-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.edge-cfg__status-copy strong {
  font-size: 15px;
  color: var(--app-heading);
}

.edge-cfg__status-copy span {
  font-size: 12.5px;
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
}

.edge-cfg__angelos {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.edge-cfg__angelos-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}

.edge-cfg__angelos strong {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.edge-cfg__angelos--running {
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.14);
  border-color: rgba(46, 158, 108, 0.32);
}

.edge-cfg__angelos--running .edge-cfg__angelos-dot {
  box-shadow: 0 0 0 3px rgba(63, 189, 133, 0.2);
  animation: edge-cfg-pulse 1.8s ease-in-out infinite;
}

.edge-cfg__angelos--deployed {
  color: #5b9df0;
  background: rgba(91, 157, 240, 0.14);
  border-color: rgba(91, 157, 240, 0.3);
}

.edge-cfg__angelos--stopped {
  color: #e15241;
  background: rgba(225, 82, 65, 0.14);
  border-color: rgba(225, 82, 65, 0.34);
}

.edge-cfg__angelos--unknown {
  color: var(--app-text-muted);
  background: rgba(139, 151, 143, 0.12);
  border-color: rgba(139, 151, 143, 0.24);
}

@keyframes edge-cfg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.edge-cfg__pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 650;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.12);
  border: 1px solid rgba(46, 158, 108, 0.26);
}

.edge-cfg__pill--muted {
  color: var(--app-text-muted);
  background: rgba(139, 151, 143, 0.1);
  border-color: rgba(139, 151, 143, 0.2);
}

.edge-cfg__tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.edge-cfg__tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px;
  border-radius: var(--cfg-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.edge-cfg__tab:hover:not(.active) {
  border-color: color-mix(in srgb, var(--app-accent) 45%, var(--app-border));
  background: color-mix(in srgb, var(--app-accent) 5%, var(--app-surface));
}

.edge-cfg__tab.active {
  border-color: rgba(46, 158, 108, 0.45);
  background: rgba(46, 158, 108, 0.1);
  box-shadow: inset 0 -2px 0 var(--dorian-viper-500, var(--app-accent));
}

.edge-cfg__tab-label {
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
}

.edge-cfg__tab.active .edge-cfg__tab-label {
  color: var(--dorian-viper-400, var(--app-accent));
}

.edge-cfg__tab-hint {
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.edge-cfg__panel {
  border: 1px solid var(--app-border);
  border-radius: var(--cfg-radius);
  background: var(--app-surface);
  padding: 16px;
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

@media (max-width: 1100px) {
  .edge-cfg__tabs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .edge-cfg__tabs {
    grid-template-columns: 1fr;
  }
}
</style>
