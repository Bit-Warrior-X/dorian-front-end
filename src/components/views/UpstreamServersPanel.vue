<template>
  <div class="upstream-panel">
    <div class="waf-section-header">
      <div>
        <h4>Upstream Servers</h4>
        <p class="waf-section-desc">Manage the origin servers serving traffic for this edge.</p>
      </div>
      <div class="header-actions">
        <button class="primary-btn" type="button" @click="openAddDialog">Add Server</button>
      </div>
    </div>

    <div class="content-card list-card">
      <div class="list-header">
        <h4>Upstream List</h4>
        <button class="ghost-btn" type="button" @click="refreshStatuses">Refresh</button>
      </div>
      <div class="table-wrap">
        <table class="upstream-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>IP:Port</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="server in formattedServers" :key="server.id">
              <td>
                <span
                  class="status-dot"
                  :class="server.statusClass"
                  :aria-label="server.statusLabel"
                  role="img"
                ></span>
              </td>
              <td>{{ server.address }}</td>
              <td class="description-cell">
                <span class="description-text">{{ server.description }}</span>
              </td>
              <td>
                <button
                  class="icon-danger-btn"
                  type="button"
                  aria-label="Remove"
                  title="Remove"
                  @click="removeServer(server.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6l-1 14H6L5 6"></path>
                    <path d="M10 11v6"></path>
                    <path d="M14 11v6"></path>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!upstreamServers.length" class="empty-state">
          No upstream servers configured yet.
        </div>
      </div>
    </div>

    <div v-if="isAddDialogOpen" class="dialog-backdrop" @click="closeAddDialog">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h4>Add Upstream Server</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeAddDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p class="helper-text">Enter the upstream address and weights, then add it to the list.</p>
        <div class="form-grid">
          <div class="form-field">
            <label for="upstream-address">Server Address</label>
            <input
              id="upstream-address"
              v-model="newServerAddress"
              type="text"
              placeholder="192.168.1.10:8080"
            />
          </div>
          <div class="form-field">
            <label for="upstream-weight">Weight</label>
            <input
              id="upstream-weight"
              v-model="newServerWeight"
              type="number"
              min="1"
              placeholder="4"
            />
          </div>
          <div class="form-field">
            <label for="upstream-max-fails">Max Fails</label>
            <input
              id="upstream-max-fails"
              v-model="newServerMaxFails"
              type="number"
              min="1"
              placeholder="3"
            />
          </div>
          <div class="form-field">
            <label for="upstream-timeout">Fail Timeout (s)</label>
            <input
              id="upstream-timeout"
              v-model="newServerTimeout"
              type="number"
              min="1"
              placeholder="30"
            />
          </div>
        </div>
        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeAddDialog">Cancel</button>
          <button class="primary-btn" type="button" @click="addServer">Add Server</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  fetchUpstreamServers,
  createUpstreamServer,
  deleteUpstreamServer as deleteUpstreamServerApi
} from "@/api/upstreamServers";
import { notifyError, notifySuccess } from "@/utils/notify";

const UPSTREAM_TITLE = "Upstream Servers";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const upstreamServers = ref([]);
const newServerAddress = ref("");
const newServerWeight = ref("4");
const newServerMaxFails = ref("3");
const newServerTimeout = ref("30");
const isAddDialogOpen = ref(false);

const formattedServers = computed(() =>
  upstreamServers.value.map((server) => ({
    ...server,
    statusLabel: server.status === "ENABLE" ? "Active" : "Inactive",
    statusClass: server.status === "ENABLE" ? "active" : "inactive"
  }))
);

const openAddDialog = () => {
  isAddDialogOpen.value = true;
};

const closeAddDialog = () => {
  isAddDialogOpen.value = false;
};

