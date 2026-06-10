<template>
  <div class="servers-view">
    <div class="content-card filter-card">
      <div class="filter-row">
        <label class="filter-label" for="server-settings-target">Target server</label>
        <select
          id="server-settings-target"
          class="filter-select"
          v-model.number="selectedServer"
        >
          <option disabled value="">Select a server</option>
          <option v-for="server in serverOptions" :key="server.id" :value="server.id">
            {{ server.name || server.ip || `Server #${server.id}` }}
          </option>
        </select>
        <div v-if="selectedServerData" class="filter-meta">
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
          <span class="meta-pill status server-status-pill" :class="angelosStatusClass(selectedServerData)">
            Angelos: {{ angelosStatusLabel(selectedServerData) }}
          </span>
          <span class="meta-pill license">License: {{ selectedServerData.license }}</span>
        </div>
      </div>
    </div>
    <div v-if="selectedServerData" class="content-card settings-card">
      <div class="settings-tabs">
        <div class="tabs-header">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            type="button"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <div
          class="tabs-body"
          :class="{ 'no-outline': activeTab === 'upstream' || activeTab === 'server-status' }"
        >
          <ServerStatusPanel
            v-if="activeTab === 'server-status' && selectedServerData"
            :server-id="selectedServer"
            :server="selectedServerData"
            @updated="onServerStatusUpdated"
          />
          <L4DdosDefensePanel v-else-if="activeTab === 'l4-ddos'" :server-id="selectedServer" />
          <WafPanel v-else-if="activeTab === 'waf'" :server-id="selectedServer" />
          <UpstreamServersPanel v-else-if="activeTab === 'upstream'" :server-id="selectedServer" />
          <div v-else-if="activeTab === 'license' && selectedServerData" class="license-tab-body">
            <p class="license-tab-lead">
              Choose a new plan for <strong>{{ selectedServerData.name || selectedServerData.ip }}</strong>.
              Current tier: <strong>{{ selectedServerData.license || '—' }}</strong>.
              Applying generates a new license on the deploy service and runs a license-only remote deploy.
            </p>
            <LicenseTierUpgradePanel
              :server="selectedServerData"
              :show-cancel="false"
              ok-label="OK"
              @success="onLicenseTierSuccess"
            />
          </div>
          <table v-else class="config-table">
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
                  <span v-if="row.type === 'toggle'" class="value-pill" :class="{ on: row.value === 'On' }">
                    {{ row.value }}
                  </span>
                  <span v-else>{{ row.value }}</span>
                </td>
                <td class="config-note">{{ row.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { fetchServers } from "@/api/servers";
import { notifySuccess } from "@/utils/notify";
import L4DdosDefensePanel from "./L4DdosDefensePanel.vue";
import WafPanel from "./WafPanel.vue";
import UpstreamServersPanel from "./UpstreamServersPanel.vue";
import LicenseTierUpgradePanel from "../LicenseTierUpgradePanel.vue";
import LayerStatusDot from "../LayerStatusDot.vue";
import ServerStatusPanel from "./ServerStatusPanel.vue";
import {
  angelosStatusClass,
  angelosStatusLabel,
  layerDotDescription,
  layerDotTitle,
  resolveLayerStatus,
} from "@/utils/serverLayerStatus";

const route = useRoute();
const serverOptions = ref([]);
const selectedServer = ref("");
const selectedServerData = computed(() =>
  serverOptions.value.find((server) => server.id === selectedServer.value)
);

const loadServers = async () => {
  try {
    const data = await fetchServers();
    serverOptions.value = Array.isArray(data) ? data : [];
  } catch {
    serverOptions.value = [];
  }

  if (!selectedServer.value && serverOptions.value.length) {
    selectedServer.value = serverOptions.value[0].id;
  }
};

const tabs = [
  {
    id: "server-status",
    label: "Monitor Server",
    rows: []
  },
  {
    id: "l4-ddos",
    label: "L4 DDos Defense",
    rows: [
      { name: "Protection mode", value: "Auto", note: "Detect volumetric attacks in real time." },
      { name: "Rate limit", value: "5k req/s", note: "Adaptive per region." },
      { name: "Mitigation", value: "On", note: "Drops suspicious traffic.", type: "toggle" }
    ]
  },
  {
    id: "waf",
    label: "WAF",
    rows: [
      { name: "Ruleset", value: "OWASP Core", note: "Managed rules applied." },
      { name: "Bot control", value: "On", note: "Blocks known bad bots.", type: "toggle" },
      { name: "Alerting", value: "Email", note: "Notify on critical events." }
    ]
  },
  {
    id: "upstream",
    label: "Upstream Servers",
    rows: [
      { name: "Load balancing", value: "Round-robin", note: "Distribute traffic evenly." },
      { name: "Health checks", value: "On", note: "Remove unhealthy upstreams.", type: "toggle" },
      { name: "Failover", value: "Enabled", note: "Automatic fallback on failure." }
    ]
  },
  {
    id: "license",
    label: "License",
    rows: []
  }
];

const activeTab = ref(tabs[0].id);
const activeConfigRows = computed(() => {
  const active = tabs.find((tab) => tab.id === activeTab.value);
  if (!active) return [];
  if (active.id === "license" || active.id === "server-status") return [];
  return active.rows;
});

const applyRouteQuery = () => {
  const raw = route.query.server;
  if (raw != null && String(raw).trim() !== "") {
    const id = Number(raw);
    if (!Number.isNaN(id)) {
      selectedServer.value = id;
    }
  }
  if (String(route.query.tab || "").toLowerCase() === "license") {
    activeTab.value = "license";
  } else if (["basic", "monitor-server", "server-status"].includes(String(route.query.tab || "").toLowerCase())) {
    activeTab.value = "server-status";
  }
};

const onLicenseTierSuccess = async (updated) => {
  await loadServers();
  notifySuccess("License Management", `The license is successfully updated to ${updated?.license || "new tier"}.`);
};

const onServerStatusUpdated = (updated) => {
  if (!updated?.id) return;
  const index = serverOptions.value.findIndex((server) => server.id === updated.id);
  if (index === -1) return;
  serverOptions.value[index] = {
    ...serverOptions.value[index],
    ...updated,
    serviceStatus: updated.serviceStatus ?? updated.service_status ?? serverOptions.value[index].serviceStatus,
    l4Status: updated.l4Status ?? updated.l4_status ?? serverOptions.value[index].l4Status,
    l7Status: updated.l7Status ?? updated.l7_status ?? serverOptions.value[index].l7Status,
  };
};

watch(
  () => route.fullPath,
  () => {
    applyRouteQuery();
  }
);

onMounted(() => {
  void loadServers().then(() => {
    applyRouteQuery();
  });
});
</script>

<style scoped>
.servers-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.content-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--app-heading);
  margin: 0 0 12px 0;
}

