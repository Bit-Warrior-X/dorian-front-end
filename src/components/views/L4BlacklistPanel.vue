<template>
  <div class="l4-list-panel">
    <div class="panel-header">
      <div>
        <h4>L4 Blacklist</h4>
        <p class="panel-desc">Blocked sources that trigger L4 DDoS defenses.</p>
      </div>
      <div class="panel-actions">
        <button
          type="button"
          class="secondary-btn"
          :disabled="!canInteract || entries.length === 0"
          @click="openConfirm('flush')"
        >
          Flush All
        </button>
        <button
          type="button"
          class="primary-btn"
          :disabled="!canInteract"
          @click="openDialog"
        >
          Block IP
        </button>
      </div>
    </div>

    <div class="table-wrap">
      <table class="list-table">
        <thead>
          <tr>
            <th>IP address</th>
            <th>Reason</th>
            <th>TTL</th>
            <th>Trigger Rule</th>
            <th>Added</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in entries" :key="entry.id">
            <td>{{ entry.ipAddress }}</td>
            <td>{{ entry.reason || "-" }}</td>
            <td>{{ entry.ttl || "Indefinite" }}</td>
            <td>{{ entry.triggerRule || "manual" }}</td>
            <td>{{ formatTimestamp(entry.createdAt) }}</td>
            <td>
              <button
                type="button"
                class="icon-action-btn danger"
                aria-label="Unblock"
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
            <td colspan="6" class="empty-cell">No blacklist entries yet.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isDialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-label="Block IP">
        <div class="dialog-header">
          <h4>Block IP</h4>
          <button type="button" class="icon-btn" @click="closeDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label for="l4-blacklist-ip">
              IP address <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="l4-blacklist-ip"
                v-model="formState.ipAddress"
                type="text"
                class="form-input"
                placeholder="192.168.1.10"
              />
            </div>
          </div>
          <div class="form-field">
            <label for="l4-blacklist-reason">Reason</label>
            <div class="field-control">
              <input
                id="l4-blacklist-reason"
                v-model="formState.reason"
                type="text"
                class="form-input"
                placeholder="Manual block"
              />
            </div>
          </div>
          <div class="form-field">
            <label for="l4-blacklist-ttl">
              TTL <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="l4-blacklist-ttl"
                v-model="formState.ttl"
                type="text"
                class="form-input"
                placeholder="30d"
              />
            </div>
          </div>
          <div class="form-field">
            <label for="l4-blacklist-rule">Trigger Rule</label>
            <div class="field-control">
              <input
                id="l4-blacklist-rule"
                v-model="formState.triggerRule"
                type="text"
                class="form-input"
                placeholder="l4-ddos"
              />
            </div>
          </div>
          <p v-if="validationError" class="field-error">{{ validationError }}</p>
        </div>
        <div class="dialog-footer">
          <button type="button" class="secondary-btn" @click="closeDialog">Cancel</button>
          <button type="button" class="primary-btn" :disabled="!canInteract" @click="createEntry">
            Block IP
          </button>
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
  fetchBlacklistEntries,
  createBlacklistEntry,
  deleteBlacklistEntry,
  flushBlacklistEntries
} from "@/api/serverBlacklist";
import { fetchServers } from "@/api/servers";
import { useNotifications } from "@/stores/notifications";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const notifications = useNotifications();
const entries = ref([]);
const servers = ref([]);
const isDialogOpen = ref(false);
const validationError = ref("");
const isConfirmDialogOpen = ref(false);
const confirmAction = ref(null);
const confirmTargetId = ref(null);
const formState = ref({
  ipAddress: "",
  reason: "",
  ttl: "",
  triggerRule: "l4-ddos"
});

const canInteract = computed(() => Boolean(props.serverId));
const activeServerName = computed(() => {
  const match = servers.value.find((server) => String(server.id) === String(props.serverId));
  return match?.name || "";
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

const loadServers = async () => {
  try {
    const list = await fetchServers();
    servers.value = Array.isArray(list) ? list : [];
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to load servers.", "error");
  }
};

const loadEntries = async () => {
  if (!props.serverId) {
    entries.value = [];
    return;
  }
  try {
    const list = await fetchBlacklistEntries(props.serverId);
    entries.value = Array.isArray(list) ? list : [];
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to load blacklist entries.", "error");
  }
};

const resetForm = () => {
  formState.value = {
    ipAddress: "",
    reason: "",
    ttl: "",
    triggerRule: "l4-ddos"
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

const createEntry = async () => {
  if (!props.serverId) return;
  const ipAddress = formState.value.ipAddress.trim();
  const ttl = formState.value.ttl.trim();
  if (!ipAddress || !ttl) {
    validationError.value = "IP address and TTL are required.";
    return;
  }
  try {
    await createBlacklistEntry({
      serverId: Number(props.serverId),
      ipAddress,
      geolocation: "Manual",
      reason: formState.value.reason.trim() || "Manual block",
      server: activeServerName.value,
      ttl,
      triggerRule: formState.value.triggerRule.trim() || "l4-ddos"
    });
    await loadEntries();
    notifications.enqueue("Blacklist entry created.", "success");
    closeDialog();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to create blacklist entry.", "error");
  }
};

const openConfirm = (action, targetId = null) => {
  confirmAction.value = action;
  confirmTargetId.value = targetId;
  isConfirmDialogOpen.value = true;
};

const confirmTitle = computed(() => {
  if (confirmAction.value === "flush") return "Flush all blacklist entries";
  if (confirmAction.value === "remove") return "Remove blacklist entry";
  return "Confirm action";
});

const confirmMessage = computed(() => {
  if (confirmAction.value === "flush") {
    return "Are you sure you want to flush all L4 blacklist entries?";
  }
  if (confirmAction.value === "remove") {
    return "Are you sure you want to remove this blacklist entry?";
  }
  return "Are you sure you want to continue?";
});

const confirmConfirmText = computed(() => {
  if (confirmAction.value === "flush") return "Flush";
  if (confirmAction.value === "remove") return "Remove";
  return "Confirm";
});

const handleConfirm = async () => {
  try {
    if (confirmAction.value === "flush") {
      await flushBlacklistEntries(props.serverId);
      notifications.enqueue("Blacklist flushed.", "success");
    } else if (confirmAction.value === "remove" && confirmTargetId.value) {
      await deleteBlacklistEntry(confirmTargetId.value);
      notifications.enqueue("Blacklist entry removed.", "success");
    }
    await loadEntries();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to update blacklist.", "error");
  }
  clearConfirm();
};

const clearConfirm = () => {
  isConfirmDialogOpen.value = false;
  confirmAction.value = null;
  confirmTargetId.value = null;
};

onMounted(async () => {
  await loadServers();
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
  min-width: 640px;
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

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
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
