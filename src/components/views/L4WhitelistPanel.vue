<template>
  <div class="edge-subpanel">
    <header class="edge-subpanel__intro">
      <div>
        <p class="edge-subpanel__kicker">L4 defense</p>
        <h4>Allow IP</h4>
        <p>Trusted source IPs that bypass L4 blocking on this edge.</p>
      </div>
      <div class="edge-subpanel__actions">
        <button
          type="button"
          class="secondary-btn"
          :disabled="entries.length === 0"
          @click="openConfirm('clear')"
        >
          Clear All
        </button>
        <button type="button" class="primary-btn" @click="openDialog">
          Add IP
        </button>
      </div>
    </header>

    <div class="table-wrap">
      <table class="list-table">
        <thead>
          <tr>
            <th>IP address</th>
            <th>Reason</th>
            <th>Added</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.id">
            <td>{{ entry.ipAddress }}</td>
            <td>{{ entry.reason || "-" }}</td>
            <td>{{ formatTimestamp(entry.createdAt) }}</td>
            <td>
              <button
                type="button"
                class="icon-action-btn danger"
                aria-label="Remove"
                @click="openConfirm('remove', entry.id)"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M6.5 3.5h7l.5 1H18v1.5H2V4.5h4l.5-1Zm1 4h1.5v7H7.5v-7Zm3 0H12v7h-1.5v-7Zm-6 0H6v7H4.5v-7Zm11.5 0H15v7h1.5v-7ZM5 17h10a1 1 0 0 0 1-1V7H4v9a1 1 0 0 0 1 1Z"
                  />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!entries.length">
            <td colspan="5" class="empty-cell">No whitelist entries yet.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isDialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-label="Add whitelist IP">
        <div class="dialog-header">
          <h4>Add Whitelist IP</h4>
          <button type="button" class="icon-btn" @click="closeDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label for="l4-whitelist-ip">
              IP address <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="l4-whitelist-ip"
                v-model="formState.ipAddress"
                type="text"
                class="form-input"
                placeholder="203.0.113.10"
              />
            </div>
          </div>
          <div class="form-field">
            <label for="l4-whitelist-desc">Reason</label>
            <div class="field-control">
              <input
                id="l4-whitelist-desc"
                v-model="formState.reason"
                type="text"
                class="form-input"
                placeholder="Trusted partner"
              />
            </div>
          </div>
          <p v-if="validationError" class="field-error">{{ validationError }}</p>
        </div>
        <div class="dialog-footer">
          <button type="button" class="secondary-btn" @click="closeDialog">Cancel</button>
          <button type="button" class="primary-btn" @click="addEntry">Add</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model="isConfirmDialogOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmConfirmText"
      cancel-text="Cancel"
      @confirm="handleConfirm"
      @cancel="clearConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import ConfirmDialog from "../ConfirmDialog.vue";
import {
  fetchL4WhitelistEntries,
  createL4WhitelistEntry,
  deleteL4WhitelistEntry,
  clearL4WhitelistEntries
} from "@/api/l4";
import { notifyError, notifySuccess } from "@/utils/notify";

const WHITELIST_TITLE = "Allow IP";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const entries = ref([]);
const isDialogOpen = ref(false);
const validationError = ref("");
const isConfirmDialogOpen = ref(false);
const confirmAction = ref(null);
const confirmTargetId = ref(null);
const formState = ref({
  ipAddress: "",
  reason: ""
});

const formatTimestamp = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const resetForm = () => {
  formState.value = {
    ipAddress: "",
    reason: ""
  };
  validationError.value = "";
};

const openDialog = () => {
  resetForm();
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
  validationError.value = "";
};

const loadEntries = async () => {
  if (!props.serverId) {
    entries.value = [];
    return;
  }
  try {
    const list = await fetchL4WhitelistEntries(props.serverId);
    entries.value = Array.isArray(list) ? list : [];
  } catch (error) {
    notifyError(WHITELIST_TITLE, error?.message || "The whitelist entries could not be loaded.");
  }
};

