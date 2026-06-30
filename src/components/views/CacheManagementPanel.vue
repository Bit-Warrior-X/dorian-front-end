<template>
  <div class="cache-panel">
    <div class="waf-section-header">
      <div>
        <h4>Cache Management</h4>
        <p class="waf-section-desc">Configure L7 cache rules for static files and URL patterns on this edge.</p>
      </div>
      <div class="header-actions">
        <button class="primary-btn" type="button" @click="openAddDialog">Add Rule</button>
        <button class="primary-btn danger-btn" type="button" @click="openClearCacheConfirm">Clear Cache</button>
        <button class="primary-btn danger-btn" type="button" @click="openClearUrlCacheDialog">Clear URL Cache</button>
      </div>
    </div>

    <div class="content-card list-card">
      <div class="list-header">
        <h4>Cache Rules</h4>
        <button class="ghost-btn" type="button" @click="refreshRules">Refresh</button>
      </div>
      <div class="table-wrap">
        <table class="cache-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Rule Name</th>
              <th>Target</th>
              <th>Cache Time</th>
              <th>Cache Slice</th>
              <th>Priority</th>
              <th>Without Parameter</th>
              <th>Force Caching</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in formattedRules" :key="rule.id">
              <td>
                <span
                  class="status-dot"
                  :class="rule.statusClass"
                  :aria-label="rule.statusLabel"
                  role="img"
                ></span>
              </td>
              <td>{{ rule.ruleName }}</td>
              <td class="target-cell">
                <span v-if="rule.ruleType === 'url'" class="target-url">{{ rule.url || "—" }}</span>
                <div v-else-if="rule.targetFileTypes.length" class="target-badges">
                  <span
                    v-for="ext in rule.targetFileTypes"
                    :key="`${rule.id}-${ext}`"
                    class="target-badge"
                  >
                    {{ ext }}
                  </span>
                </div>
                <span v-else>—</span>
              </td>
              <td>{{ rule.cachingTime }}s</td>
              <td>{{ rule.cacheSliceLabel }}</td>
              <td>{{ rule.priority }}</td>
              <td class="mark-cell">
                <span
                  class="bool-check"
                  :class="{ active: rule.withoutParameterActive }"
                  :aria-label="rule.withoutParameterActive ? 'Yes' : 'No'"
                  role="img"
                >
                  <svg
                    v-if="rule.withoutParameterActive"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span v-else class="bool-check-empty">—</span>
                </span>
              </td>
              <td class="mark-cell">
                <span
                  class="bool-check"
                  :class="{ active: rule.forceCachingActive }"
                  :aria-label="rule.forceCachingActive ? 'Yes' : 'No'"
                  role="img"
                >
                  <svg
                    v-if="rule.forceCachingActive"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span v-else class="bool-check-empty">—</span>
                </span>
              </td>
              <td class="action-cell">
                <button
                  type="button"
                  class="icon-action-btn"
                  aria-label="Edit rule"
                  title="Edit"
                  @click="openEditDialog(rule)"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      d="M13.75 2.5a1.77 1.77 0 0 1 1.25.52l1.98 1.98c.33.33.52.78.52 1.25s-.19.92-.52 1.25l-8.9 8.9a1.8 1.8 0 0 1-1.02.5l-3.55.5a.75.75 0 0 1-.85-.85l.5-3.55a1.8 1.8 0 0 1 .5-1.02l8.9-8.9c.33-.33.78-.52 1.25-.52Zm0 1.5a.27.27 0 0 0-.19.08l-8.9 8.9a.3.3 0 0 0-.08.16l-.36 2.52 2.52-.36a.3.3 0 0 0 .16-.08l8.9-8.9a.27.27 0 0 0 .08-.19.27.27 0 0 0-.08-.19l-1.98-1.98a.27.27 0 0 0-.19-.08Z"
                    />
                  </svg>
                </button>
                <button
                  class="icon-action-btn danger"
                  type="button"
                  aria-label="Remove"
                  title="Remove"
                  @click="openRemoveConfirm(rule)"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      d="M6.5 3.5h7l.5 1H18v1.5H2V4.5h4l.5-1Zm1 4h1.5v7H7.5v-7Zm3 0H12v7h-1.5v-7Zm-6 0H6v7H4.5v-7Zm11.5 0H15v7h1.5v-7ZM5 17h10a1 1 0 0 0 1-1V7H4v9a1 1 0 0 0 1 1Z"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!cacheRules.length" class="empty-state">
          No cache rules configured yet.
        </div>
      </div>
    </div>

    <div v-if="isDialogOpen" class="dialog-backdrop" @click="closeDialog">
      <div class="dialog-card cache-dialog" @click.stop>
        <div class="dialog-header">
          <h4>{{ isEditing ? "Edit Cache" : "Add Cache" }}</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="cache-form" @click="closeFileTypeDropdown">
          <div class="cache-form-row">
            <label class="cache-form-label required">CacheType:</label>
            <div class="cache-form-control">
              <div class="segment-toggle">
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: newRule.ruleType === 'file' }"
                  @click="newRule.ruleType = 'file'"
                >
                  File Types
                </button>
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: newRule.ruleType === 'url' }"
                  @click="newRule.ruleType = 'url'"
                >
                  URL
                </button>
              </div>
            </div>
          </div>

          <div class="cache-form-row">
            <label class="cache-form-label required" for="cache-rule-name">Rule Name:</label>
            <div class="cache-form-control">
              <input
                id="cache-rule-name"
                v-model="newRule.ruleName"
                class="cache-input"
                type="text"
                placeholder="cache_1"
              />
              <p v-if="nameConflictMessage" class="field-error">{{ nameConflictMessage }}</p>
            </div>
          </div>

          <div class="cache-form-row">
            <label class="cache-form-label" for="cache-caching-time">Caching Time:</label>
            <div class="cache-form-control">
              <div class="input-with-unit">
                <input
                  id="cache-caching-time"
                  v-model="newRule.cachingTime"
                  class="cache-input cache-input--compact"
                  type="number"
                  min="0"
                  placeholder="60"
                />
                <span class="input-unit">Second</span>
              </div>
              <p class="field-hint">0 seconds means no caching, and no caching is done by default</p>
            </div>
          </div>

          <div v-if="newRule.ruleType === 'file'" class="cache-form-row">
            <label class="cache-form-label required" for="cache-file-types">File Types:</label>
            <div class="cache-form-control">
              <div class="combobox combobox--tags" @click.stop="toggleFileTypeDropdown">
                <div class="combobox-input-wrap" @click.stop="openFileTypeDropdown">
                  <div v-if="selectedFileTypes.length" class="selected-file-types-inline">
                    <span
                      v-for="ext in selectedFileTypes"
                      :key="ext"
                      class="file-type-tag"
                    >
                      {{ ext }}
                      <button
                        type="button"
                        class="file-type-tag-remove"
                        aria-label="Remove file type"
                        @click.stop="toggleFileType(ext)"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                  <input
                    id="cache-file-types"
                    v-model="fileTypeSearch"
                    class="combobox-inline-input"
                    type="text"
                    placeholder="Select file types"
                    @focus="openFileTypeDropdown"
                    @click.stop
                  />
                  <span class="combobox-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </div>
                <div v-show="isFileTypeDropdownOpen" class="combobox-menu combobox-menu--grouped" @click.stop>
                  <template v-for="group in filteredFileTypeGroups" :key="group.id">
                    <div class="combobox-group-label">{{ group.label }}</div>
                    <button
                      v-for="ext in group.extensions"
                      :key="`${group.id}-${ext}`"
                      type="button"
                      class="combobox-option"
                      :class="{ selected: selectedFileTypes.includes(ext) }"
                      @click="toggleFileType(ext)"
                    >
                      <span class="combobox-check" aria-hidden="true">
                        <svg v-if="selectedFileTypes.includes(ext)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                      <span>{{ ext }}</span>
                    </button>
                  </template>
                  <div v-if="!hasFilteredFileTypes" class="combobox-empty">
                    No file types found
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="cache-form-row">
            <label class="cache-form-label required" for="cache-url">URL:</label>
            <div class="cache-form-control">
              <input
                id="cache-url"
                v-model="newRule.url"
                class="cache-input"
                type="text"
                placeholder="/static/*"
              />
            </div>
          </div>

          <div class="cache-form-row">
            <label class="cache-form-label" for="cache-priority">Priority:</label>
            <div class="cache-form-control">
              <input
                id="cache-priority"
                v-model="newRule.priority"
                class="cache-input cache-input--compact"
                type="number"
                min="0"
                placeholder="1000"
              />
              <p class="field-hint">The Higher Priority Value Is Preferred</p>
            </div>
          </div>

          <div class="cache-form-row">
            <label class="cache-form-label" for="cache-slice">Cache Slices:</label>
            <div class="cache-form-control">
              <div class="input-with-unit">
                <input
                  id="cache-slice"
                  v-model="newRule.cacheSlice"
                  class="cache-input cache-input--compact"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="300"
                />
                <span class="input-unit">MB</span>
              </div>
              <p class="field-hint">0 means not set</p>
            </div>
          </div>

          <div class="cache-form-row cache-form-row--checkbox">
            <div class="cache-form-control cache-form-control--full">
              <label class="checkbox-option" for="cache-without-parameter">
                <input
                  id="cache-without-parameter"
                  v-model="withoutParameterChecked"
                  type="checkbox"
                />
                <span>Without Parameter</span>
              </label>
            </div>
          </div>

          <div class="cache-form-row">
            <label class="cache-form-label cache-form-label--with-help">
              Cache Mode
              <span
                class="help-icon"
                title="Follow Origin respects origin cache headers. Force Caching caches responses regardless of origin headers."
              >
                ?
              </span>
            </label>
            <div class="cache-form-control">
              <div class="segment-toggle">
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: newRule.cacheMode === 'origin' }"
                  @click="newRule.cacheMode = 'origin'"
                >
                  Follow Origin
                </button>
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: newRule.cacheMode === 'force' }"
                  @click="newRule.cacheMode = 'force'"
                >
                  Force Caching
                </button>
              </div>
            </div>
          </div>

          <div class="cache-form-row">
            <label class="cache-form-label">Status:</label>
            <div class="cache-form-control">
              <div class="segment-toggle">
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: newRule.status === 'ENABLE' }"
                  @click="newRule.status = 'ENABLE'"
                >
                  Enable
                </button>
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: newRule.status === 'DISABLE' }"
                  @click="newRule.status = 'DISABLE'"
                >
                  Disable
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeDialog">Cancel</button>
          <button class="primary-btn" type="button" :disabled="!canSaveRule" @click="saveRule">
            {{ isEditing ? "Edit" : "Add" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="isClearUrlCacheDialogOpen" class="dialog-backdrop" @click="closeClearUrlCacheDialog">
      <div class="dialog-card cache-dialog" @click.stop>
        <div class="dialog-header">
          <h4>Clear URL Cache</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeClearUrlCacheDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="cache-form">
          <div class="cache-form-row">
            <label class="cache-form-label required">Match Type:</label>
            <div class="cache-form-control">
              <div class="segment-toggle">
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: clearUrlCacheForm.matchType === 'prefix' }"
                  @click="clearUrlCacheForm.matchType = 'prefix'"
                >
                  Prefix Match
                </button>
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: clearUrlCacheForm.matchType === 'exact' }"
                  @click="clearUrlCacheForm.matchType = 'exact'"
                >
                  Exact Match
                </button>
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: clearUrlCacheForm.matchType === 'advanced' }"
                  @click="clearUrlCacheForm.matchType = 'advanced'"
                >
                  Advanced Match
                </button>
              </div>
            </div>
          </div>

          <div class="cache-form-row">
            <label class="cache-form-label required" for="clear-url-match-content">Match Content:</label>
            <div class="cache-form-control">
              <input
                id="clear-url-match-content"
                v-model="clearUrlCacheForm.matchContent"
                class="cache-input"
                type="text"
                placeholder="https://www.cdnray.com/"
              />
            </div>
          </div>

          <div class="cache-form-row">
            <label class="cache-form-label">Description:</label>
            <div class="cache-form-control">
              <p class="field-hint url-cache-match-desc">{{ clearUrlCacheMatchDescriptionText }}</p>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeClearUrlCacheDialog">Cancel</button>
          <button
            class="primary-btn danger-btn"
            type="button"
            :disabled="!canClearUrlCache"
            @click="submitClearUrlCache"
          >
            Clear URL Cache
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model="isConfirmDialogOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmActionText"
      cancel-text="Cancel"
      @confirm="handleConfirmAction"
      @cancel="clearConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import ConfirmDialog from "../ConfirmDialog.vue";
