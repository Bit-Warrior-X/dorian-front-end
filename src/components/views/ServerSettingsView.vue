<template>
  <div class="servers-view">
    <div class="content-card filter-card">
      <div class="filter-row">
        <label class="filter-label" for="server-settings-target">Target server</label>
        <select id="server-settings-target" class="filter-select" v-model="selectedServer">
          <option disabled value="">Select a server</option>
          <option v-for="server in serverOptions" :key="server.id" :value="server.id">
            {{ server.name }}
          </option>
        </select>
        <div v-if="selectedServerData" class="filter-meta">
          <span class="meta-pill status" :class="selectedServerData.statusClass">
            Status: {{ selectedServerData.statusLabel }}
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
        <div class="tabs-body" :class="{ 'no-outline': activeTab === 'upstream' }">
          <L4DdosDefensePanel v-if="activeTab === 'l4-ddos'" />
          <WafPanel v-else-if="activeTab === 'waf'" />
          <UpstreamServersPanel v-else-if="activeTab === 'upstream'" />
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
import { ref, computed } from "vue";
import { serverList } from "@/data/servers";
import L4DdosDefensePanel from "./L4DdosDefensePanel.vue";
import WafPanel from "./WafPanel.vue";
import UpstreamServersPanel from "./UpstreamServersPanel.vue";

const serverOptions = serverList;
const selectedServer = ref(serverOptions[0]?.id || "");
const selectedServerData = computed(() =>
  serverOptions.find((server) => server.id === selectedServer.value)
);

const getServerInfoRows = () => {
  const server = selectedServerData.value;
  const status = server?.statusLabel || "-";
  const license = server?.license || "-";
  const users = server?.users ?? "-";
  const sshPort = server?.sshPort || "-";
  const username = server?.username || "-";

  return [
    { name: "Server name", value: server?.name || "-", note: "Display name for this server." },
    { name: "Server ID", value: server?.id || "-", note: "Unique server identifier." },
    { name: "Primary IP", value: server?.ip || "-", note: "Current server address." },
    { name: "Status", value: status, note: "Current server status." },
    { name: "License", value: license, note: "Applied license tier." },
    { name: "Managed users", value: users, note: "Number of assigned users." },
    { name: "Version", value: server?.version || "-", note: "Installed version." },
    { name: "SSH user", value: username, note: "Default SSH username." },
    { name: "SSH port", value: sshPort, note: "SSH connection port." },
    { name: "Expired date", value: server?.expiredDate || "-", note: "License expiration date." },
    { name: "Created", value: server?.created || "-", note: "Provisioned date." }
  ];
};

const tabs = [
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
    id: "info",
    label: "Server Information",
    rows: getServerInfoRows()
  }
];

const activeTab = ref(tabs[0].id);
const activeConfigRows = computed(() => {
  const active = tabs.find((tab) => tab.id === activeTab.value);
  if (!active) return [];
  if (active.id !== "info") return active.rows;
  return getServerInfoRows();
});
</script>

<style scoped>
.servers-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.content-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
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
  color: #2d3748;
}

.filter-select {
  min-width: 220px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 8px 12px;
  font-size: 0.95rem;
  color: #1a202c;
  background: #fff;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.06);
}

.filter-select:focus {
  outline: 2px solid rgba(66, 153, 225, 0.35);
  outline-offset: 2px;
}

.filter-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.18);
  color: #334155;
}

.meta-pill.status.active {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.meta-pill.status.inactive {
  background: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
}

.meta-pill.status.maintenance {
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
}

.meta-pill.license {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
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
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: #fff;
  color: #475569;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.5);
  color: #1d4ed8;
  box-shadow: 0 6px 14px rgba(59, 130, 246, 0.12);
}

.tab-btn:hover:not(.active) {
  border-color: rgba(100, 116, 139, 0.6);
  color: #334155;
}

.tabs-body {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 14px;
  overflow: hidden;
}

.tabs-body.no-outline {
  border: none;
  border-radius: 0;
}

.config-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 540px;
}

.config-table thead {
  background: rgba(248, 250, 252, 0.9);
}

.config-table th,
.config-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.92rem;
  color: #1f2937;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.config-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  font-weight: 600;
}

.config-note {
  color: #64748b;
}

.value-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  background: rgba(148, 163, 184, 0.18);
}

.value-pill.on {
  color: #15803d;
  background: rgba(34, 197, 94, 0.18);
}

.content-card p {
  margin: 0;
  color: #4a5568;
  font-size: 0.98rem;
}
</style>

