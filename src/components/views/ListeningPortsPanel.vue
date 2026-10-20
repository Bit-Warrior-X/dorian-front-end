<template>
  <div class="lpp">
    <header class="cfg-head">
      <div class="cfg-head__copy">
        <span class="cfg-head__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h4l2-5 4 10 2-5h4" /></svg>
        </span>
        <div>
          <p class="cfg-head__kicker">Traffic</p>
          <h4>Listening ports</h4>
          <p class="cfg-head__desc">Ports this edge accepts client traffic on. Ports already used by the host are listed below and can't be reused.</p>
        </div>
      </div>
      <div class="cfg-head__actions">
        <button class="lpp__icon-btn" :class="{ spinning: isRefreshing }" type="button" aria-label="Refresh ports" title="Refresh" @click="refreshPorts">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" /></svg>
        </button>
        <button class="primary-btn lpp__primary" type="button" @click="openAddDialog">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
          Add port
        </button>
      </div>
    </header>

    <section class="lpp__stats" aria-label="Summary">
      <div class="lpp__stat"><span>Configured</span><strong class="num">{{ listeningPorts.length }}</strong></div>
      <div class="lpp__stat"><span>Active</span><strong class="num ok">{{ activeCount }}</strong></div>
      <div class="lpp__stat"><span>Host bound</span><strong class="num">{{ systemBoundPorts.length }}</strong></div>
    </section>

    <section class="lpp__card">
      <header class="lpp__card-head">
        <h5>Client ports <span class="lpp__badge num">{{ listeningPorts.length }}</span></h5>
      </header>
      <div v-if="formattedPorts.length" class="lpp__table-wrap">
        <table class="lpp__table">
          <thead>
            <tr>
              <th>Port</th>
              <th>Protocol</th>
              <th>Status</th>
              <th>Description</th>
              <th class="lpp__th-action"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in formattedPorts" :key="entry.id">
              <td><span class="lpp__port num">{{ entry.port }}</span></td>
              <td><span class="lpp__proto" :class="`lpp__proto--${String(entry.protocol || 'http').toLowerCase()}`">{{ entry.protocol }}</span></td>
              <td>
                <span class="lpp__status" :class="entry.statusClass"><i aria-hidden="true" />{{ entry.statusLabel }}</span>
              </td>
              <td class="lpp__desc">{{ entry.description || "—" }}</td>
              <td class="lpp__td-action">
                <button class="lpp__remove" type="button" :aria-label="`Remove port ${entry.port}`" title="Remove" @click="openRemoveConfirm(entry)">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" /></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="lpp__empty" :class="{ error: portsError }">
        <strong>{{ portsLoading ? "Loading listening ports…" : portsError ? "Couldn't load ports" : "No client ports yet" }}</strong>
        <p v-if="!portsLoading">{{ portsError || "Add 443 or 80 so this edge can serve traffic." }}</p>
        <button v-if="!portsLoading && !portsError" class="primary-btn lpp__primary" type="button" @click="openAddDialog">Add port</button>
      </div>
    </section>

    <section class="lpp__card">
      <header class="lpp__card-head">
        <h5>Host bound ports <span class="lpp__badge num">{{ systemBoundPorts.length }}</span></h5>
        <p>TCP ports already listening on the host.</p>
      </header>
      <div v-if="systemBoundPorts.length" class="lpp__chips">
        <div v-for="entry in systemBoundPorts" :key="`${entry.port}-${entry.address}`" class="lpp__chip">
          <strong class="num">{{ entry.port }}</strong>
          <span class="lpp__chip-copy">
            <span>{{ entry.process || "unknown" }}</span>
            <small class="num">{{ entry.address || "—" }}</small>
          </span>
        </div>
      </div>
      <div v-else class="lpp__empty lpp__empty--compact" :class="{ error: boundPortsError }">
        <strong>{{ boundPortsLoading ? "Scanning host ports…" : boundPortsError ? "Couldn't scan the host" : "No bound ports detected" }}</strong>
        <p v-if="boundPortsError">{{ boundPortsError }}</p>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="isAddDialogOpen" class="lpp-dialog" @click.self="closeAddDialog">
        <form class="lpp-dialog__card" role="dialog" aria-modal="true" aria-label="Add listening port" @submit.prevent="addPort">
          <header class="lpp-dialog__head">
            <div>
              <h4>Add listening port</h4>
              <p>Clients connect to this port on the edge.</p>
            </div>
            <button class="lpp__icon-btn" type="button" aria-label="Close dialog" @click="closeAddDialog">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </header>
          <div class="lpp-dialog__quick" role="group" aria-label="Common ports">
            <button
              v-for="option in quickPorts"
              :key="option.port"
              type="button"
              :class="{ active: String(newPort) === option.port && newProtocol === option.protocol }"
              @click="pickQuickPort(option)"
            >
              <strong class="num">{{ option.port }}</strong>{{ option.protocol }}
            </button>
          </div>
          <div class="lpp-dialog__grid">
            <label class="lpp-dialog__field">
              <span>Port</span>
              <input v-model="newPort" class="num" type="number" min="1" max="65535" placeholder="443" :class="{ invalid: portConflictMessage }" />
            </label>
            <div class="lpp-dialog__field">
              <span id="lpp-proto-label">Protocol</span>
              <div class="lpp-dialog__segment" role="radiogroup" aria-labelledby="lpp-proto-label">
                <button v-for="proto in ['HTTPS', 'HTTP']" :key="proto" type="button" role="radio" :aria-checked="newProtocol === proto" :class="{ active: newProtocol === proto }" @click="newProtocol = proto">{{ proto }}</button>
              </div>
            </div>
            <label class="lpp-dialog__field lpp-dialog__field--wide">
              <span>Description <small>optional</small></span>
              <input v-model="newDescription" type="text" placeholder="Public HTTPS entry" />
            </label>
          </div>
          <p v-if="portConflictMessage" class="lpp-dialog__error">{{ portConflictMessage }}</p>
          <footer class="lpp-dialog__foot">
            <button class="secondary-btn" type="button" @click="closeAddDialog">Cancel</button>
            <button class="primary-btn" type="submit" :disabled="Boolean(portConflictMessage)">Add port</button>
          </footer>
        </form>
      </div>
    </Teleport>

    <ConfirmDialog
      v-model="isConfirmDialogOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      confirm-text="Remove"
      cancel-text="Cancel"
      danger
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

