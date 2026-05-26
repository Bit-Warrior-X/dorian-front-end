<template>
  <div class="waf-section-card">
    <div class="waf-section-header">
      <div>
        <h4>Whitelist</h4>
        <p class="waf-section-desc">
          Allow trusted traffic to bypass WAF checks for known-safe endpoints and sources.
        </p>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="primary-btn danger-btn"
          :disabled="!hasSelection"
          @click="openBatchConfirm"
        >
          Batch Removal
        </button>
        <button type="button" class="primary-btn" @click="openCreateDialog">
          Add Rule
        </button>
      </div>
    </div>
    <div class="waf-table-wrapper">
      <table class="waf-table">
        <thead>
          <tr>
            <th class="checkbox-col"></th>
            <th>URL</th>
            <th>Method</th>
            <th>IPs</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in whitelistRules" :key="rule.id">
            <td class="checkbox-col">
              <input
                type="checkbox"
                class="row-checkbox"
                :value="rule.id"
                v-model="selectedRuleIds"
                aria-label="Select whitelist rule"
              />
            </td>
            <td>{{ rule.url }}</td>
            <td>{{ rule.method }}</td>
            <td>{{ rule.ips }}</td>
            <td>{{ rule.description }}</td>
            <td class="action-cell">
              <button
                type="button"
                class="icon-action-btn"
                aria-label="Edit rule"
                @click="editWhitelistRule(rule)"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M13.75 2.5a1.77 1.77 0 0 1 1.25.52l1.98 1.98c.33.33.52.78.52 1.25s-.19.92-.52 1.25l-8.9 8.9a1.8 1.8 0 0 1-1.02.5l-3.55.5a.75.75 0 0 1-.85-.85l.5-3.55a1.8 1.8 0 0 1 .5-1.02l8.9-8.9c.33-.33.78-.52 1.25-.52Zm0 1.5a.27.27 0 0 0-.19.08l-8.9 8.9a.3.3 0 0 0-.08.16l-.36 2.52 2.52-.36a.3.3 0 0 0 .16-.08l8.9-8.9a.27.27 0 0 0 .08-.19.27.27 0 0 0-.08-.19l-1.98-1.98a.27.27 0 0 0-.19-.08Z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="icon-action-btn danger"
                aria-label="Delete rule"
                @click="deleteWhitelistRule(rule)"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M6.5 3.5h7l.5 1H18v1.5H2V4.5h4l.5-1Zm1 4h1.5v7H7.5v-7Zm3 0H12v7h-1.5v-7Zm-6 0H6v7H4.5v-7Zm11.5 0H15v7h1.5v-7ZM5 17h10a1 1 0 0 0 1-1V7H4v9a1 1 0 0 0 1 1Z"
                  />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!whitelistRules.length">
            <td colspan="6" class="empty-cell">No whitelist rules yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="isDialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-label="Add whitelist rule">
        <div class="dialog-header">
          <h4>Add Whitelist Rule</h4>
          <button type="button" class="icon-btn" @click="closeDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label for="whitelist-ips">
              White IP Lists <span class="required">*</span>
            </label>
            <div class="field-control">
              <textarea
                id="whitelist-ips"
                v-model="formState.ipList"
                class="form-input"
                rows="4"
                placeholder="127.0.0.1&#10;127.0.0.1/24"
                @blur="touched.ipList = true"
              ></textarea>
              <p class="field-help">
                Accept Network Segment, Ex:127.0.0.1,127.0.0.1/24 Accept Adding Multiple IP With
                Line Break Whitelist the entire URL, set to 0.0.0.0/0 The URL whitelist feature takes
                precedence over all rules
              </p>
              <p v-if="showIpRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <label for="whitelist-url">
              URL <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="whitelist-url"
                v-model="formState.url"
                type="text"
                class="form-input"
                placeholder="/api/v1/health"
                @blur="touched.url = true"
              />
              <p class="field-help">Support regular expressions</p>
              <p v-if="showUrlRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <span class="field-label">
              Method
            </span>
            <div class="field-control">
              <div class="checkbox-grid">
                <label v-for="method in methodOptions" :key="method" class="checkbox-item">
                  <input type="checkbox" :value="method" v-model="formState.methods" />
                  <span>{{ method }}</span>
                </label>
              </div>
              <p v-if="showMethodRequired" class="field-error">Select at least one method</p>
            </div>
          </div>
          <div class="form-field">
            <label for="whitelist-desc">
              Description <span class="required">*</span>
            </label>
            <div class="field-control">
              <textarea
                id="whitelist-desc"
                v-model="formState.description"
                class="form-input"
                rows="3"
                placeholder="Optional note for this rule"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button type="button" class="secondary-btn" @click="closeDialog">
            Cancel
          </button>
          <button type="button" class="primary-btn" :disabled="!isFormValid" @click="saveRule">
            {{ isEditing ? "Update Rule" : "Save Rule" }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="deleteTarget" class="dialog-overlay" @click.self="closeDeleteDialog">
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Delete whitelist rule">
        <div class="dialog-header">
          <h4>Delete Rule</h4>
          <button type="button" class="icon-btn" @click="closeDeleteDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete this whitelist rule?
          </p>
        </div>
        <div class="dialog-footer">
          <button type="button" class="secondary-btn" @click="closeDeleteDialog">
            Cancel
          </button>
          <button type="button" class="primary-btn danger-btn" @click="confirmDeleteRule">
            Confirm
          </button>
        </div>
      </div>
    </div>
    <div v-if="isBatchConfirmOpen" class="dialog-overlay" @click.self="closeBatchConfirm">
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Batch delete whitelist rules">
        <div class="dialog-header">
          <h4>Batch Removal</h4>
          <button type="button" class="icon-btn" @click="closeBatchConfirm" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete the selected whitelist rules?
          </p>
        </div>
        <div class="dialog-footer">
          <button type="button" class="secondary-btn" @click="closeBatchConfirm">
            Cancel
          </button>
          <button type="button" class="primary-btn danger-btn" @click="confirmBatchRemove">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  fetchWhitelistRules,
  createWhitelistRule,
  updateWhitelistRule,
  deleteWhitelistRule as deleteWhitelistRuleApi,
  deleteWhitelistRules
} from "@/api/wafWhitelist";
import { useNotifications } from "@/stores/notifications";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const notifications = useNotifications();
const whitelistRules = ref([]);

