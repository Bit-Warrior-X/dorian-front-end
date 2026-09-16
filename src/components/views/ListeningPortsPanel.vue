<template>
  <div class="edge-subpanel">
    <header class="edge-subpanel__intro">
      <div>
        <p class="edge-subpanel__kicker">Traffic</p>
        <h4>Listening ports</h4>
        <p>Configure which ports accept client traffic on this edge.</p>
      </div>
      <div class="edge-subpanel__actions">
        <button class="primary-btn" type="button" @click="openAddDialog">Add Port</button>
      </div>
    </header>

    <div class="edge-subpanel__card">
      <div class="edge-subpanel__card-head">
        <h5>Port list</h5>
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
              <td class="num">{{ entry.port }}</td>
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
        <div v-if="portsLoading" class="empty-state">Loading listening ports...</div>
        <div v-else-if="portsError" class="empty-state bound-error">{{ portsError }}</div>
        <div v-else-if="!listeningPorts.length" class="empty-state">
          No listening ports configured yet.
        </div>
      </div>
    </div>

    <div class="edge-subpanel__card">
      <div class="edge-subpanel__card-head">
        <h5>System bound ports</h5>
        <button class="ghost-btn" type="button" @click="refreshPorts">Refresh</button>
      </div>
      <p class="helper-text system-bound-lead">
        TCP ports currently listening on this edge. These ports cannot be added again.
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
              <td class="num">{{ entry.port }}</td>
              <td class="num">{{ entry.address || "—" }}</td>
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
import { ref, computed, watch } from "vue";
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
const portsLoading = ref(false);
const portsError = ref("");
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

const resolvedServerId = computed(() => {
  const raw = props.serverId;
  if (raw == null || raw === "") return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
});

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
  if (!resolvedServerId.value) return;
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
    await createListeningPort(resolvedServerId.value, {
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
  if (!resolvedServerId.value) return;
  try {
    await deleteListeningPortApi(resolvedServerId.value, portId);
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
  if (!resolvedServerId.value) {
    systemBoundPorts.value = [];
    boundPortsError.value = "";
    return;
  }
  boundPortsLoading.value = true;
  boundPortsError.value = "";
  try {
    const data = await fetchBoundListeningPorts(resolvedServerId.value);
    systemBoundPorts.value = Array.isArray(data) ? data : [];
  } catch (error) {
    systemBoundPorts.value = [];
    boundPortsError.value = error?.message || "Could not load system bound ports.";
  } finally {
    boundPortsLoading.value = false;
  }
};

const loadPorts = async () => {
  if (!resolvedServerId.value) {
    listeningPorts.value = [];
    portsError.value = "";
    return;
  }
  portsLoading.value = true;
  portsError.value = "";
  try {
    const data = await fetchListeningPorts(resolvedServerId.value);
    listeningPorts.value = Array.isArray(data) ? data : [];
  } catch (error) {
    listeningPorts.value = [];
    portsError.value = error?.message || "Could not load listening ports.";
  } finally {
    portsLoading.value = false;
  }
};

watch(
  resolvedServerId,
  () => {
    void loadPorts();
    void loadBoundPorts();
  },
  { immediate: true }
);
</script>

<style scoped>

.edge-subpanel {
  --cfg-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.edge-subpanel__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding-bottom: 2px;
}

.edge-subpanel__kicker {
  margin: 0 0 3px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.edge-subpanel__intro h4 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
}

.edge-subpanel__intro p:not(.edge-subpanel__kicker) {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-muted);
  line-height: 1.45;
  max-width: 44rem;
}

.edge-subpanel__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}


.edge-subpanel__card {
  border: 1px solid var(--app-border);
  border-radius: var(--cfg-radius);
  background: var(--app-surface-elevated, var(--app-surface));
  padding: 12px;
}

.edge-subpanel__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.edge-subpanel__card-head h5 {
  margin: 0;
  font-size: 13px;
  font-weight: 650;
  color: var(--app-heading);
}

.helper-text {
  margin: 0 0 12px;
  color: var(--app-text-muted);
  font-size: 12.5px;
  line-height: 1.45;
}

.system-bound-lead {
  margin: 0 0 10px;
}

.bound-error {
  color: #e15241;
}

.field-error {
  margin: 6px 0 0;
  color: #e15241;
  font-size: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-field--wide {
  grid-column: 1 / -1;
}

.form-field label {
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.form-field input,
.form-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 6px;
  padding: 9px 11px;
  font-size: 13px;
  color: var(--app-text);
  outline: none;
  background: var(--app-input-bg);
}

.form-field input:focus,
.form-field select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
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
  border-radius: 8px;
  box-shadow: 0 18px 40px var(--app-shadow);
  border: 1px solid var(--app-border);
  padding: 18px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.dialog-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  color: var(--app-heading);
}

.dialog-close {
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-muted);
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dialog-close:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.table-wrap {
  border-radius: 6px;
  border: 1px solid var(--app-border);
  overflow-x: auto;
  background: var(--app-surface);
}

.ports-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
}

.ports-table th,
.ports-table td {
  text-align: left;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--app-text);
  border-bottom: 1px solid var(--app-border);
}

.ports-table th {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--app-text-muted);
  font-weight: 650;
  background: color-mix(in srgb, var(--app-surface-elevated) 80%, transparent);
}

.description-cell {
  color: var(--app-text-muted);
  font-size: 12.5px;
}

.status-dot {
  display: inline-flex;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-dot.active {
  background: var(--dorian-viper-400, #3fbd85);
  box-shadow: 0 0 0 3px rgba(63, 189, 133, 0.18);
}

.status-dot.inactive {
  background: #9ca3af;
}

.icon-danger-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid rgba(225, 82, 65, 0.45);
  background: rgba(225, 82, 65, 0.08);
  color: #e15241;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.icon-danger-btn svg {
  width: 15px;
  height: 15px;
}

.icon-danger-btn:hover {
  background: rgba(225, 82, 65, 0.14);
}

.empty-state {
  padding: 20px 12px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: 13px;
}
</style>
