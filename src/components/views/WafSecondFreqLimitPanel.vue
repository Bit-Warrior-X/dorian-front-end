<template>
  <div class="waf-section-card">
    <div class="waf-section-header">
      <div>
        <h4>Second Freq Limit</h4>
        <p class="waf-section-desc">
          Calculate request rate per second and block requests exceeding the threshold.
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
            <th>Request Count</th>
            <th>Burst</th>
            <th>Behavior</th>
            <th>Enable/Disable</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in secondRules" :key="rule.id">
            <td class="checkbox-col">
              <input
                type="checkbox"
                class="row-checkbox"
                :value="rule.id"
                v-model="selectedRuleIds"
                aria-label="Select second freq limit rule"
              />
            </td>
            <td>{{ rule.url }}</td>
            <td>{{ rule.count }}</td>
            <td>{{ rule.burst }}</td>
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
                @click="editSecondRule(rule)"
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
                @click="deleteSecondRule(rule)"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M6.5 3.5h7l.5 1H18v1.5H2V4.5h4l.5-1Zm1 4h1.5v7H7.5v-7Zm3 0H12v7h-1.5v-7Zm-6 0H6v7H4.5v-7Zm11.5 0H15v7h1.5v-7ZM5 17h10a1 1 0 0 0 1-1V7H4v9a1 1 0 0 0 1 1Z"
                  />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!secondRules.length">
            <td colspan="7" class="empty-cell">No second freq limit rules yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="isDialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-label="Add second freq limit rule">
        <div class="dialog-header">
          <h4>Add Second Freq Limit Rule</h4>
          <button type="button" class="icon-btn" @click="closeDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label for="second-url">
              URL <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="second-url"
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
            <label for="second-count">
              Request Count <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="second-count"
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
            <label for="second-burst">
              Burst <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="second-burst"
                v-model="formState.burst"
                type="number"
                min="0"
                class="form-input"
                @blur="touched.burst = true"
              />
              <p v-if="showBurstRequired" class="field-error">This field is required</p>
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
              Enable/Disable
            </label>
            <div class="field-control">
              <button
                type="button"
                class="toggle-switch"
                role="switch"
                :aria-checked="formState.enabled"
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
          <button type="button" class="primary-btn" :disabled="!isFormValid" @click="saveRule">
            {{ isEditing ? "Update Rule" : "Save Rule" }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="deleteTarget" class="dialog-overlay" @click.self="closeDeleteDialog">
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Delete second rule">
        <div class="dialog-header">
          <h4>Delete Rule</h4>
          <button type="button" class="icon-btn" @click="closeDeleteDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete this second freq limit rule?
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
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Batch delete second rules">
        <div class="dialog-header">
          <h4>Batch Removal</h4>
          <button type="button" class="icon-btn" @click="closeBatchConfirm" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete the selected second freq limit rules?
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

const secondRules = ref([
  {
    id: "rule-1",
    url: "/checkout",
    count: 120,
    burst: 30,
    behavior: "Drop",
    enabled: true
  },
  {
    id: "rule-2",
    url: "/api/v1/login",
    count: 50,
    burst: 10,
    behavior: "Deny",
    enabled: true
  },
  {
    id: "rule-3",
    url: "/api/v1/search",
    count: 200,
    burst: 40,
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
  url: false,
  count: false,
  burst: false
});
const formState = ref({
  url: "",
  count: "",
  burst: "",
  behavior: "Deny",
  enabled: true
});

const hasSelection = computed(() => selectedRuleIds.value.length > 0);
const isEditing = computed(() => Boolean(editingRuleId.value));

const isFormValid = computed(() => {
  return (
    formState.value.url.trim().length > 0 &&
    String(formState.value.count).trim().length > 0 &&
    String(formState.value.burst).trim().length > 0
  );
});

const showUrlRequired = computed(() => {
  return (
    (touched.value.url || submitAttempted.value) &&
    formState.value.url.trim().length === 0
  );
});

const showCountRequired = computed(() => {
  return (
    (touched.value.count || submitAttempted.value) &&
    String(formState.value.count).trim().length === 0
  );
});

const showBurstRequired = computed(() => {
  return (
    (touched.value.burst || submitAttempted.value) &&
    String(formState.value.burst).trim().length === 0
  );
});

const resetForm = () => {
  formState.value = {
    url: "",
    count: "",
    burst: "",
    behavior: "Deny",
    enabled: true
  };
  touched.value = {
    url: false,
    count: false,
    burst: false
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
    count: rule.count,
    burst: rule.burst,
    behavior: rule.behavior,
    enabled: rule.enabled
  };
  touched.value = {
    url: false,
    count: false,
    burst: false
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
    url: formState.value.url.trim(),
    count: Number(formState.value.count),
    burst: Number(formState.value.burst),
    behavior: formState.value.behavior,
    enabled: formState.value.enabled
  };
  if (editingRuleId.value) {
    const index = secondRules.value.findIndex((rule) => rule.id === editingRuleId.value);
    if (index !== -1) {
      secondRules.value[index] = { ...secondRules.value[index], ...payload };
    }
  } else {
    secondRules.value.unshift({
      id: `rule-${Date.now()}`,
      ...payload
    });
  }
  closeDialog();
};

const editSecondRule = (rule) => {
  openEditDialog(rule);
};

const deleteSecondRule = (rule) => {
  deleteTarget.value = rule;
};

const closeDeleteDialog = () => {
  deleteTarget.value = null;
};

const confirmDeleteRule = () => {
  if (!deleteTarget.value) return;
  secondRules.value = secondRules.value.filter((rule) => rule.id !== deleteTarget.value.id);
  deleteTarget.value = null;
  selectedRuleIds.value = selectedRuleIds.value.filter((id) =>
    secondRules.value.some((rule) => rule.id === id)
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
  secondRules.value = secondRules.value.filter(
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
  color: #1f2937;
}

.waf-section-desc {
  margin: 6px 0 0 0;
  color: #64748b;
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(37, 99, 235, 0.3);
}

.danger-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 18px rgba(239, 68, 68, 0.25);
}

.danger-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(239, 68, 68, 0.3);
}

.danger-btn:disabled {
  opacity: 0.5;
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

.secondary-btn:hover {
  background: rgba(148, 163, 184, 0.12);
}

.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.waf-table-wrapper {
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
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
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  color: #1f2937;
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
  color: #64748b;
  background: rgba(248, 250, 252, 0.8);
}

.waf-table tr:last-child td {
  border-bottom: none;
}

.action-cell {
  display: flex;
  gap: 10px;
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.icon-action-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.icon-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(37, 99, 235, 0.15);
}

.icon-action-btn.danger {
  color: #dc2626;
}

.empty-cell {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  background: rgba(148, 163, 184, 0.18);
}

.status-pill.on {
  color: #15803d;
  background: rgba(34, 197, 94, 0.18);
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
  width: min(720px, 100%);
  max-height: 80vh;
  background: #fff;
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
  overflow-y: auto;
  padding-right: 6px;
}

.confirm-text {
  margin: 0;
  color: #475569;
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
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  resize: vertical;
}

.form-input:focus {
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.field-help {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
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
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #fff;
  color: #475569;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-btn.active {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.5);
  color: #1d4ed8;
}

.toggle-switch {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  align-self: flex-start;
}

.toggle-track {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  width: 148px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.12);
  padding: 0 8px;
  overflow: hidden;
}

.toggle-track.off {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.toggle-label {
  z-index: 2;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  white-space: nowrap;
  text-transform: uppercase;
}

.toggle-label.off {
  color: rgba(255, 255, 255, 0.7);
}

.toggle-knob {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 68px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  transition: transform 0.2s ease;
  z-index: 1;
}

.toggle-knob.on {
  transform: translateX(72px);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
