<template>
  <div class="servers-view">
    <div class="content-card">
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
      <h2>Server Settings</h2>
      <p>Manage server configuration, alerts, and maintenance options.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { serverList } from "@/data/servers";

const serverOptions = serverList;
const selectedServer = ref("");
const selectedServerData = computed(() =>
  serverOptions.find((server) => server.id === selectedServer.value)
);
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

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
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

.content-card p {
  margin: 0;
  color: #4a5568;
  font-size: 0.98rem;
}
</style>

