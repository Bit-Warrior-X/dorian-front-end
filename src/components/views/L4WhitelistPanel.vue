<template>
  <div class="l4-list-panel">
    <div class="panel-header">
      <div>
        <h4>L4 Whitelist</h4>
        <p class="panel-desc">Allow trusted source IPs for this server.</p>
      </div>
      <div class="panel-actions">
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
    </div>

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
import { useNotifications } from "@/stores/notifications";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const notifications = useNotifications();

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
    notifications.enqueue(error?.message || "Failed to load whitelist entries.", "error");
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
    notifications.enqueue("Whitelist entry added.", "success");
    closeDialog();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to add whitelist entry.", "error");
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
      notifications.enqueue("Whitelist cleared.", "success");
    } else if (confirmAction.value === "remove" && confirmTargetId.value) {
      await deleteL4WhitelistEntry(props.serverId, confirmTargetId.value);
      notifications.enqueue("Whitelist entry removed.", "success");
    }
    await loadEntries();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to update whitelist.", "error");
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
.l4-list-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.panel-desc {
  margin: 6px 0 0 0;
  color: #64748b;
  font-size: 0.92rem;
}

.panel-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.table-wrap {
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  width: 100%;
  max-height: 520px;
}

.list-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
  min-width: 560px;
}

.list-table th,
.list-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  color: #1f2937;
  word-break: break-word;
}

.list-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  background: rgba(248, 250, 252, 0.8);
}

.list-table tr:last-child td {
  border-bottom: none;
}

.empty-cell {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}

.primary-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25);
}

.secondary-btn {
  border: 1px solid rgba(148, 163, 184, 0.6);
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  background: #fff;
  color: #475569;
  cursor: pointer;
}

.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-action-btn {
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #fff;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  color: #2563eb;
}

.icon-action-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.icon-action-btn.danger {
  color: #dc2626;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
}

.dialog-card {
  width: min(520px, 100%);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.3);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 22px 18px;
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
  font-weight: 600;
  color: #0f172a;
}

.icon-btn {
  border: none;
  background: rgba(148, 163, 184, 0.2);
  color: #334155;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.form-field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 8px;
}

.required {
  color: #dc2626;
}

.form-input {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.92rem;
  color: #1f2937;
  background: #fff;
  outline: none;
}

.field-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-error {
  margin: 0;
  font-size: 0.85rem;
  color: #dc2626;
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