const addServer = async () => {
  if (!props.serverId) return;
  const address = newServerAddress.value.trim();
  if (!address) return;
  const weight = Number(newServerWeight.value) || 4;
  const maxFails = Number(newServerMaxFails.value) || 3;
  const timeout = Number(newServerTimeout.value) || 30;
  const description = `weight=${weight} max_fails=${maxFails} fail_timeout=${timeout}s`;
  try {
    await createUpstreamServer(props.serverId, {
      address,
      description,
      status: "ENABLE"
    });
    await loadServers();
    notifySuccess(UPSTREAM_TITLE, "The upstream server is successfully created.");
    newServerAddress.value = "";
    newServerWeight.value = "4";
    newServerMaxFails.value = "3";
    newServerTimeout.value = "30";
    closeAddDialog();
  } catch (error) {
    notifyError(UPSTREAM_TITLE, error?.message || "The upstream server could not be created.");
  }
};

const removeServer = async (upstreamId) => {
  if (!props.serverId) return;
  try {
    await deleteUpstreamServerApi(props.serverId, upstreamId);
    await loadServers();
    notifySuccess(UPSTREAM_TITLE, "The upstream server is successfully removed.");
  } catch (error) {
    notifyError(UPSTREAM_TITLE, error?.message || "The upstream server could not be removed.");
  }
};

const refreshStatuses = () => {
  void loadServers();
};

const loadServers = async () => {
  if (!props.serverId) {
    upstreamServers.value = [];
    return;
  }
  try {
    const data = await fetchUpstreamServers(props.serverId);
    upstreamServers.value = Array.isArray(data) ? data : [];
  } catch {
    upstreamServers.value = [];
  }
};

onMounted(() => {
  void loadServers();
});

watch(
  () => props.serverId,
  () => {
    void loadServers();
  }
);
</script>

<style scoped>
.upstream-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 0;
}

.content-card {
  background: var(--app-surface-muted);
  border-radius: 14px;
  padding: 18px;
  border: 1px solid var(--app-border-strong);
}

.content-card h4 {
  margin: 0 0 14px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-heading);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.list-header h4 {
  margin: 0;
}

.helper-text {
  margin: 0 0 14px 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}


.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  font-weight: 500;
}

.form-field input {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: var(--app-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: var(--app-input-bg);
}

.form-field input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: var(--app-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.dialog-card {
  width: 100%;
  max-width: 520px;
  background: var(--app-surface-solid);
  border-radius: 18px;
  box-shadow: 0 24px 48px var(--app-shadow);
  border: 1px solid var(--app-border-strong);
  padding: 24px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dialog-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--app-heading);
}

.dialog-close {
  border: none;
  background: var(--app-surface-hover);
  color: var(--app-text-muted);
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.dialog-close:hover {
  background: var(--app-surface-elevated);
  color: var(--app-text);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.ghost-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.waf-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.waf-section-header h4 {
  margin: 0 0 6px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
}

.waf-section-desc {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.92rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.primary-btn,
.primary-btn:hover:not(:disabled) {
  /* flat styles from theme.css */
}

.table-wrap {
  border-radius: 12px;
  border: 1px solid var(--app-border-strong);
  overflow: hidden;
}

.upstream-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
}

.upstream-table thead {
  background: var(--app-surface-muted);
}

.upstream-table th,
.upstream-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.92rem;
  color: var(--app-text);
  border-bottom: 1px solid var(--app-border-strong);
}

.upstream-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
  font-weight: 600;
}

.description-cell {
  color: var(--app-text-secondary);
  font-size: 0.9rem;
}

.description-text {
  display: inline;
  padding: 0;
  background: transparent;
  border-radius: 0;
}

.status-dot {
  display: inline-flex;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #94a3b8;
}

.status-dot.active {
  background: #22c55e;
}

.status-dot.inactive {
  background: #9ca3af;
}

.status-dot.maintenance {
  background: #f59e0b;
}

.icon-danger-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.6);
  background: rgba(254, 242, 242, 0.9);
  color: #b91c1c;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.icon-danger-btn svg {
  width: 18px;
  height: 18px;
}

.icon-danger-btn:hover {
  border-color: rgba(220, 38, 38, 0.8);
  color: #991b1b;
  background: rgba(239, 68, 68, 0.16);
}

.empty-state {
  padding: 18px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: 0.92rem;
}
</style>