import {
  fetchCacheRules,
  createCacheRule,
  updateCacheRule,
  deleteCacheRule as deleteCacheRuleApi,
  clearCache,
  clearUrlCache
} from "@/api/cacheRules";
import { notifyError, notifySuccess } from "@/utils/notify";

const CACHE_TITLE = "Cache Management";

const URL_CACHE_MATCH_DESCRIPTIONS = {
  prefix: [
    "Format: Must start with http:// or https:// and end with /",
    "Example : https://www.cdnray.com/"
  ],
  exact: ["Format : Must start with http:// or https://"],
  advanced: [
    "Format: Supports multi-character wildcard matching *.",
    "Example : Specify specific domains and specific URIs containing 'api'",
    "www.cdnray.com/*/api/*"
  ]
};

const defaultClearUrlCacheForm = () => ({
  matchType: "prefix",
  matchContent: ""
});

const FILE_TYPE_GROUPS = [
  {
    id: "image",
    label: "Image",
    extensions: ["gif", "png", "jpg", "jpeg", "bmp"]
  },
  {
    id: "page",
    label: "Page",
    extensions: ["html", "htm", "shtml", "js", "css", "wolf"]
  },
  {
    id: "audio-video",
    label: "Audio / Video",
    extensions: ["mp3", "wma", "flv", "mp4", "wmv"]
  },
  {
    id: "file",
    label: "File",
    extensions: ["ipa", "apk"]
  }
];

