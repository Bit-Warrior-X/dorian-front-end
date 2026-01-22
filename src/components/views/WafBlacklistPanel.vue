<template>
  <div class="waf-section-card">
    <div class="waf-section-header">
      <div>
        <h4>Blacklist</h4>
        <p class="waf-section-desc">
          Block abusive sources and URLs before they reach your applications.
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
            <th>Behavior</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in blacklistRules" :key="rule.id">
            <td class="checkbox-col">
              <input
                type="checkbox"
                class="row-checkbox"
                :value="rule.id"
                v-model="selectedRuleIds"
                aria-label="Select blacklist rule"
              />
            </td>
            <td>{{ rule.url }}</td>
            <td>{{ rule.method }}</td>
            <td>{{ rule.ips }}</td>
            <td>{{ rule.behavior }}</td>
            <td>{{ rule.description }}</td>
            <td class="action-cell">
              <button
                type="button"
                class="icon-action-btn"
                aria-label="Edit rule"
                @click="editBlacklistRule(rule)"
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
                @click="deleteBlacklistRule(rule)"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M6.5 3.5h7l.5 1H18v1.5H2V4.5h4l.5-1Zm1 4h1.5v7H7.5v-7Zm3 0H12v7h-1.5v-7Zm-6 0H6v7H4.5v-7Zm11.5 0H15v7h1.5v-7ZM5 17h10a1 1 0 0 0 1-1V7H4v9a1 1 0 0 0 1 1Z"
                  />
                </svg>
              </button>
            </td>
          </tr>
          <tr v-if="!blacklistRules.length">
            <td colspan="7" class="empty-cell">No blacklist rules yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="isDialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-label="Add blacklist rule">
        <div class="dialog-header">
          <h4>Add Blacklist Rule</h4>
          <button type="button" class="icon-btn" @click="closeDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label for="blacklist-ips">
              Black IP Lists <span class="required">*</span>
            </label>
            <div class="field-control">
              <textarea
                id="blacklist-ips"
                v-model="formState.ipList"
                class="form-input"
                rows="4"
                placeholder="127.0.0.1&#10;127.0.0.1/24"
                @blur="touched.ipList = true"
              ></textarea>
              <p class="field-help">
                Accept Network Segment, Ex:127.0.0.1,127.0.0.1/24 Accept Adding Multiple IP With
                Line Break
              </p>
              <p v-if="showIpRequired" class="field-error">This field is required</p>
            </div>
          </div>
          <div class="form-field">
            <label for="blacklist-url">
              URL <span class="required">*</span>
            </label>
            <div class="field-control">
              <input
                id="blacklist-url"
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
            <label for="blacklist-desc">
              Description
            </label>
            <div class="field-control">
              <textarea
                id="blacklist-desc"
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
          <button type="button" class="primary-btn" :disabled="isSubmitDisabled" @click="saveRule">
            {{ isEditing ? "Update Rule" : "Save Rule" }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="deleteTarget" class="dialog-overlay" @click.self="closeDeleteDialog">
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Delete blacklist rule">
        <div class="dialog-header">
          <h4>Delete Rule</h4>
          <button type="button" class="icon-btn" @click="closeDeleteDialog" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete this blacklist rule?
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
      <div class="dialog-card dialog-confirm" role="dialog" aria-modal="true" aria-label="Batch delete blacklist rules">
        <div class="dialog-header">
          <h4>Batch Removal</h4>
          <button type="button" class="icon-btn" @click="closeBatchConfirm" aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div class="dialog-body">
          <p class="confirm-text">
            Are you sure you want to delete the selected blacklist rules?
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
  fetchBlacklistRules,
  createBlacklistRule,
  updateBlacklistRule,
  deleteBlacklistRule as deleteBlacklistRuleApi,
  deleteBlacklistRules
} from "@/api/wafBlacklist";
import { useNotifications } from "@/stores/notifications";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const notifications = useNotifications();
const blacklistRules = ref([]);

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
  behavior: "Deny",
  description: ""
});

const hasSelection = computed(() => selectedRuleIds.value.length > 0);
const isSubmitDisabled = computed(() => !props.serverId || !isFormValid.value);

const isFormValid = computed(() => {
  return (
    formState.value.ipList.trim().length > 0 &&
    formState.value.url.trim().length > 0 &&
    formState.value.methods.length > 0 &&
    formState.value.behavior.trim().length > 0
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
    behavior: "Deny",
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
  const methods =
    normalizedMethod.toLowerCase() === "any" ? [...methodOptions] : parsedMethods;
  formState.value = {
    ipList: rule.ips.split(",").map((ip) => ip.trim()).join("\n"),
    url: rule.url,
    methods,
    behavior: toDisplayBehavior(rule.behavior) || "Deny",
    description: rule.description
  };
  originalForm.value = JSON.stringify({
    ipList: formState.value.ipList.trim(),
    url: formState.value.url.trim(),
    methods: [...formState.value.methods].sort(),
    behavior: formState.value.behavior,
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
    behavior: toApiBehavior(formState.value.behavior),
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
const editBlacklistRule = (rule) => {
  openEditDialog(rule);
};
const deleteBlacklistRule = (rule) => {
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
    ipList: payload.ips.trim(),
    url: payload.url.trim(),
    methods: payload.method.split(",").map((value) => value.trim()).filter(Boolean).sort(),
    behavior: toDisplayBehavior(payload.behavior),
    description: payload.description.trim()
  });
  return current !== originalForm.value;
};

const loadRules = async () => {
  if (!props.serverId) {
    blacklistRules.value = [];
    return;
  }
  try {
    const data = await fetchBlacklistRules(props.serverId);
    const list = Array.isArray(data) ? data : [];
    blacklistRules.value = list.map((rule) => ({
      ...rule,
      behavior: toDisplayBehavior(rule.behavior)
    }));
  } catch {
    blacklistRules.value = [];
  }
};

const createRule = async (payload) => {
  try {
    await createBlacklistRule(props.serverId, payload);
    await loadRules();
    notifications.enqueue("Blacklist rule created.", "success");
    closeDialog();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to create blacklist rule.", "error");
  }
};

const updateRule = async (payload) => {
  try {
    await updateBlacklistRule(props.serverId, editingRuleId.value, payload);
    await loadRules();
    notifications.enqueue("Blacklist rule updated.", "success");
    closeDialog();
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to update blacklist rule.", "error");
  }
};

const handleDeleteRule = async () => {
  try {
    await deleteBlacklistRuleApi(props.serverId, deleteTarget.value.id);
    await loadRules();
    notifications.enqueue("Blacklist rule deleted.", "success");
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to delete blacklist rule.", "error");
  } finally {
    deleteTarget.value = null;
    selectedRuleIds.value = selectedRuleIds.value.filter((id) =>
      blacklistRules.value.some((rule) => rule.id === id)
    );
  }
};

const handleBatchRemove = async () => {
  try {
    await deleteBlacklistRules(props.serverId, selectedRuleIds.value);
    await loadRules();
    notifications.enqueue("Blacklist rules removed.", "success");
  } catch (error) {
    notifications.enqueue(error?.message || "Failed to remove blacklist rules.", "error");
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
  min-width: 640px;
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

.field-control .field-help,
.field-control .field-error {
  margin-top: 0;
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
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.7);
  font-size: 0.9rem;
  color: #1f2937;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
