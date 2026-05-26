<template>
  <div class="waf-section-card">
    <div class="waf-section-header">
      <div>
        <h4>IP Repulation</h4>
        <p class="waf-section-desc">
          Use threat intelligence scores to block or challenge risky IPs.
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
            <th>IP / CIDR</th>
            <th>Risk Score</th>
            <th>Category</th>
            <th>Behavior</th>
            <th>Yes / No</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in ipRepRules" :key="rule.id">
            <td class="checkbox-col">
              <input
                type="checkbox"
                class="row-checkbox"
                :value="rule.id"
                v-model="selectedRuleIds"
                aria-label="Select IP reputation rule"
              />
            </td>
            <td>{{ rule.ipRange }}</td>
            <td>{{ rule.riskScore }}</td>
            <td>{{ rule.category }}</td>
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
                @click="editIpRepRule(rule)"
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
                @click="deleteIpRepRule(rule)"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M6.5 3.5h7l.5 1H18v1.5H2V4.5h4l.5-1Zm1 4h1.5v7H7.5v-7Zm3 0H12v7h-1.5v-7Zm-6 0H6v7H4.5v-7Zm11.5 0H15v7h1.5v-7ZM5 17h10a1 1 0 0 0 1-1V7H4v9a1 1 0 0 0 1 1Z"
                  />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!ipRepRules.length">
            <td colspan="7" class="empty-cell">No IP reputation rules yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="isDialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-label="Add IP reputation rule">
        <div class="dialog-header">
          <h4>Add IP Reputation Rule</h4>
          <button type="button" class="icon-btn" @click="closeDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label for="iprep-range">
              IP / CIDR <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="iprep-range"
                v-model="formState.ipRange"
                type="text"
                class="form-input"
                placeholder="203.0.113.0/24"
                @blur="touched.ipRange = true"
              />
              <p v-if="showIpRangeRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <label for="iprep-score">
              Risk Score <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="iprep-score"
                v-model="formState.riskScore"
                type="number"
                min="0"
                max="100"
                class="form-input"
                @blur="touched.riskScore = true"
              />
              <p v-if="showRiskRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <label for="iprep-category">
              Category <span class="required">*</span>
            </label>
            <div class="field-control">
              <select id="iprep-category" v-model="formState.category" class="form-input">
                <option>Botnet</option>
                <option>Malware</option>
                <option>Phishing</option>
                <option>Brute Force</option>
                <option>Proxy/VPN</option>
              </select>
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
                  :class="{ active: formState.behavior === 'Drop + Black' }"
                  @click="formState.behavior = 'Drop + Black'"
                >
                  Drop + Black
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
          <button type="button" class="primary-btn" :disabled="!isFormValid" @click="saveRule">
            {{ isEditing ? "Update Rule" : "Save Rule" }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="deleteTarget" class="dialog-overlay" @click.self="closeDeleteDialog">
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Delete IP reputation rule">
        <div class="dialog-header">
          <h4>Delete Rule</h4>
          <button type="button" class="icon-btn" @click="closeDeleteDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete this IP reputation rule?
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
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Batch delete IP reputation rules">
        <div class="dialog-header">
          <h4>Batch Removal</h4>
          <button type="button" class="icon-btn" @click="closeBatchConfirm" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete the selected IP reputation rules?
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
import { ref, computed } from "vue";

const ipRepRules = ref([
  {
    id: "rule-1",
    ipRange: "203.0.113.0/24",
    riskScore: 85,
    category: "Botnet",
    behavior: "Drop",
    enabled: true
  },
  {
    id: "rule-2",
    ipRange: "198.51.100.10",
    riskScore: 70,
    category: "Brute Force",
    behavior: "Deny",
    enabled: true
  },
  {
    id: "rule-3",
    ipRange: "192.0.2.0/28",
    riskScore: 92,
    category: "Malware",
    behavior: "Drop + Black",
    enabled: false
  }
]);

const selectedRuleIds = ref([]);
const isDialogOpen = ref(false);
const submitAttempted = ref(false);
const editingRuleId = ref(null);
const deleteTarget = ref(null);
const isBatchConfirmOpen = ref(false);
const touched = ref({
  ipRange: false,
  riskScore: false
});
const formState = ref({
  ipRange: "",
  riskScore: "",
  category: "Botnet",
  behavior: "Deny",
  enabled: true
});

const hasSelection = computed(() => selectedRuleIds.value.length > 0);
const isEditing = computed(() => Boolean(editingRuleId.value));

const isFormValid = computed(() => {
  return (
    formState.value.ipRange.trim().length > 0 &&
    String(formState.value.riskScore).trim().length > 0
  );
});

const showIpRangeRequired = computed(() => {
  return (
    (touched.value.ipRange || submitAttempted.value) &&
    formState.value.ipRange.trim().length === 0
  );
});

const showRiskRequired = computed(() => {
  return (
    (touched.value.riskScore || submitAttempted.value) &&
    String(formState.value.riskScore).trim().length === 0
  );
});

const resetForm = () => {
  formState.value = {
    ipRange: "",
    riskScore: "",
    category: "Botnet",
    behavior: "Deny",
    enabled: true
  };
  touched.value = {
    ipRange: false,
    riskScore: false
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
    ipRange: rule.ipRange,
    riskScore: rule.riskScore,
    category: rule.category,
    behavior: rule.behavior,
    enabled: rule.enabled
  };
  touched.value = {
    ipRange: false,
    riskScore: false
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
  const payload = {
    ipRange: formState.value.ipRange.trim(),
    riskScore: Number(formState.value.riskScore),
    category: formState.value.category,
    behavior: formState.value.behavior,
    enabled: formState.value.enabled
  };
  if (editingRuleId.value) {
    const index = ipRepRules.value.findIndex((rule) => rule.id === editingRuleId.value);
    if (index !== -1) {
      ipRepRules.value[index] = { ...ipRepRules.value[index], ...payload };
    }
  } else {
    ipRepRules.value.unshift({
      id: `rule-${Date.now()}`,
      ...payload
    });
  }
  closeDialog();
};

const editIpRepRule = (rule) => {
  openEditDialog(rule);
};

const deleteIpRepRule = (rule) => {
  deleteTarget.value = rule;
};

const closeDeleteDialog = () => {
  deleteTarget.value = null;
};

const confirmDeleteRule = () => {
  if (!deleteTarget.value) return;
  ipRepRules.value = ipRepRules.value.filter((rule) => rule.id !== deleteTarget.value.id);
  deleteTarget.value = null;
  selectedRuleIds.value = selectedRuleIds.value.filter((id) =>
    ipRepRules.value.some((rule) => rule.id === id)
  );
};

const openBatchConfirm = () => {
  if (!selectedRuleIds.value.length) return;
  isBatchConfirmOpen.value = true;
};

const closeBatchConfirm = () => {
  isBatchConfirmOpen.value = false;
};

const confirmBatchRemove = () => {
  if (!selectedRuleIds.value.length) return;
  ipRepRules.value = ipRepRules.value.filter(
    (rule) => !selectedRuleIds.value.includes(rule.id)
  );
  selectedRuleIds.value = [];
  isBatchConfirmOpen.value = false;
};
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