const ALL_FILE_TYPES = FILE_TYPE_GROUPS.flatMap((group) => group.extensions);

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const cacheRules = ref([]);
const isDialogOpen = ref(false);
const editingRuleId = ref(null);
const isConfirmDialogOpen = ref(false);
const confirmKind = ref("remove");
const confirmTargetId = ref(null);
const confirmTargetLabel = ref("");
const isClearUrlCacheDialogOpen = ref(false);
const clearUrlCacheForm = ref(defaultClearUrlCacheForm());

const defaultRuleForm = () => ({
  ruleName: "",
  ruleType: "file",
  cachingTime: "60",
  url: "",
  priority: "1000",
  cacheSlice: "300",
  cacheMode: "origin",
  status: "ENABLE"
});

const newRule = ref(defaultRuleForm());
const selectedFileTypes = ref([]);
const fileTypeSearch = ref("");
const isFileTypeDropdownOpen = ref(false);
const withoutParameterChecked = ref(false);

const isEditing = computed(() => editingRuleId.value != null);

const clearUrlCacheMatchDescription = computed(
  () => URL_CACHE_MATCH_DESCRIPTIONS[clearUrlCacheForm.value.matchType] || []
);

const clearUrlCacheMatchDescriptionText = computed(() =>
  clearUrlCacheMatchDescription.value.join("\n")
);

