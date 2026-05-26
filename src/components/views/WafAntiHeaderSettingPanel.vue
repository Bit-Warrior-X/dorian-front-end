<template>
  <div class="waf-section-card">
    <div class="waf-section-header">
      <div>
        <h4>Anti Header Setting</h4>
        <p class="waf-section-desc">
          Block or challenge requests based on suspicious header patterns.
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
            <th>Header</th>
            <th>Value</th>
            <th>Block Mode</th>
            <th>Behavior</th>
            <th>Enable/Disable</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in antiHeaderRules" :key="rule.id">
            <td class="checkbox-col">
              <input
                type="checkbox"
                class="row-checkbox"
                :value="rule.id"
                v-model="selectedRuleIds"
                aria-label="Select anti header rule"
              />
            </td>
            <td>{{ rule.url }}</td>
            <td>{{ rule.header }}</td>
            <td>{{ rule.value }}</td>
            <td>{{ rule.blockMode }}</td>
            <td>{{ rule.behavior }}</td>
            <td>
              <span class="status-pill" :class="{ on: rule.enabled }">
                {{ rule.enabled ? "Enabled" : "Disabled" }}
              </span>
            </td>
            <td class="action-cell">
              <button
                type="button"
                class="icon-action-btn"
                aria-label="Edit rule"
                @click="editAntiHeaderRule(rule)"
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
                @click="deleteAntiHeaderRule(rule)"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M6.5 3.5h7l.5 1H18v1.5H2V4.5h4l.5-1Zm1 4h1.5v7H7.5v-7Zm3 0H12v7h-1.5v-7Zm-6 0H6v7H4.5v-7Zm11.5 0H15v7h1.5v-7ZM5 17h10a1 1 0 0 0 1-1V7H4v9a1 1 0 0 0 1 1Z"
                  />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!antiHeaderRules.length">
            <td colspan="8" class="empty-cell">No Anti Header rules yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="isDialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-label="Add anti header rule">
        <div class="dialog-header">
          <h4>Add Anti Header Rule</h4>
          <button type="button" class="icon-btn" @click="closeDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label for="anti-header-url">
              URL <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="anti-header-url"
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
            <label for="anti-header-name">
              Header <span class="required">*</span>
            </label>
            <div class="field-control">
              <div class="inline-control">
                <select id="anti-header-name" v-model="formState.headerMode" class="form-input">
                  <option>Customize</option>
                  <option>X-XSS-Protection</option>
                  <option>X-Frame-Options</option>
                  <option>Cache-Control</option>
                  <option>Cookie</option>
                  <option>Origin</option>
                  <option>Referer</option>
                </select>
                <input
                  v-if="formState.headerMode === 'Customize'"
                  id="anti-header-custom"
                  v-model="formState.customHeader"
                  type="text"
                  class="form-input"
                  placeholder="X-Custom-Header"
                  @blur="touched.customHeader = true"
                />
              </div>
              <p v-if="showCustomHeaderRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <label for="anti-header-value">
              Value <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="anti-header-value"
                v-model="formState.value"
                type="text"
                class="form-input"
                placeholder="curl"
                @blur="touched.value = true"
              />
              <p v-if="showValueRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <label>
              Block Mode <span class="required">*</span>
            </label>
            <div class="field-control">
              <div class="option-group">
                <button
                  type="button"
                  class="option-btn"
                  :class="{ active: formState.blockMode === 'If match' }"
                  @click="formState.blockMode = 'If match'"
                >
                  If match
                </button>
                <button
                  type="button"
                  class="option-btn"
                  :class="{ active: formState.blockMode === 'If not match' }"
                  @click="formState.blockMode = 'If not match'"
                >
                  If not match
                </button>
              </div>
            </div>
          </div>
          <div class="form-field">
            <label>
              Behavior <span class="required">*</span>
            </label>
            <div class="field-control">
              <div class="option-group">
                <button
                  type="button"
                  class="option-btn"
                  :class="{ active: formState.behavior === 'Deny' }"
                  @click="formState.behavior = 'Deny'"
                >
                  Deny
                </button>
                <button
                  type="button"
                  class="option-btn"
                  :class="{ active: formState.behavior === 'Drop' }"
                  @click="formState.behavior = 'Drop'"
                >
                  Drop
                </button>
                <button
                  type="button"
                  class="option-btn"
                  :class="{ active: formState.behavior === 'Drop + Block' }"
                  @click="formState.behavior = 'Drop + Block'"
                >
                  Drop + Block
                </button>
              </div>
            </div>
          </div>
          <div class="form-field">
            <label>
              Enable/Disable
            </label>
            <div class="field-control">
              <button
                type="button"
                class="toggle-switch"
                role="switch"
                :aria-checked="formState.enabled"
                :aria-label="formState.enabled ? 'Disable rule' : 'Enable rule'"
                :title="formState.enabled ? 'Click to disable' : 'Click to enable'"
                @click="formState.enabled = !formState.enabled"
              >
                <span class="toggle-track" :class="{ off: !formState.enabled }">
                  <span class="toggle-label on">Enable</span>
                  <span class="toggle-label off">Disable</span>
                  <span class="toggle-knob" :class="{ on: formState.enabled }"></span>
                </span>
              </button>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button type="button" class="secondary-btn" @click="closeDialog">
            Cancel
          </button>
          <button type="button" class="primary-btn" :disabled="isSubmitDisabled" @click="saveRule">
            {{ isEditing ? "Update Rule" : "Save Rule" }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="deleteTarget" class="dialog-overlay" @click.self="closeDeleteDialog">
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Delete anti header rule">
        <div class="dialog-header">
          <h4>Delete Rule</h4>
          <button type="button" class="icon-btn" @click="closeDeleteDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete this anti header rule?
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
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Batch delete anti header rules">
        <div class="dialog-header">
          <h4>Batch Removal</h4>
          <button type="button" class="icon-btn" @click="closeBatchConfirm" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete the selected anti header rules?
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
  fetchAntiHeaderRules,
  createAntiHeaderRule,
  updateAntiHeaderRule,
  deleteAntiHeaderRule as deleteAntiHeaderRuleApi,
  deleteAntiHeaderRules
} from "@/api/wafAntiHeader";
import { useNotifications } from "@/stores/notifications";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const notifications = useNotifications();
const antiHeaderRules = ref([]);