const activeCount = computed(() => listeningPorts.value.filter((entry) => entry.status === "ENABLE").length);

const quickPorts = [
  { port: "443", protocol: "HTTPS" },
  { port: "80", protocol: "HTTP" },
  { port: "8443", protocol: "HTTPS" },
  { port: "8080", protocol: "HTTP" }
];

const pickQuickPort = (option) => {
  newPort.value = option.port;
  newProtocol.value = option.protocol;
};

const isRefreshing = computed(() => portsLoading.value || boundPortsLoading.value);

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
.lpp {
  --lpp-tone: var(--dorian-l4, #6b9fd4);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

.cfg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.cfg-head__copy { display: flex; gap: 12px; min-width: 0; }

.cfg-head__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--lpp-tone);
  background: color-mix(in srgb, var(--lpp-tone) 13%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--lpp-tone) 30%, transparent);
}

.cfg-head__icon svg { width: 18px; height: 18px; }

.cfg-head__kicker {
  margin: 0 0 2px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.cfg-head h4 { margin: 0; font-size: 1.1rem; font-weight: 650; letter-spacing: -0.02em; color: var(--app-heading); }
.cfg-head__desc { margin: 3px 0 0; max-width: 44rem; font-size: 12.5px; line-height: 1.45; color: var(--app-text-muted); }
.cfg-head__actions { display: flex; align-items: center; gap: 8px; }

.lpp__primary { display: inline-flex; align-items: center; gap: 6px; }
.lpp__primary svg { width: 12px; height: 12px; }

.lpp__icon-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 0.5px solid var(--app-border-strong);
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
}

.lpp__icon-btn:hover { color: var(--app-heading); background: var(--app-surface-muted); }
.lpp__icon-btn svg { width: 14px; height: 14px; }
.lpp__icon-btn.spinning svg { animation: lpp-spin 0.9s linear infinite; }

.lpp__stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }

