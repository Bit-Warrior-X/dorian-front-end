<template>
  <div class="ports-panel">
    <div class="waf-section-header">
      <div>
        <h4>Ports</h4>
        <p class="waf-section-desc">
          Choose which HTTP and HTTPS listening ports this site uses on each edge server.
        </p>
      </div>
      <div class="header-actions">
        <button
          class="primary-btn"
          type="button"
          :disabled="!canSave"
          @click="saveSelections"
        >
          {{ saving ? "Saving..." : "Save" }}
        </button>
      </div>
    </div>

    <p v-if="!siteId" class="helper-text">Select a site to configure ports.</p>
    <p v-else-if="loading" class="helper-text">Loading port selections...</p>
    <p v-else-if="loadError" class="helper-text error-text">{{ loadError }}</p>
    <div v-else-if="!servers.length" class="empty-card">
      <h5>No edges assigned</h5>
      <p>Assign edges to this site in Site Management before selecting ports.</p>
    </div>

    <template v-else>
      <div class="server-tabs" role="tablist" aria-label="Edge servers">
        <button
          v-for="server in servers"
          :key="server.serverId"
          type="button"
          class="server-tab"
          role="tab"
          :class="{ active: selectedServerId === server.serverId }"
          :aria-selected="selectedServerId === server.serverId"
          @click="selectServer(server.serverId)"
        >
          <span class="server-tab__name">{{ serverLabel(server) }}</span>
          <span class="server-tab__meta">{{ selectionSummary(server) }}</span>
        </button>
      </div>

      <div v-if="activeServer" class="section-card">
        <div class="server-summary">
          <div>
            <h5>{{ serverLabel(activeServer) }}</h5>
            <p class="helper-text">
              Available ports come from Edge Settings → Listening Ports for this edge.
            </p>
          </div>
        </div>

        <div class="port-field">
          <label for="site-http-ports">HTTP</label>
          <div
            class="combobox combobox--tags"
            :class="{ disabled: saving }"
            @click.stop="toggleDropdown('http')"
          >
            <div class="combobox-input-wrap" @click.stop="openDropdown('http')">
              <div v-if="selectedHttpPorts.length" class="selected-tags-inline">
                <span
                  v-for="port in selectedHttpPorts"
                  :key="port.id"
                  class="port-tag"
                >
                  {{ port.port }}
                  <button
                    type="button"
                    class="port-tag-remove"
                    aria-label="Remove HTTP port"
                    :disabled="saving"
                    @click.stop="togglePort('http', port.id)"
                  >
                    ×
                  </button>
                </span>
              </div>
              <input
                id="site-http-ports"
                v-model="httpSearch"
                class="combobox-inline-input"
                type="text"
                placeholder="Select HTTP ports"
                :disabled="saving || !activeServer.httpPorts.length"
                @focus="openDropdown('http')"
                @click.stop
              />
              <span class="combobox-arrow" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
            <div v-show="openDropdownKey === 'http'" class="combobox-menu" @click.stop>
              <button
                v-for="port in filteredHttpPorts"
                :key="port.id"
                type="button"
                class="combobox-option"
                :class="{ selected: draftHttpIds.includes(port.id) }"
                @click="togglePort('http', port.id)"
              >
                <span class="combobox-check" aria-hidden="true">
                  <svg v-if="draftHttpIds.includes(port.id)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <span class="option-main">{{ port.port }}</span>
                <span class="option-meta">{{ port.description || port.status || "HTTP" }}</span>
              </button>
              <div v-if="!filteredHttpPorts.length" class="combobox-empty">
                {{ activeServer.httpPorts.length ? "No matching HTTP ports" : "No HTTP listening ports on this server" }}
              </div>
            </div>
          </div>
        </div>

        <div class="port-field">
          <label for="site-https-ports">HTTPS</label>
          <div
            class="combobox combobox--tags"
            :class="{ disabled: saving }"
            @click.stop="toggleDropdown('https')"
          >
            <div class="combobox-input-wrap" @click.stop="openDropdown('https')">
              <div v-if="selectedHttpsPorts.length" class="selected-tags-inline">
                <span
                  v-for="port in selectedHttpsPorts"
                  :key="port.id"
                  class="port-tag"
                >
                  {{ port.port }}
                  <button
                    type="button"
                    class="port-tag-remove"
                    aria-label="Remove HTTPS port"
                    :disabled="saving"
                    @click.stop="togglePort('https', port.id)"
                  >
                    ×
                  </button>
                </span>
              </div>
              <input
                id="site-https-ports"
                v-model="httpsSearch"
                class="combobox-inline-input"
                type="text"
                placeholder="Select HTTPS ports"
                :disabled="saving || !activeServer.httpsPorts.length"
                @focus="openDropdown('https')"
                @click.stop
              />
              <span class="combobox-arrow" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
            <div v-show="openDropdownKey === 'https'" class="combobox-menu" @click.stop>
              <button
                v-for="port in filteredHttpsPorts"
                :key="port.id"
                type="button"
                class="combobox-option"
                :class="{ selected: draftHttpsIds.includes(port.id) }"
                @click="togglePort('https', port.id)"
              >
                <span class="combobox-check" aria-hidden="true">
                  <svg v-if="draftHttpsIds.includes(port.id)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <span class="option-main">{{ port.port }}</span>
                <span class="option-meta">{{ port.description || port.status || "HTTPS" }}</span>
              </button>
              <div v-if="!filteredHttpsPorts.length" class="combobox-empty">
                {{ activeServer.httpsPorts.length ? "No matching HTTPS ports" : "No HTTPS listening ports on this server" }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { fetchSitePorts, updateSitePorts } from "@/api/sitePorts";
import { notifyError, notifySuccess } from "@/utils/notify";

const PORTS_TITLE = "Ports";

const props = defineProps({
  siteId: {
    type: [Number, String],
    default: null,
  },
});

const loading = ref(false);
const saving = ref(false);
const loadError = ref("");
const servers = ref([]);
const selectedServerId = ref(null);
const draftHttpIds = ref([]);
const draftHttpsIds = ref([]);
const httpSearch = ref("");
const httpsSearch = ref("");
const openDropdownKey = ref("");

const activeServer = computed(() =>
  servers.value.find((server) => server.serverId === selectedServerId.value) || null
);

const canSave = computed(
  () => Boolean(props.siteId && selectedServerId.value && !loading.value && !saving.value)
);

const selectedHttpPorts = computed(() => {
  if (!activeServer.value) return [];
  const selected = new Set(draftHttpIds.value);
  return activeServer.value.httpPorts.filter((port) => selected.has(port.id));
});

const selectedHttpsPorts = computed(() => {
  if (!activeServer.value) return [];
  const selected = new Set(draftHttpsIds.value);
  return activeServer.value.httpsPorts.filter((port) => selected.has(port.id));
});

const filteredHttpPorts = computed(() => filterPorts(activeServer.value?.httpPorts || [], httpSearch.value));
const filteredHttpsPorts = computed(() => filterPorts(activeServer.value?.httpsPorts || [], httpsSearch.value));

const filterPorts = (ports, search) => {
  const needle = String(search || "").trim().toLowerCase();
  if (!needle) return ports;
  return ports.filter((port) => {
    const haystack = `${port.port} ${port.description || ""} ${port.status || ""}`.toLowerCase();
    return haystack.includes(needle);
  });
};

const serverLabel = (server) => server?.name || server?.ip || `Edge #${server?.serverId}`;

const selectionSummary = (server) => {
  const httpCount = (server.selectedHttpPortIds || []).length;
  const httpsCount = (server.selectedHttpsPortIds || []).length;
  return `${httpCount} HTTP · ${httpsCount} HTTPS`;
};

const applyDraftFromServer = (server) => {
  draftHttpIds.value = [...(server?.selectedHttpPortIds || [])];
  draftHttpsIds.value = [...(server?.selectedHttpsPortIds || [])];
  httpSearch.value = "";
  httpsSearch.value = "";
  openDropdownKey.value = "";
};

const selectServer = (serverId) => {
  selectedServerId.value = serverId;
  const server = servers.value.find((entry) => entry.serverId === serverId);
  applyDraftFromServer(server);
};

const togglePort = (protocol, portId) => {
  const target = protocol === "https" ? draftHttpsIds : draftHttpIds;
  if (target.value.includes(portId)) {
    target.value = target.value.filter((id) => id !== portId);
  } else {
    target.value = [...target.value, portId];
  }
};

const openDropdown = (key) => {
  openDropdownKey.value = key;
};

const toggleDropdown = (key) => {
  openDropdownKey.value = openDropdownKey.value === key ? "" : key;
};

const onDocumentClick = () => {
  openDropdownKey.value = "";
};

const loadConfig = async () => {
  if (!props.siteId) {
    servers.value = [];
    selectedServerId.value = null;
    draftHttpIds.value = [];
    draftHttpsIds.value = [];
    loadError.value = "";
    return;
  }
  loading.value = true;
  loadError.value = "";
  try {
    const data = await fetchSitePorts(props.siteId);
    servers.value = Array.isArray(data?.servers) ? data.servers : [];
    const preferred =
      servers.value.find((server) => server.serverId === selectedServerId.value) ||
      servers.value[0] ||
      null;
    selectedServerId.value = preferred ? preferred.serverId : null;
    applyDraftFromServer(preferred);
  } catch (error) {
    servers.value = [];
    selectedServerId.value = null;
    draftHttpIds.value = [];
    draftHttpsIds.value = [];
    loadError.value = error?.message || "Could not load site ports.";
  } finally {
    loading.value = false;
  }
};

const saveSelections = async () => {
  if (!canSave.value) return;
  saving.value = true;
  try {
    const data = await updateSitePorts(props.siteId, {
      serverId: selectedServerId.value,
      httpPortIds: draftHttpIds.value,
      httpsPortIds: draftHttpsIds.value,
    });
    servers.value = Array.isArray(data?.servers) ? data.servers : [];
    const current = servers.value.find((server) => server.serverId === selectedServerId.value);
    applyDraftFromServer(current);
    notifySuccess(PORTS_TITLE, "Port selections saved.");
  } catch (error) {
    notifyError(PORTS_TITLE, error?.message || "Could not save port selections.");
  } finally {
    saving.value = false;
  }
};

watch(
  () => props.siteId,
  () => {
    void loadConfig();
  }
);

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
  void loadConfig();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});