const selectedRuleIds = ref([]);
const isDialogOpen = ref(false);
const submitAttempted = ref(false);
const editingRuleId = ref(null);
const originalForm = ref(null);
const deleteTarget = ref(null);
const isBatchConfirmOpen = ref(false);
const touched = ref({
  url: false,
  value: false,
  customHeader: false
});
const formState = ref({
  url: "",
  headerMode: "Customize",
  customHeader: "",
  value: "",
  blockMode: "If match",
  behavior: "Deny",
  enabled: true
});

const hasSelection = computed(() => selectedRuleIds.value.length > 0);
const isEditing = computed(() => Boolean(editingRuleId.value));
const isSubmitDisabled = computed(() => {
  if (!props.serverId || !isFormValid.value) return true;
  if (editingRuleId.value) {
    return !isRuleDirty(buildPayload());
  }
  return false;
});

const isFormValid = computed(() => {
  return (
    formState.value.url.trim().length > 0 &&
    formState.value.value.trim().length > 0 &&
    (formState.value.headerMode !== "Customize" ||
      formState.value.customHeader.trim().length > 0) &&
    formState.value.blockMode.trim().length > 0 &&
    formState.value.behavior.trim().length > 0
  );
});

const showUrlRequired = computed(() => {
  return (
    (touched.value.url || submitAttempted.value) &&
    formState.value.url.trim().length === 0
  );
});

const showCustomHeaderRequired = computed(() => {
  return (
    (touched.value.customHeader || submitAttempted.value) &&
    formState.value.headerMode === "Customize" &&
    formState.value.customHeader.trim().length === 0
  );
});

const showValueRequired = computed(() => {
  return (
    (touched.value.value || submitAttempted.value) &&
    formState.value.value.trim().length === 0
  );
});

const resetForm = () => {
  formState.value = {
    url: "",
    headerMode: "Customize",
    customHeader: "",
    value: "",
    blockMode: "If match",
    behavior: "Deny",
    enabled: true
  };
  touched.value = {
    url: false,
    value: false,
    customHeader: false
  };
  submitAttempted.value = false;
};

const openCreateDialog = () => {
  resetForm();
  editingRuleId.value = null;
  isDialogOpen.value = true;
};