.lpp__stat {
  padding: 11px 14px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.lpp__stat span {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.lpp__stat strong { display: block; margin-top: 4px; font-size: 18px; font-weight: 650; color: var(--app-heading); }
.lpp__stat strong.ok { color: var(--dorian-viper-400, #3fbd85); }

.lpp__card {
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
  overflow: hidden;
}

.lpp__card-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-bottom: 0.5px solid var(--app-border);
}

.lpp__card-head h5 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
}

.lpp__card-head p { margin: 0; font-size: 12px; color: var(--app-text-muted); }

.lpp__badge {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--app-text-muted);
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
}

.lpp__table-wrap { overflow-x: auto; }
.lpp__table { width: 100%; min-width: 560px; border-collapse: collapse; font-size: 13px; }

.lpp__table th {
  padding: 9px 14px;
  text-align: left;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  background: var(--app-surface);
  border-bottom: 0.5px solid var(--app-border);
}

.lpp__table td { padding: 10px 14px; color: var(--app-text); border-bottom: 0.5px solid var(--app-border); }
.lpp__table tbody tr { transition: background 0.12s ease; }
.lpp__table tbody tr:hover { background: color-mix(in srgb, var(--app-surface) 70%, transparent); }
.lpp__table tbody tr:last-child td { border-bottom: 0; }
.lpp__th-action, .lpp__td-action { width: 48px; text-align: right !important; }

.lpp__port {
  display: inline-block;
  min-width: 52px;
  padding: 3px 8px;
  border-radius: 6px;
  text-align: center;
  font-size: 13px;
  font-weight: 650;
  color: var(--app-heading);
  background: var(--app-surface);
  border: 0.5px solid var(--app-border-strong);
}

.lpp__proto {
  padding: 2px 8px;
  border-radius: 5px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.04em;
  color: var(--dorian-l4, #6b9fd4);
  background: color-mix(in srgb, var(--dorian-l4, #6b9fd4) 13%, transparent);
}

.lpp__proto--https {
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 13%, transparent);
}

.lpp__status { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--app-text-muted); }
.lpp__status i { width: 7px; height: 7px; border-radius: 50%; background: var(--app-border-strong); }
.lpp__status.active { color: var(--app-text); }
.lpp__status.active i { background: var(--dorian-viper-400, #3fbd85); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 20%, transparent); }

.lpp__desc { color: var(--app-text-muted) !important; font-size: 12.5px; }

.lpp__remove {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  opacity: 0.7;
}

.lpp__table tbody tr:hover .lpp__remove { opacity: 1; }
.lpp__remove:hover { color: var(--dorian-danger, #e15241); background: color-mix(in srgb, var(--dorian-danger, #e15241) 12%, transparent); }
.lpp__remove svg { width: 14px; height: 14px; }

.lpp__chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  padding: 12px 14px 14px;
}

.lpp__chip {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
}

.lpp__chip strong {
  min-width: 44px;
  padding: 2px 6px;
  border-radius: 5px;
  text-align: center;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--app-heading);
  background: var(--app-surface-muted);
}

.lpp__chip-copy { display: flex; flex-direction: column; min-width: 0; }
.lpp__chip-copy span,
.lpp__chip-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lpp__chip-copy span { font-size: 12.5px; font-weight: 600; color: var(--app-text); }
.lpp__chip-copy small { font-size: 10.5px; color: var(--app-text-muted); }

.lpp__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 34px 20px;
  text-align: center;
}

.lpp__empty--compact { padding: 22px 20px; }
.lpp__empty strong { font-size: 13.5px; color: var(--app-heading); }
.lpp__empty p { margin: 0 0 6px; font-size: 12.5px; color: var(--app-text-muted); }
.lpp__empty.error strong { color: var(--dorian-danger, #e15241); }

.lpp-dialog {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--app-overlay, rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(3px);
}

.lpp-dialog__card {
  width: min(480px, 100%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface-solid, var(--app-surface));
  box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.7);
}

.lpp-dialog__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.lpp-dialog__head h4 { margin: 0; font-size: 15px; font-weight: 650; color: var(--app-heading); }
.lpp-dialog__head p { margin: 2px 0 0; font-size: 12px; color: var(--app-text-muted); }

.lpp-dialog__quick { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }

.lpp-dialog__quick button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 8px 6px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  font: inherit;
  font-size: 10.5px;
  cursor: pointer;
}

.lpp-dialog__quick button strong { font-size: 14px; color: var(--app-heading); }

.lpp-dialog__quick button.active {
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 50%, transparent);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 10%, transparent);
  color: var(--dorian-viper-400, #3fbd85);
}

.lpp-dialog__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.lpp-dialog__field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.lpp-dialog__field--wide { grid-column: 1 / -1; }

.lpp-dialog__field > span {
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.lpp-dialog__field small { text-transform: none; letter-spacing: 0; font-weight: 500; opacity: 0.8; }

.lpp-dialog__field input {
  padding: 9px 11px;
  border-radius: 7px;
  border: 1px solid var(--app-input-border);
  background: var(--app-input-bg);
  color: var(--app-text);
  font: inherit;
  font-size: 13px;
  outline: none;
}

.lpp-dialog__field input:focus { border-color: var(--app-accent); box-shadow: 0 0 0 2px var(--app-accent-soft); }
.lpp-dialog__field input.invalid { border-color: var(--dorian-danger, #e15241); }

.lpp-dialog__segment {
  display: flex;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--app-input-border);
  background: var(--app-input-bg);
}

.lpp-dialog__segment button {
  flex: 1;
  padding: 6px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-muted);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.lpp-dialog__segment button.active {
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 14%, transparent);
}

.lpp-dialog__error { margin: -4px 0 0; font-size: 12px; color: var(--dorian-danger, #e15241); }
.lpp-dialog__foot { display: flex; justify-content: flex-end; gap: 8px; }

@keyframes lpp-spin { to { transform: rotate(360deg); } }

@media (max-width: 720px) {
  .lpp__stats { grid-template-columns: 1fr; }
  .lpp-dialog__quick { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