const canClearUrlCache = computed(() => clearUrlCacheForm.value.matchContent.trim() !== "");

const parseFileTypes = (fileTypes) =>
  String(fileTypes || "")
    .split(/[,;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .sort((a, b) => ALL_FILE_TYPES.indexOf(a) - ALL_FILE_TYPES.indexOf(b));

const formatCacheSliceMB = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "—";
  return `${parseFloat(num.toFixed(4))} MB`;
};

const normalizeRuleName = (name) => String(name || "").trim().toLowerCase();

const filteredFileTypeGroups = computed(() => {
  const query = fileTypeSearch.value.trim().toLowerCase();
  if (!query) {
    return FILE_TYPE_GROUPS;
  }
  return FILE_TYPE_GROUPS.map((group) => ({
    ...group,
    extensions: group.extensions.filter(
      (ext) => ext.includes(query) || group.label.toLowerCase().includes(query)
    )
  })).filter((group) => group.extensions.length > 0);
});

const hasFilteredFileTypes = computed(() =>
  filteredFileTypeGroups.value.some((group) => group.extensions.length > 0)
);

const nameConflictMessage = computed(() => {
  const normalized = normalizeRuleName(newRule.value.ruleName);
  if (!normalized) return "";

  const duplicate = cacheRules.value.some(
    (rule) =>
      normalizeRuleName(rule.ruleName) === normalized &&
      rule.id !== editingRuleId.value
  );
  if (!duplicate) return "";

  return `Cache rule ${newRule.value.ruleName.trim()} already exists.`;
});

const canSaveRule = computed(() => {
  if (!newRule.value.ruleName.trim()) return false;
  if (nameConflictMessage.value) return false;
  if (newRule.value.ruleType === "file" && selectedFileTypes.value.length === 0) return false;
  if (newRule.value.ruleType === "url" && !newRule.value.url.trim()) return false;
  return true;
});

const formattedRules = computed(() =>
  cacheRules.value.map((rule) => ({
    ...rule,
    statusLabel: rule.status === "ENABLE" ? "Active" : "Inactive",
    statusClass: rule.status === "ENABLE" ? "active" : "inactive",
    withoutParameterActive:
      String(rule.withoutParameter || "").trim().toLowerCase() === "yes",
    forceCachingActive: rule.cacheMode === "force",
    cacheSliceLabel: formatCacheSliceMB(rule.cacheSlice),
    targetFileTypes:
      rule.ruleType === "url" ? [] : parseFileTypes(rule.fileTypes)
  }))
);

const suggestRuleName = () => {
  const next = cacheRules.value.length + 1;
  return `cache_${next}`;
};

const toggleFileType = (ext) => {
  const index = selectedFileTypes.value.indexOf(ext);
  if (index >= 0) {
    selectedFileTypes.value = selectedFileTypes.value.filter((item) => item !== ext);
    return;
  }
  selectedFileTypes.value = [...selectedFileTypes.value, ext].sort(
    (a, b) => ALL_FILE_TYPES.indexOf(a) - ALL_FILE_TYPES.indexOf(b)
  );
};

const openFileTypeDropdown = () => {
  isFileTypeDropdownOpen.value = true;
};

const toggleFileTypeDropdown = () => {
  isFileTypeDropdownOpen.value = !isFileTypeDropdownOpen.value;
};

const closeFileTypeDropdown = () => {
  isFileTypeDropdownOpen.value = false;
};

const resetDialogState = () => {
  editingRuleId.value = null;
  newRule.value = defaultRuleForm();
  selectedFileTypes.value = [];
  fileTypeSearch.value = "";
  isFileTypeDropdownOpen.value = false;
  withoutParameterChecked.value = false;
};

const openAddDialog = () => {
  resetDialogState();
  newRule.value = {
    ...defaultRuleForm(),
    ruleName: suggestRuleName()
  };
  isDialogOpen.value = true;
};

const openEditDialog = (rule) => {
  resetDialogState();
  editingRuleId.value = rule.id;
  newRule.value = {
    ruleName: rule.ruleName || "",
    ruleType: rule.ruleType === "url" ? "url" : "file",
    cachingTime: String(rule.cachingTime ?? 0),
    url: rule.url || "",
    priority: String(rule.priority ?? 0),
    cacheSlice: String(rule.cacheSlice ?? 0),
    cacheMode: rule.cacheMode === "force" ? "force" : "origin",
    status: rule.status === "DISABLE" ? "DISABLE" : "ENABLE"
  };
  selectedFileTypes.value =
    newRule.value.ruleType === "file" ? parseFileTypes(rule.fileTypes) : [];
  withoutParameterChecked.value =
    String(rule.withoutParameter || "").trim().toLowerCase() === "yes";
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
  resetDialogState();
};

const parseNumberField = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseFloatField = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildPayload = () => ({
  ruleName: newRule.value.ruleName.trim(),
  ruleType: newRule.value.ruleType,
  cachingTime: parseNumberField(newRule.value.cachingTime, 0),
  url: newRule.value.url.trim(),
  fileTypes: selectedFileTypes.value.join(", "),
  priority: parseNumberField(newRule.value.priority, 0),
  cacheSlice: parseFloatField(newRule.value.cacheSlice, 0),
  withoutParameter: withoutParameterChecked.value ? "yes" : "no",
  cacheMode: newRule.value.cacheMode,
  status: newRule.value.status === "DISABLE" ? "DISABLE" : "ENABLE"
});

const saveRule = async () => {
  if (!props.serverId || !canSaveRule.value) return;
  try {
    const payload = buildPayload();
    if (isEditing.value) {
      await updateCacheRule(props.serverId, editingRuleId.value, payload);
      notifySuccess(CACHE_TITLE, "The cache rule is successfully updated.");
    } else {
      await createCacheRule(props.serverId, payload);
      notifySuccess(CACHE_TITLE, "The cache rule is successfully created.");
    }
    await loadRules();
    closeDialog();
  } catch (error) {
    notifyError(
      CACHE_TITLE,
      error?.message ||
        (isEditing.value
          ? "The cache rule could not be updated."
          : "The cache rule could not be created.")
    );
  }
};

const removeRule = async (ruleId) => {
  if (!props.serverId) return;
  try {
    await deleteCacheRuleApi(props.serverId, ruleId);
    await loadRules();
    notifySuccess(CACHE_TITLE, "The cache rule is successfully removed.");
  } catch (error) {
    await loadRules();
    notifyError(CACHE_TITLE, error?.message || "The cache rule could not be removed.");
  }
};

const openRemoveConfirm = (rule) => {
  confirmKind.value = "remove";
  confirmTargetId.value = rule.id;
  confirmTargetLabel.value = rule.ruleName || `Rule #${rule.id}`;
  isConfirmDialogOpen.value = true;
};

const openClearCacheConfirm = () => {
  confirmKind.value = "clear-cache";
  confirmTargetId.value = null;
  confirmTargetLabel.value = "";
  isConfirmDialogOpen.value = true;
};

const openClearUrlCacheDialog = () => {
  clearUrlCacheForm.value = defaultClearUrlCacheForm();
  isClearUrlCacheDialogOpen.value = true;
};

const closeClearUrlCacheDialog = () => {
  isClearUrlCacheDialogOpen.value = false;
  clearUrlCacheForm.value = defaultClearUrlCacheForm();
};

const confirmTitle = computed(() => {
  if (confirmKind.value === "clear-cache") return "Clear cache";
  return "Remove cache rule";
});

const confirmMessage = computed(() => {
  if (confirmKind.value === "clear-cache") {
    return "Are you sure you want to clear all file cache on this edge?";
  }
  return confirmTargetLabel.value
    ? `Are you sure you want to remove ${confirmTargetLabel.value}?`
    : "Are you sure you want to remove this cache rule?";
});

const confirmActionText = computed(() => {
  if (confirmKind.value === "clear-cache") return "Clear Cache";
  return "Remove";
});

const handleConfirmAction = async () => {
  if (confirmKind.value === "clear-cache") {
    await handleClearCache();
  } else if (confirmTargetId.value) {
    await removeRule(confirmTargetId.value);
  }
  clearConfirm();
};

const handleClearCache = async () => {
  if (!props.serverId) return;
  try {
    await clearCache(props.serverId);
    notifySuccess(CACHE_TITLE, "File cache cleared successfully.");
  } catch (error) {
    notifyError(CACHE_TITLE, error?.message || "Failed to clear file cache.");
  }
};

const handleClearUrlCache = async () => {
  if (!props.serverId || !canClearUrlCache.value) return;
  try {
    await clearUrlCache(props.serverId, {
      matchType: clearUrlCacheForm.value.matchType,
      matchContent: clearUrlCacheForm.value.matchContent.trim()
    });
    notifySuccess(CACHE_TITLE, "URL cache cleared successfully.");
    closeClearUrlCacheDialog();
  } catch (error) {
    notifyError(CACHE_TITLE, error?.message || "Failed to clear URL cache.");
  }
};

const submitClearUrlCache = () => {
  void handleClearUrlCache();
};

const clearConfirm = () => {
  isConfirmDialogOpen.value = false;
  confirmKind.value = "remove";
  confirmTargetId.value = null;
  confirmTargetLabel.value = "";
};

const refreshRules = () => {
  void loadRules();
};

const loadRules = async () => {
  if (!props.serverId) {
    cacheRules.value = [];
    return;
  }
  try {
    const data = await fetchCacheRules(props.serverId);
    cacheRules.value = Array.isArray(data) ? data : [];
  } catch {
    cacheRules.value = [];
  }
};

onMounted(() => {
  void loadRules();
});

watch(
  () => props.serverId,
  () => {
    void loadRules();
  }
);

watch(
  () => newRule.value.ruleType,
  (ruleType) => {
    if (ruleType !== "file") {
      selectedFileTypes.value = [];
      fileTypeSearch.value = "";
      isFileTypeDropdownOpen.value = false;
    }
  }
);
</script>

<style scoped>
.cache-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 0;
}

