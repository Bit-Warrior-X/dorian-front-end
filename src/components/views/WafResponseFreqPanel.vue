<template>
  <div class="waf-section-card">
    <div class="waf-section-header">
      <div>
        <h4>Response Freq</h4>
        <p class="waf-section-desc">
          Track response rates and block when response thresholds are exceeded.
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
            <th>Response Code</th>
            <th>Time (s)</th>
            <th>Response Count</th>
            <th>Behavior</th>
            <th>Yes / No</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in responseRules" :key="rule.id">
            <td class="checkbox-col">
              <input
                type="checkbox"
                class="row-checkbox"
                :value="rule.id"
                v-model="selectedRuleIds"
                aria-label="Select response freq rule"
              />
            </td>
            <td>{{ rule.url }}</td>
            <td>{{ rule.responseCode }}</td>
            <td>{{ rule.time }}</td>
            <td>{{ rule.responseCount }}</td>
            <td>{{ rule.behavior }}</td>
            <td>
              <span class="status-pill" :class="{ on: rule.enabled }">
                {{ rule.enabled ? "Yes" : "No" }}
              </span>
            </td>
            <td class="action-cell">
              <button
                type="button"
                class="icon-action-btn"
                aria-label="Edit rule"
                @click="editResponseRule(rule)"
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
                @click="deleteResponseRule(rule)"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M6.5 3.5h7l.5 1H18v1.5H2V4.5h4l.5-1Zm1 4h1.5v7H7.5v-7Zm3 0H12v7h-1.5v-7Zm-6 0H6v7H4.5v-7Zm11.5 0H15v7h1.5v-7ZM5 17h10a1 1 0 0 0 1-1V7H4v9a1 1 0 0 0 1 1Z"
                  />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!responseRules.length">
            <td colspan="8" class="empty-cell">No response freq rules yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="isDialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-label="Add response freq rule">
        <div class="dialog-header">
          <h4>Add Response Freq Rule</h4>
          <button type="button" class="icon-btn" @click="closeDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label for="response-url">
              URL <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="response-url"
                v-model="formState.url"
                type="text"
                class="form-input"
                placeholder="/api/v1/checkout"
                @blur="touched.url = true"
              />
              <p class="field-help">Support regular expressions</p>
              <p v-if="showUrlRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <label for="response-code">
              Response Code <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="response-code"
                v-model="formState.responseCode"
                type="text"
                class="form-input"
                placeholder="400 or not 200"
                @blur="touched.responseCode = true"
              />
              <p class="field-help">Supports exact code or expressions like "not 200".</p>
              <p v-if="showResponseCodeRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <label for="response-time">
              Time (seconds) <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="response-time"
                v-model="formState.time"
                type="number"
                min="1"
                class="form-input"
                @blur="touched.time = true"
              />
              <p v-if="showTimeRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <label for="response-count">
              Response Count <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="response-count"
                v-model="formState.count"
                type="number"
                min="1"
                class="form-input"
                @blur="touched.count = true"
              />
              <p v-if="showCountRequired" class="field-error">This field is required</p>
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
              Yes / No
            </label>
            <div class="field-control">
              <button
                type="button"
                class="toggle-switch"
                role="switch"
                :aria-checked="formState.enabled"
                :aria-label="formState.enabled ? 'Yes, click for No' : 'No, click for Yes'"
                :title="formState.enabled ? 'Click for No' : 'Click for Yes'"
                @click="formState.enabled = !formState.enabled"
              >
                <span class="toggle-track" :class="{ off: !formState.enabled }">
                  <span class="toggle-label on">Yes</span>
                  <span class="toggle-label off">No</span>
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
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Delete response rule">
        <div class="dialog-header">
          <h4>Delete Rule</h4>
          <button type="button" class="icon-btn" @click="closeDeleteDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete this response freq rule?
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
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Batch delete response rules">
        <div class="dialog-header">
          <h4>Batch Removal</h4>
          <button type="button" class="icon-btn" @click="closeBatchConfirm" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete the selected response freq rules?
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
  fetchResponseRules,
  createResponseRule,
  updateResponseRule,
  deleteResponseRule as deleteResponseRuleApi,
  deleteResponseRules
} from "@/api/wafResponseFreq";
import { notifyError, notifySuccess } from "@/utils/notify";

const WAF_RESPONSE_FREQ_TITLE = "WAF Response Frequency";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const responseRules = ref([]);

const selectedRuleIds = ref([]);
const isDialogOpen = ref(false);
const submitAttempted = ref(false);
const editingRuleId = ref(null);
const originalForm = ref(null);
const deleteTarget = ref(null);
const isBatchConfirmOpen = ref(false);
const touched = ref({
  url: false,
  responseCode: false,
  time: false,
  count: false
});
const formState = ref({
  url: "",
  responseCode: "",
  time: "",
  count: "",
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
    formState.value.responseCode.trim().length > 0 &&
    String(formState.value.time).trim().length > 0 &&
    String(formState.value.count).trim().length > 0 &&
    formState.value.behavior.trim().length > 0
  );
});