.filter-card {
  padding-bottom: 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.filter-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-text-secondary);
}

.filter-select {
  min-width: 220px;
  border-radius: 12px;
  border: 1px solid var(--app-input-border);
  padding: 8px 12px;
  font-size: 0.95rem;
  color: var(--app-text);
  background: var(--app-input-bg);
  box-shadow: 0 1px 6px var(--app-shadow);
}

.filter-select:focus {
  outline: 2px solid var(--app-accent-soft);
  outline-offset: 2px;
  border-color: var(--app-accent);
}

.filter-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.layer-status-dots--meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meta-pill.license {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  border: 1px solid rgba(124, 58, 237, 0.28);
}

.settings-tabs {
  border-top: none;
  padding-top: 0;
}

.tabs-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.tab-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-muted);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: var(--app-accent-soft);
  border-color: var(--app-accent);
  color: var(--app-accent);
  box-shadow: 0 6px 14px rgba(124, 58, 237, 0.15);
}

.tab-btn:hover:not(.active) {
  border-color: var(--app-border-strong);
  color: var(--app-text);
  background: var(--app-surface-hover);
}

.tabs-body {
  border: 1px solid var(--app-border-strong);
  border-radius: 14px;
  overflow: hidden;
  background: var(--app-surface);
}

.tabs-body.no-outline {
  border: none;
  border-radius: 0;
  background: transparent;
}

.config-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 540px;
}

.config-table thead {
  background: var(--app-surface-muted);
}

.config-table th,
.config-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.92rem;
  color: var(--app-text);
  border-bottom: 1px solid var(--app-border-strong);
}

.config-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
  font-weight: 600;
}

.config-note {
  color: var(--app-text-muted);
}

.value-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--app-text-secondary);
  background: rgba(148, 163, 184, 0.18);
}

.value-pill.on {
  color: #15803d;
  background: rgba(34, 197, 94, 0.18);
}

.content-card p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.98rem;
}

.license-tab-body {
  padding: 12px 8px 8px;
  max-width: 1180px;
}

.license-tab-lead {
  margin: 0 0 22px;
  font-size: 0.95rem;
  color: var(--app-text-secondary);
  line-height: 1.55;
}
</style>

