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
import { ref, computed } from "vue";

const whitelistRules = ref([
  {
    id: "rule-1",
    url: "/api/v1/health",
    method: "GET",
    ips: "203.0.113.10, 203.0.113.11",
    description: "Allow monitoring probes."
  },
  {
    id: "rule-2",
    url: "/login",
    method: "POST",
    ips: "198.51.100.8",
    description: "Trusted SSO gateway."
  },
  {
    id: "rule-3",
    url: "/webhooks/*",
    method: "HEAD",
    ips: "192.0.2.45",
    description: "Partner webhook checks."
  },
  {
    id: "rule-4",
    url: "/api/v1/status",
    method: "GET",
    ips: "198.51.100.20",
    description: "Status endpoint checks."
  },
  {
    id: "rule-5",
    url: "/api/v1/billing/*",
    method: "POST",
    ips: "203.0.113.44, 203.0.113.45",
    description: "Billing provider callbacks."
  },
  {
    id: "rule-6",
    url: "/assets/*",
    method: "GET",
    ips: "0.0.0.0/0",
    description: "Public asset delivery."
  },
  {
    id: "rule-7",
    url: "/auth/token",
    method: "POST",
    ips: "192.0.2.88",
    description: "Internal token service."
  },
  {
    id: "rule-8",
    url: "/reports/*",
    method: "GET",
    ips: "198.51.100.77",
    description: "Reporting exports."
  },
  {
    id: "rule-9",
    url: "/api/v1/search",
    method: "GET",
    ips: "203.0.113.101",
    description: "Search engine crawler."
  },
  {
    id: "rule-10",
    url: "/checkout",
    method: "POST",
    ips: "198.51.100.5",
    description: "Payment gateway."
  },
  {
    id: "rule-11",
    url: "/notifications/*",
    method: "PUT",
    ips: "203.0.113.77",
    description: "Notification provider."
  },
  {
    id: "rule-12",
    url: "/api/v1/users/*",
    method: "PATCH",
    ips: "192.0.2.120",
    description: "Identity sync."
  },
  {
    id: "rule-13",
    url: "/files/upload",
    method: "POST",
    ips: "198.51.100.33",
    description: "Trusted uploader."
  },
  {
    id: "rule-14",
    url: "/api/v1/metrics",
    method: "GET",
    ips: "203.0.113.200",
    description: "Metrics scrape."
  },
  {
    id: "rule-15",
    url: "/api/v1/audit/*",
    method: "GET",
    ips: "192.0.2.150",
    description: "Audit logs."
  }
]);

const selectedRuleIds = ref([]);

const methodOptions = ["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH", "OPTIONS"];
const isDialogOpen = ref(false);
const submitAttempted = ref(false);
const editingRuleId = ref(null);
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
    formState.value.description.trim().length > 0
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
  formState.value = {
    ipList: rule.ips.split(",").map((ip) => ip.trim()).join("\n"),
    url: rule.url,
    methods: rule.method.split(",").map((value) => value.trim()).filter(Boolean),
    description: rule.description
  };
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
    method: formState.value.methods.length ? formState.value.methods.join(", ") : "Any",
    ips: ipString || formState.value.ipList.trim(),
    description: formState.value.description.trim()
  };
  if (editingRuleId.value) {
    const index = whitelistRules.value.findIndex((rule) => rule.id === editingRuleId.value);
    if (index !== -1) {
      whitelistRules.value[index] = { ...whitelistRules.value[index], ...payload };
    }
  } else {
    whitelistRules.value.unshift({
      id: `rule-${Date.now()}`,
      ...payload
    });
  }
  closeDialog();
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
  if (!deleteTarget.value) return;
  whitelistRules.value = whitelistRules.value.filter((rule) => rule.id !== deleteTarget.value.id);
  deleteTarget.value = null;
  selectedRuleIds.value = selectedRuleIds.value.filter((id) =>
    whitelistRules.value.some((rule) => rule.id === id)
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
  whitelistRules.value = whitelistRules.value.filter(
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

.danger-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 8px 18px rgba(239, 68, 68, 0.25);
}
</style>