.content-card {
  background: var(--app-surface-muted);
  border-radius: 14px;
  padding: 18px;
  border: 1px solid var(--app-border-strong);
}

.content-card h4 {
  margin: 0 0 14px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-heading);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.list-header h4 {
  margin: 0;
}

.helper-text {
  margin: 0 0 14px 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.field-error {
  margin: 6px 0 0;
  color: #b91c1c;
  font-size: 0.85rem;
}

.field-hint {
  margin: 6px 0 0;
  color: var(--app-text-muted);
  font-size: 0.82rem;
  line-height: 1.4;
}

.url-cache-match-desc {
  margin: 0;
  white-space: pre-line;
}

.cache-dialog {
  max-width: 760px;
}

.cache-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 8px;
}

.cache-form-row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.cache-form-row--checkbox {
  grid-template-columns: 1fr;
  padding-left: 150px;
}

.cache-form-label {
  font-size: 0.92rem;
  color: var(--app-text);
  font-weight: 500;
  padding-top: 10px;
  text-align: right;
}

.cache-form-label.required::before {
  content: "* ";
  color: #dc2626;
}

.cache-form-label--with-help {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid var(--app-border-strong);
  color: var(--app-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: help;
  flex-shrink: 0;
}

.cache-form-control {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.cache-form-control--full {
  grid-column: 1 / -1;
}

.cache-input {
  width: 100%;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: var(--app-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: var(--app-input-bg);
}

.cache-input--compact {
  width: 120px;
}

.cache-input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-unit {
  font-size: 0.92rem;
  color: var(--app-text-secondary);
  white-space: nowrap;
}

.segment-toggle {
  display: inline-flex;
  align-self: flex-start;
  flex-wrap: wrap;
  max-width: 100%;
  padding: 2px;
  gap: 2px;
  border: 1px solid var(--app-border-strong);
  border-radius: 6px;
  background: var(--app-surface-muted);
}

.segment-btn {
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--app-text-secondary);
  padding: 6px 12px;
  font-size: 0.88rem;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.segment-btn.active {
  background: #1e3a8a;
  color: #fff;
}

.combobox {
  position: relative;
}

.combobox--tags .combobox-input-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 42px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  padding: 6px 36px 6px 8px;
  background: var(--app-input-bg);
  cursor: text;
}

.combobox--tags .combobox-input-wrap:focus-within {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.selected-file-types-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.file-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #1e3a8a;
  color: #fff;
  border: 1px solid #1e3a8a;
  font-size: 0.85rem;
  line-height: 1.2;
}

.file-type-tag-remove {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.file-type-tag-remove:hover {
  color: #fff;
}

.combobox-inline-input {
  flex: 1 1 120px;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--app-text);
  padding: 4px 2px;
}

.combobox-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--app-text-muted);
}

