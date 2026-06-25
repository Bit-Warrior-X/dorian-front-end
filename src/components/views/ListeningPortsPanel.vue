<template>
  <div class="listening-ports-panel">
    <div class="waf-section-header">
      <div>
        <h4>Listening Ports</h4>
        <p class="waf-section-desc">Configure which ports accept client traffic on this edge.</p>
      </div>
      <div class="header-actions">
        <button class="primary-btn" type="button" @click="openAddDialog">Add Port</button>
      </div>
    </div>

    <div class="content-card list-card">
      <div class="list-header">
        <h4>Port List</h4>
        <button class="ghost-btn" type="button" @click="refreshPorts">Refresh</button>
      </div>
      <div class="table-wrap">
        <table class="ports-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Port</th>
              <th>Protocol</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in formattedPorts" :key="entry.id">
              <td>
                <span
                  class="status-dot"
                  :class="entry.statusClass"
                  :aria-label="entry.statusLabel"
                  role="img"
                ></span>
              </td>
              <td>{{ entry.port }}</td>
              <td>{{ entry.protocol }}</td>
              <td class="description-cell">
                <span class="description-text">{{ entry.description || "—" }}</span>
              </td>
              <td>
                <button
                  class="icon-danger-btn"
                  type="button"
                  aria-label="Remove"
                  title="Remove"
                  @click="openRemoveConfirm(entry)"
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
        <div v-if="!listeningPorts.length" class="empty-state">
          No listening ports configured yet.
        </div>
      </div>
    </div>

    <div class="content-card list-card system-bound-card">
      <div class="list-header">
        <h4>System Bound Ports</h4>
        <button class="ghost-btn" type="button" @click="refreshPorts">Refresh</button>
      </div>
      <p class="helper-text system-bound-lead">
        TCP ports currently listening on this server. These ports cannot be added again.
      </p>
      <div class="table-wrap">
        <table class="ports-table">
          <thead>
            <tr>
              <th>Port</th>
              <th>Bind Address</th>
              <th>Process</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in systemBoundPorts" :key="`${entry.port}-${entry.address}`">
              <td>{{ entry.port }}</td>
              <td>{{ entry.address || "—" }}</td>
              <td class="description-cell">{{ entry.process || "—" }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="boundPortsLoading" class="empty-state">Loading system ports...</div>
        <div v-else-if="boundPortsError" class="empty-state bound-error">{{ boundPortsError }}</div>
        <div v-else-if="!systemBoundPorts.length" class="empty-state">
          No bound ports detected on the system.
        </div>
      </div>
    </div>

    <div v-if="isAddDialogOpen" class="dialog-backdrop" @click="closeAddDialog">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h4>Add Listening Port</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeAddDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p class="helper-text">Enter the port and protocol clients will connect to on this edge.</p>
        <div class="form-grid">
          <div class="form-field">
            <label for="listening-port">Port</label>
            <input
              id="listening-port"
              v-model="newPort"
              type="number"
              min="1"
              max="65535"
              placeholder="443"
            />
            <p v-if="portConflictMessage" class="field-error">{{ portConflictMessage }}</p>
          </div>
          <div class="form-field">
            <label for="listening-protocol">Protocol</label>
            <select id="listening-protocol" v-model="newProtocol">
              <option value="HTTP">HTTP</option>
              <option value="HTTPS">HTTPS</option>
            </select>
          </div>
          <div class="form-field form-field--wide">
            <label for="listening-description">Description</label>
            <input
              id="listening-description"
              v-model="newDescription"
              type="text"
              placeholder="Public HTTPS entry"
            />
          </div>
        </div>
        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeAddDialog">Cancel</button>
          <button class="primary-btn" type="button" :disabled="Boolean(portConflictMessage)" @click="addPort">Add Port</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model="isConfirmDialogOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      confirm-text="Remove"
      cancel-text="Cancel"
      @confirm="handleConfirmRemove"
      @cancel="clearConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import ConfirmDialog from "../ConfirmDialog.vue";
import {
  fetchListeningPorts,
  fetchBoundListeningPorts,
  createListeningPort,
  deleteListeningPort as deleteListeningPortApi
} from "@/api/listeningPorts";
import { notifyError, notifySuccess } from "@/utils/notify";

const LISTENING_PORTS_TITLE = "Listening Ports";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const listeningPorts = ref([]);
const systemBoundPorts = ref([]);
const boundPortsLoading = ref(false);
const boundPortsError = ref("");
const newPort = ref("443");
const newProtocol = ref("HTTPS");
const newDescription = ref("");
const isAddDialogOpen = ref(false);
const isConfirmDialogOpen = ref(false);
const confirmTargetId = ref(null);
const confirmTargetLabel = ref("");

const formattedPorts = computed(() =>
  listeningPorts.value.map((entry) => ({
    ...entry,
    statusLabel: entry.status === "ENABLE" ? "Active" : "Inactive",
    statusClass: entry.status === "ENABLE" ? "active" : "inactive"
  }))
);

const configuredPortNumbers = computed(
  () => new Set(listeningPorts.value.map((entry) => Number(entry.port)))
);

const unavailablePortsForAdd = computed(() => {
  const blocked = new Set(configuredPortNumbers.value);
  for (const entry of systemBoundPorts.value) {
    const port = Number(entry.port);
    if (!configuredPortNumbers.value.has(port)) {
      blocked.add(port);
    }
  }
  return blocked;
});

const portConflictMessage = computed(() => {
  const port = Number(newPort.value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return "";
  }
  if (configuredPortNumbers.value.has(port)) {
    return `Port ${port} is already configured.`;
  }
  if (unavailablePortsForAdd.value.has(port)) {
    return `Port ${port} is already in use on the system.`;
  }
  return "";
});

const openAddDialog = () => {
  isAddDialogOpen.value = true;
};

const closeAddDialog = () => {
  isAddDialogOpen.value = false;
};

const addPort = async () => {
  if (!props.serverId) return;
  const port = Number(newPort.value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    notifyError(LISTENING_PORTS_TITLE, "Enter a valid port between 1 and 65535.");
    return;
  }
  if (portConflictMessage.value) {
    notifyError(LISTENING_PORTS_TITLE, portConflictMessage.value);
    return;
  }
  try {
    await createListeningPort(props.serverId, {
      port,
      protocol: newProtocol.value,
      description: newDescription.value.trim(),
      status: "ENABLE"
    });
    await loadPorts();
    await loadBoundPorts();
    notifySuccess(LISTENING_PORTS_TITLE, "The listening port is successfully created.");
    newPort.value = "443";
    newProtocol.value = "HTTPS";
    newDescription.value = "";
    closeAddDialog();
  } catch (error) {
    notifyError(LISTENING_PORTS_TITLE, error?.message || "The listening port could not be created.");
  }
};

const removePort = async (portId) => {
  if (!props.serverId) return;
  try {
    await deleteListeningPortApi(props.serverId, portId);
    await loadPorts();
    await loadBoundPorts();
    notifySuccess(LISTENING_PORTS_TITLE, "The listening port is successfully removed.");
  } catch (error) {
    await loadPorts();
    await loadBoundPorts();
    notifyError(LISTENING_PORTS_TITLE, error?.message || "The listening port could not be removed.");
  }
};

const openRemoveConfirm = (entry) => {
  confirmTargetId.value = entry.id;
  confirmTargetLabel.value = `${entry.protocol || "HTTP"} port ${entry.port}`;
  isConfirmDialogOpen.value = true;
};

const confirmTitle = computed(() => "Remove listening port");

const confirmMessage = computed(() =>
  confirmTargetLabel.value
    ? `Are you sure you want to remove ${confirmTargetLabel.value}?`
    : "Are you sure you want to remove this listening port?"
);

const handleConfirmRemove = async () => {
  if (confirmTargetId.value) {
    await removePort(confirmTargetId.value);
  }
  clearConfirm();
};

const clearConfirm = () => {
  isConfirmDialogOpen.value = false;
  confirmTargetId.value = null;
  confirmTargetLabel.value = "";
};

const refreshPorts = () => {
  void loadPorts();
  void loadBoundPorts();
};

const loadBoundPorts = async () => {
  if (!props.serverId) {
    systemBoundPorts.value = [];
    boundPortsError.value = "";
    return;
  }
  boundPortsLoading.value = true;
  boundPortsError.value = "";
  try {
    const data = await fetchBoundListeningPorts(props.serverId);
    systemBoundPorts.value = Array.isArray(data) ? data : [];
  } catch (error) {
    systemBoundPorts.value = [];
    boundPortsError.value = error?.message || "Could not load system bound ports.";
  } finally {
    boundPortsLoading.value = false;
  }
};

const loadPorts = async () => {
  if (!props.serverId) {
    listeningPorts.value = [];
    return;
  }
  try {
    const data = await fetchListeningPorts(props.serverId);
    listeningPorts.value = Array.isArray(data) ? data : [];
  } catch {
    listeningPorts.value = [];
  }
};

onMounted(() => {
  void loadPorts();
  void loadBoundPorts();
});

watch(
  () => props.serverId,
  () => {
    void loadPorts();
    void loadBoundPorts();
  }
);
</script>

<style scoped>
.listening-ports-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-card {
  background: var(--app-surface-muted);
  border-radius: 14px;
  padding: 18px;
  border: 1px solid var(--app-border-strong);
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
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-heading);
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

.helper-text {
  margin: 0 0 14px 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.system-bound-card {
  margin-top: 0;
}

.system-bound-lead {
  margin: 0 0 12px;
}

.bound-error {
  color: #b91c1c;
}

.field-error {
  margin: 6px 0 0;
  color: #b91c1c;
  font-size: 0.85rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field--wide {
  grid-column: 1 / -1;
}

.form-field label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  font-weight: 500;
}

.form-field input,
.form-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: var(--app-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: var(--app-input-bg);
}

.form-field input:focus,
.form-field select:focus {
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

.table-wrap {
  border-radius: 12px;
  border: 1px solid var(--app-border-strong);
  overflow: hidden;
}

.ports-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
}

.ports-table thead {
  background: var(--app-surface-muted);
}

.ports-table th,
.ports-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.92rem;
  color: var(--app-text);
  border-bottom: 1px solid var(--app-border-strong);
}

.ports-table th {
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
