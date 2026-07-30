<template>
  <div class="servers-view">
    <div class="content-card filter-card">
      <div class="filter-row">
        <label class="filter-label" for="server-license-target">Target server</label>
        <select
          id="server-license-target"
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
      <div class="license-tab-body">
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { fetchServers } from "@/api/servers";
import { notifySuccess } from "@/utils/notify";
import LicenseTierUpgradePanel from "../LicenseTierUpgradePanel.vue";
import LayerStatusDot from "../LayerStatusDot.vue";
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

const applyRouteQuery = () => {
  const raw = route.query.server;
  if (raw != null && String(raw).trim() !== "") {
    const id = Number(raw);
    if (!Number.isNaN(id)) {
      selectedServer.value = id;
    }
  }
};

const onLicenseTierSuccess = async (updated) => {
  await loadServers();
  notifySuccess("License Management", `The license is successfully updated to ${updated?.license || "new tier"}.`);
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

.license-tab-body {
  padding: 4px 0 0;
  max-width: 1180px;
}

.license-tab-lead {
  margin: 0 0 22px;
  font-size: 0.95rem;
  color: var(--app-text-secondary);
  line-height: 1.55;
}
</style>