.combobox--tags .combobox-arrow {
  top: 12px;
  transform: none;
}

.combobox-arrow svg {
  width: 16px;
  height: 16px;
}

.combobox-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  box-shadow: 0 12px 32px var(--app-shadow);
  padding: 6px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 50;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

.combobox-menu--grouped {
  padding-top: 4px;
}

.combobox-group-label {
  padding: 8px 12px 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
}

.combobox-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--app-text);
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
}

.combobox-option:hover,
.combobox-option.selected {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.combobox-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.combobox-check svg {
  width: 14px;
  height: 14px;
}

.combobox-empty {
  padding: 10px 12px;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: var(--app-text);
  cursor: pointer;
  min-height: auto;
  padding-top: 2px;
}

.checkbox-option input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--app-accent);
  cursor: pointer;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: var(--app-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.dialog-card {
  width: 100%;
  max-width: 720px;
  background: var(--app-surface-solid);
  border-radius: 12px;
  box-shadow: 0 24px 48px var(--app-shadow);
  border: 1px solid var(--app-border-strong);
  padding: 20px 24px 24px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dialog-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--app-heading);
}

.dialog-close {
  border: none;
  background: var(--app-surface-hover);
  color: var(--app-text-muted);
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.dialog-close:hover {
  background: var(--app-surface-elevated);
  color: var(--app-text);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.ghost-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.waf-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.waf-section-header h4 {
  margin: 0 0 6px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
}

.waf-section-desc {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.92rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-wrap {
  border-radius: 12px;
  border: 1px solid var(--app-border-strong);
  overflow-x: auto;
}

.cache-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.cache-table thead {
  background: var(--app-surface-muted);
}

.cache-table th,
.cache-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.92rem;
  color: var(--app-text);
  border-bottom: 1px solid var(--app-border-strong);
}

.cache-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
  font-weight: 600;
}

.target-cell {
  color: var(--app-text-secondary);
  font-size: 0.9rem;
  max-width: 280px;
}

.target-url {
  display: inline-block;
  word-break: break-word;
}

.target-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.target-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.32);
  font-size: 0.82rem;
  line-height: 1.2;
  white-space: nowrap;
}