const openEditDialog = (rule) => {
  const knownHeaders = [
    "X-XSS-Protection",
    "X-Frame-Options",
    "Cache-Control",
    "Cookie",
    "Origin",
    "Referer"
  ];
  const headerMode = knownHeaders.includes(rule.header) ? rule.header : "Customize";
  formState.value = {
    url: rule.url,
    headerMode,
    customHeader: headerMode === "Customize" ? rule.header : "",
    value: rule.value,
    blockMode: rule.blockMode || "If match",
    behavior: toDisplayBehavior(rule.behavior),
    enabled: rule.enabled
  };
  originalForm.value = JSON.stringify({
    url: formState.value.url.trim(),
    header: getHeaderValue().trim(),
    value: formState.value.value.trim(),
    blockMode: formState.value.blockMode,
    behavior: formState.value.behavior,
    enabled: formState.value.enabled
  });
  touched.value = {
    url: false,
    value: false,
    customHeader: false
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
  const payload = buildPayload();
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

const editAntiHeaderRule = (rule) => {
  openEditDialog(rule);
};

const deleteAntiHeaderRule = (rule) => {
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

const getHeaderValue = () => {
  return formState.value.headerMode === "Customize"
    ? formState.value.customHeader.trim()
    : formState.value.headerMode;
};

const toDisplayBehavior = (value) => {
  if (!value) return "Drop";
  return value === "Drop+Block" ? "Drop + Block" : value;
};

const toApiBehavior = (value) => {
  return value === "Drop + Block" ? "Drop+Block" : value;
};

const isRuleDirty = (payload) => {
  if (!originalForm.value) return true;
  const current = JSON.stringify({
    url: payload.url.trim(),
    header: payload.header.trim(),
    value: payload.value.trim(),
    blockMode: payload.blockMode,
    behavior: toDisplayBehavior(payload.behavior),
    enabled: payload.status === "ENABLE"
  });
  return current !== originalForm.value;
};

const buildPayload = () => {
  return {
    url: formState.value.url.trim(),
    header: getHeaderValue().trim(),
    value: formState.value.value.trim(),
    blockMode: formState.value.blockMode,
    behavior: toApiBehavior(formState.value.behavior),
    status: formState.value.enabled ? "ENABLE" : "DISABLE"
  };
};

const loadRules = async () => {
  if (!props.serverId) {
    antiHeaderRules.value = [];
    return;
  }
  try {
    const data = await fetchAntiHeaderRules(props.serverId);
    const list = Array.isArray(data) ? data : [];
    antiHeaderRules.value = list.map((rule) => ({
      ...rule,
      blockMode: rule.blockMode || "If match",
      behavior: toDisplayBehavior(rule.behavior),
      enabled: rule.status === "ENABLE"
    }));
  } catch {
    antiHeaderRules.value = [];
  }
};

const createRule = async (payload) => {
  try {
    await createAntiHeaderRule(props.serverId, payload);
    await loadRules();
    notifications.enqueue("Anti header rule created.", "success");
    closeDialog();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to create anti header rule.", "error");
  }
};

const updateRule = async (payload) => {
  try {
    await updateAntiHeaderRule(props.serverId, editingRuleId.value, payload);
    await loadRules();
    notifications.enqueue("Anti header rule updated.", "success");
    closeDialog();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to update anti header rule.", "error");
  }
};

const handleDeleteRule = async () => {
  try {
    await deleteAntiHeaderRuleApi(props.serverId, deleteTarget.value.id);
    await loadRules();
    notifications.enqueue("Anti header rule deleted.", "success");
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to delete anti header rule.", "error");
  } finally {
    deleteTarget.value = null;
    selectedRuleIds.value = selectedRuleIds.value.filter((id) =>
      antiHeaderRules.value.some((rule) => rule.id === id)
    );
  }
};

const handleBatchRemove = async () => {
  try {
    await deleteAntiHeaderRules(props.serverId, selectedRuleIds.value);
    await loadRules();
    notifications.enqueue("Anti header rules removed.", "success");
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to remove anti header rules.", "error");
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
  min-width: 720px;
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

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--app-text-secondary);
  background: var(--app-surface-hover);
}

.status-pill.on {
  color: #15803d;
  background: rgba(34, 197, 94, 0.18);
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
  max-height: 80vh;
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
  overflow-y: auto;
  padding-right: 6px;
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

.inline-control {
  display: grid;
  grid-template-columns: minmax(160px, 220px) 1fr;
  gap: 10px;
  align-items: center;
}

.inline-control .form-input {
  width: 100%;
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

.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-btn.active {
  background: var(--app-accent-soft);
  border-color: rgba(124, 58, 237, 0.5);
  color: var(--app-accent);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