const selectedRuleIds = ref([]);

const methodOptions = ["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH", "OPTIONS"];
const isDialogOpen = ref(false);
const submitAttempted = ref(false);
const editingRuleId = ref(null);
const originalForm = ref(null);
const deleteTarget = ref(null);
const isBatchConfirmOpen = ref(false);
const touched = ref({
  ipList: false,
  url: false
});
const formState = ref({
  ipList: "",
  url: "",
  methods: [],
  description: ""
});

const hasSelection = computed(() => selectedRuleIds.value.length > 0);

const isFormValid = computed(() => {
  return (
    formState.value.ipList.trim().length > 0 &&
    formState.value.url.trim().length > 0 &&
    formState.value.description.trim().length > 0 &&
    formState.value.methods.length > 0
  );
});

const showIpRequired = computed(() => {
  return (
    (touched.value.ipList || submitAttempted.value) &&
    formState.value.ipList.trim().length === 0
  );
});

const showUrlRequired = computed(() => {
  return (
    (touched.value.url || submitAttempted.value) &&
    formState.value.url.trim().length === 0
  );
});

const showMethodRequired = computed(() => {
  return submitAttempted.value && formState.value.methods.length === 0;
});

const resetForm = () => {
  formState.value = {
    ipList: "",
    url: "",
    methods: [],
    description: ""
  };
  touched.value = {
    ipList: false,
    url: false
  };
  submitAttempted.value = false;
};

const openCreateDialog = () => {
  resetForm();
  editingRuleId.value = null;
  isDialogOpen.value = true;
};

const openEditDialog = (rule) => {
  const normalizedMethod = rule.method?.trim() || "";
  const parsedMethods = normalizedMethod
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const methods = parsedMethods;
  formState.value = {
    ipList: rule.ips.split(",").map((ip) => ip.trim()).join("\n"),
    url: rule.url,
    methods,
    description: rule.description
  };
  originalForm.value = JSON.stringify({
    ipList: formState.value.ipList.trim(),
    url: formState.value.url.trim(),
    methods: [...formState.value.methods].sort(),
    description: formState.value.description.trim()
  });
  touched.value = {
    ipList: false,
    url: false
  };
  submitAttempted.value = false;
  editingRuleId.value = rule.id;
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
};

const saveRule = () => {
  submitAttempted.value = true;
  if (!isFormValid.value) return;
  const ipString = formState.value.ipList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(", ");
  const payload = {
    url: formState.value.url.trim(),
    method: formState.value.methods.join(", "),
    ips: ipString || formState.value.ipList.trim(),
    description: formState.value.description.trim()
  };
  if (!props.serverId) return;
  if (editingRuleId.value && !isRuleDirty(payload)) {
    closeDialog();
    return;
  }
  if (editingRuleId.value) {
    void updateRule(payload);
  } else {
    void createRule(payload);
  }
};

const isEditing = computed(() => Boolean(editingRuleId.value));
const editWhitelistRule = (rule) => {
  openEditDialog(rule);
};
const deleteWhitelistRule = (rule) => {
  deleteTarget.value = rule;
};

const closeDeleteDialog = () => {
  deleteTarget.value = null;
};

const confirmDeleteRule = () => {
  if (!deleteTarget.value || !props.serverId) return;
  void handleDeleteRule();
};

const openBatchConfirm = () => {
  if (!selectedRuleIds.value.length) return;
  isBatchConfirmOpen.value = true;
};

const closeBatchConfirm = () => {
  isBatchConfirmOpen.value = false;
};

const confirmBatchRemove = () => {
  if (!selectedRuleIds.value.length || !props.serverId) return;
  void handleBatchRemove();
};