.mark-cell {
  width: 48px;
}

.status-dot {
  display: inline-flex;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #94a3b8;
}

.status-dot.active {
  background: #22c55e;
}

.status-dot.inactive {
  background: #9ca3af;
}

.bool-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: var(--app-text-muted);
}

.bool-check.active {
  color: #22c55e;
}

.bool-check svg {
  width: 16px;
  height: 16px;
}

.bool-check-empty {
  font-size: 0.9rem;
  line-height: 1;
}

.action-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-action-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.icon-action-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.icon-action-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.icon-action-btn.danger {
  border-color: rgba(239, 68, 68, 0.6);
  background: rgba(254, 242, 242, 0.9);
  color: #b91c1c;
}

.icon-action-btn.danger:hover {
  border-color: rgba(220, 38, 38, 0.8);
  color: #991b1b;
  background: rgba(239, 68, 68, 0.16);
}

.empty-state {
  padding: 18px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: 0.92rem;
}

@media (max-width: 640px) {
  .cache-form-row,
  .cache-form-row--checkbox {
    grid-template-columns: 1fr;
    padding-left: 0;
  }

  .cache-form-label {
    text-align: left;
    padding-top: 0;
  }

  .cache-form-label--with-help {
    justify-content: flex-start;
  }
}
</style>