const showUrlRequired = computed(() => {
  return (
    (touched.value.url || submitAttempted.value) &&
    formState.value.url.trim().length === 0
  );
});

const showResponseCodeRequired = computed(() => {
  return (
    (touched.value.responseCode || submitAttempted.value) &&
    formState.value.responseCode.trim().length === 0
  );
});

const showTimeRequired = computed(() => {
  return (
    (touched.value.time || submitAttempted.value) &&
    String(formState.value.time).trim().length === 0
  );
});

const showCountRequired = computed(() => {
  return (
    (touched.value.count || submitAttempted.value) &&
    String(formState.value.count).trim().length === 0
  );
});

const resetForm = () => {
  formState.value = {
    url: "",
    responseCode: "",
    time: "",
    count: "",
    behavior: "Deny",
    enabled: true
  };
  touched.value = {
    url: false,
    responseCode: false,
    time: false,
    count: false
  };
  submitAttempted.value = false;
};

const openCreateDialog = () => {
  resetForm();
  editingRuleId.value = null;
  isDialogOpen.value = true;
};

const openEditDialog = (rule) => {
  formState.value = {
    url: rule.url,
  responseCode: String(rule.responseCode ?? ""),
    time: rule.time,
  count: String(rule.responseCount ?? ""),
    behavior: toDisplayBehavior(rule.behavior),
    enabled: rule.enabled
  };
  originalForm.value = JSON.stringify({
    url: formState.value.url.trim(),
    responseCode: formState.value.responseCode.trim(),
    time: String(formState.value.time).trim(),
    count: String(formState.value.count).trim(),
    behavior: formState.value.behavior,
    enabled: formState.value.enabled
  });
  touched.value = {
    url: false,
    responseCode: false,
    time: false,
    count: false
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

const editResponseRule = (rule) => {
  openEditDialog(rule);
};

const deleteResponseRule = (rule) => {
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
    responseCode: String(payload.responseCode ?? "").trim(),
    time: String(payload.time).trim(),
    count: String(payload.responseCount ?? "").trim(),
    behavior: toDisplayBehavior(payload.behavior),
    enabled: payload.status === "ENABLE"
  });
  return current !== originalForm.value;
};

const buildPayload = () => {
  return {
    url: formState.value.url.trim(),
    responseCode: String(formState.value.responseCode ?? "").trim(),
    time: Number(formState.value.time),
    responseCount: Number(formState.value.count),
    behavior: toApiBehavior(formState.value.behavior),
    status: formState.value.enabled ? "ENABLE" : "DISABLE"
  };
};

const loadRules = async () => {
  if (!props.serverId) {
    responseRules.value = [];
    return;
  }
  try {
    const data = await fetchResponseRules(props.serverId);
    const list = Array.isArray(data) ? data : [];
    responseRules.value = list.map((rule) => ({
      ...rule,
      responseCode: rule.responseCode,
      responseCount: rule.responseCount,
      behavior: toDisplayBehavior(rule.behavior),
      enabled: rule.status === "ENABLE"
    }));
  } catch {
    responseRules.value = [];
  }
};

const createRule = async (payload) => {
  try {
    await createResponseRule(props.serverId, payload);
    await loadRules();
    notifySuccess(WAF_RESPONSE_FREQ_TITLE, "The response freq rule is successfully created.");
    closeDialog();
  } catch (error) {
    notifyError(WAF_RESPONSE_FREQ_TITLE, error?.message || "The response freq rule could not be created.");
  }
};

const updateRule = async (payload) => {
  try {
    await updateResponseRule(props.serverId, editingRuleId.value, payload);
    await loadRules();
    notifySuccess(WAF_RESPONSE_FREQ_TITLE, "The response freq rule is successfully updated.");
    closeDialog();
  } catch (error) {
    notifyError(WAF_RESPONSE_FREQ_TITLE, error?.message || "The response freq rule could not be updated.");
  }
};

const handleDeleteRule = async () => {
  try {
    await deleteResponseRuleApi(props.serverId, deleteTarget.value.id);
    await loadRules();
    notifySuccess(WAF_RESPONSE_FREQ_TITLE, "The response freq rule is successfully deleted.");
  } catch (error) {
    notifyError(WAF_RESPONSE_FREQ_TITLE, error?.message || "The response freq rule could not be deleted.");
  } finally {
    deleteTarget.value = null;
    selectedRuleIds.value = selectedRuleIds.value.filter((id) =>
      responseRules.value.some((rule) => rule.id === id)
    );
  }
};

const handleBatchRemove = async () => {
  try {
    await deleteResponseRules(props.serverId, selectedRuleIds.value);
    await loadRules();
    notifySuccess(WAF_RESPONSE_FREQ_TITLE, "All response freq rules are successfully removed.");
  } catch (error) {
    notifyError(WAF_RESPONSE_FREQ_TITLE, error?.message || "The response freq rules could not be removed.");
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