const isRuleDirty = (payload) => {
  if (!originalForm.value) return true;
  const current = JSON.stringify({
    ipList: payload.ips.trim(),
    url: payload.url.trim(),
    methods: payload.method.split(",").map((value) => value.trim()).filter(Boolean).sort(),
    description: payload.description.trim()
  });
  return current !== originalForm.value;
};


const loadRules = async () => {
  if (!props.serverId) {
    whitelistRules.value = [];
    return;
  }
  try {
    const data = await fetchWhitelistRules(props.serverId);
    whitelistRules.value = Array.isArray(data) ? data : [];
  } catch {
    whitelistRules.value = [];
  }
};

const createRule = async (payload) => {
  try {
    await createWhitelistRule(props.serverId, payload);
    await loadRules();
    notifications.enqueue("Whitelist rule created.", "success");
    closeDialog();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to create whitelist rule.", "error");
  }
};

const updateRule = async (payload) => {
  try {
    await updateWhitelistRule(props.serverId, editingRuleId.value, payload);
    await loadRules();
    notifications.enqueue("Whitelist rule updated.", "success");
    closeDialog();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to update whitelist rule.", "error");
  }
};

const handleDeleteRule = async () => {
  try {
    await deleteWhitelistRuleApi(props.serverId, deleteTarget.value.id);
    await loadRules();
    notifications.enqueue("Whitelist rule deleted.", "success");
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to delete whitelist rule.", "error");
  } finally {
    deleteTarget.value = null;
    selectedRuleIds.value = selectedRuleIds.value.filter((id) =>
      whitelistRules.value.some((rule) => rule.id === id)
    );
  }
};

const handleBatchRemove = async () => {
  try {
    await deleteWhitelistRules(props.serverId, selectedRuleIds.value);
    await loadRules();
    notifications.enqueue("Whitelist rules removed.", "success");
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to remove whitelist rules.", "error");
  } finally {
    selectedRuleIds.value = [];
    isBatchConfirmOpen.value = false;
  }
};

onMounted(() => {
  void loadRules();
});

watch(
  () => props.serverId,
  () => {
    selectedRuleIds.value = [];
    editingRuleId.value = null;
    deleteTarget.value = null;
    void loadRules();
  }
);
</script>

<style scoped>
.waf-section-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.waf-section-card h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
}

.waf-section-desc {
  margin: 6px 0 0 0;
  color: var(--app-text-muted);
  font-size: 0.92rem;
}

.waf-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.primary-btn,
.primary-btn:hover:not(:disabled) {
  /* flat styles from theme.css */
}

.waf-table-wrapper {
  overflow: auto;
  border-radius: 12px;
  border: 1px solid var(--app-border-strong);
  width: 100%;
  flex: 1;
  min-height: 0;
  max-height: 520px;
}

.waf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
  min-width: 640px;
  table-layout: fixed;
}

.waf-table th,
.waf-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--app-border-strong);
  color: var(--app-heading);
  word-break: break-word;
}

.checkbox-col {
  width: 44px;
  text-align: center;
}

.row-checkbox {
  width: 16px;
  height: 16px;
}

.waf-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
  background: var(--app-surface-muted);
}

.waf-table tr:last-child td {
  border-bottom: none;
}

.action-cell {
  display: flex;
  gap: 10px;
}

.icon-action-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  color: var(--app-accent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.icon-action-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.icon-action-btn:hover {
  background: var(--app-surface-hover);
}

.icon-action-btn.danger {
  color: #dc2626;
}

.empty-cell {
  text-align: center;
  color: var(--app-text-muted);
  font-style: italic;
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
  width: min(720px, 100%);
  background: var(--app-surface-solid);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.3);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 22px 18px;
}

.dialog-card.dialog-confirm {
  width: min(480px, 100%);
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
  color: var(--app-heading);
}

.icon-btn {
  border: none;
  background: var(--app-surface-hover);
  color: var(--app-text-secondary);
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

.confirm-text {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.95rem;
}

.form-field {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.form-field label,
.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--app-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 8px;
}

.required {
  color: #dc2626;
}

.form-input {
  border: 1px solid var(--app-border-strong);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.92rem;
  color: var(--app-heading);
  background: var(--app-surface-solid);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  resize: vertical;
}

.form-input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.field-help {
  margin: 0;
  font-size: 0.82rem;
  color: var(--app-text-muted);
  line-height: 1.4;
}

.field-error {
  margin: 0;
  font-size: 0.82rem;
  color: #dc2626;
  font-weight: 600;
}

.field-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.checkbox-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  font-size: 0.9rem;
  color: var(--app-heading);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.secondary-btn {
  border: 1px solid var(--app-border-strong);
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  cursor: pointer;
}

.secondary-btn:hover {
  background: var(--app-surface-hover);
}

.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.danger-btn:not(.primary-btn) {
  /* outline danger from theme.css */
}

.danger-btn.primary-btn,
.primary-btn.danger-btn {
  /* solid danger from theme.css */
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
  transform: none;
}

.danger-btn:not(.primary-btn) {
  /* outline danger from theme.css */
}
</style>