</script>

<style scoped>
.ports-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.waf-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.waf-section-header h4 {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
}

.waf-section-desc,
.helper-text {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.92rem;
}

.error-text {
  color: #b91c1c;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.empty-card,
.section-card {
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border-strong);
  border-radius: 14px;
  padding: 18px;
}

.empty-card h5,
.server-summary h5 {
  margin: 0 0 6px;
  font-size: 0.98rem;
  color: var(--app-heading);
}

.server-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.server-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  min-width: 160px;
  text-align: left;
  transition: all 0.2s ease;
}

.server-tab:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
}

.server-tab.active {
  background: var(--app-accent-soft);
  border-color: var(--app-accent);
  color: var(--app-accent);
  box-shadow: 0 6px 14px rgba(124, 58, 237, 0.12);
}

.server-tab__name {
  font-size: 0.92rem;
  font-weight: 600;
}

.server-tab__meta {
  font-size: 0.78rem;
  opacity: 0.85;
}

.server-summary {
  margin-bottom: 16px;
}

.port-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.port-field:last-child {
  margin-bottom: 0;
}

.port-field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--app-text-muted);
}

.combobox {
  position: relative;
}

.combobox.disabled {
  opacity: 0.7;
  pointer-events: none;
}

.combobox-input-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 44px;
  border: 1px solid var(--app-input-border);
  border-radius: 12px;
  padding: 8px 12px;
  background: var(--app-input-bg);
}

.selected-tags-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.port-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  padding: 4px 8px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 0.82rem;
  font-weight: 600;
}

.port-tag-remove {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0 2px;
}

.combobox-inline-input {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--app-text);
  font-size: 0.92rem;
}

.combobox-arrow {
  width: 16px;
  height: 16px;
  color: var(--app-text-muted);
  display: inline-flex;
}

.combobox-arrow svg {
  width: 16px;
  height: 16px;
}

.combobox-menu {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--app-border-strong);
  border-radius: 12px;
  background: var(--app-surface-solid);
  box-shadow: 0 16px 32px var(--app-shadow);
  padding: 6px;
}

.combobox-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  color: var(--app-text);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
}

.combobox-option:hover,
.combobox-option.selected {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.combobox-check {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.combobox-check svg {
  width: 14px;
  height: 14px;
}

.option-main {
  font-weight: 600;
  min-width: 48px;
}

.option-meta {
  color: var(--app-text-muted);
  font-size: 0.82rem;
}

.combobox-empty {
  padding: 14px 12px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: 0.88rem;
}
</style>