const addEntry = async () => {
  if (!props.serverId) return;
  const ipAddress = formState.value.ipAddress.trim();
  if (!ipAddress) {
    validationError.value = "IP address is required.";
    return;
  }
  try {
    await createL4WhitelistEntry(Number(props.serverId), {
      ipAddress,
      reason: formState.value.reason.trim()
    });
    await loadEntries();
    notifySuccess(WHITELIST_TITLE, "The whitelist entry is successfully created.");
    closeDialog();
  } catch (error) {
    notifyError(WHITELIST_TITLE, error?.message || "The whitelist entry could not be created.");
  }
};

const openConfirm = (action, targetId = null) => {
  confirmAction.value = action;
  confirmTargetId.value = targetId;
  isConfirmDialogOpen.value = true;
};

const confirmTitle = computed(() => {
  if (confirmAction.value === "clear") return "Clear whitelist entries";
  if (confirmAction.value === "remove") return "Remove whitelist entry";
  return "Confirm action";
});

const confirmMessage = computed(() => {
  if (confirmAction.value === "clear") {
    return "Are you sure you want to clear all L4 whitelist entries?";
  }
  if (confirmAction.value === "remove") {
    return "Are you sure you want to remove this whitelist entry?";
  }
  return "Are you sure you want to continue?";
});

const confirmConfirmText = computed(() => {
  if (confirmAction.value === "clear") return "Clear";
  if (confirmAction.value === "remove") return "Remove";
  return "Confirm";
});

const handleConfirm = async () => {
  try {
    if (confirmAction.value === "clear") {
      await clearL4WhitelistEntries(props.serverId);
      notifySuccess(WHITELIST_TITLE, "All whitelist entries are successfully cleared.");
    } else if (confirmAction.value === "remove" && confirmTargetId.value) {
      await deleteL4WhitelistEntry(props.serverId, confirmTargetId.value);
      notifySuccess(WHITELIST_TITLE, "The whitelist entry is successfully removed.");
    }
    await loadEntries();
  } catch (error) {
    notifyError(WHITELIST_TITLE, error?.message || "The whitelist could not be updated.");
  }
  clearConfirm();
};

const clearConfirm = () => {
  isConfirmDialogOpen.value = false;
  confirmAction.value = null;
  confirmTargetId.value = null;
};

onMounted(async () => {
  await loadEntries();
});

watch(
  () => props.serverId,
  async () => {
    await loadEntries();
  }
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


.table-wrap {
  overflow: auto;
  border-radius: var(--cfg-radius);
  border: 1px solid var(--app-border);
  width: 100%;
  max-height: 520px;
  background: var(--app-surface);
}

.list-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 640px;
}

.list-table th,
.list-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--app-border);
  color: var(--app-text);
  word-break: break-word;
}

.list-table th {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--app-text-muted);
  font-weight: 650;
  background: color-mix(in srgb, var(--app-surface-elevated) 80%, transparent);
}

.list-table tr:last-child td {
  border-bottom: none;
}

.empty-cell {
  text-align: center;
  color: var(--app-text-muted);
  padding: 28px 12px !important;
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-action-btn {
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  color: var(--app-text-muted);
}

.icon-action-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.icon-action-btn svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.icon-action-btn.danger {
  color: #e15241;
}

.icon-action-btn.danger:hover {
  background: rgba(225, 82, 65, 0.1);
  border-color: rgba(225, 82, 65, 0.4);
  color: #e15241;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--app-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
}

.dialog-card {
  width: min(520px, 100%);
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: 0 18px 40px var(--app-shadow);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dialog-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  color: var(--app-heading);
}

.icon-btn {
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-muted);
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.icon-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-field label {
  font-size: 10.5px;
  font-weight: 650;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.required {
  color: #e15241;
}

.form-input {
  border: 1px solid var(--app-input-border);
  border-radius: 6px;
  padding: 9px 11px;
  font-size: 13px;
  color: var(--app-text);
  background: var(--app-input-bg);
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.field-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-error {
  margin: 0;
  color: #e15241;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
