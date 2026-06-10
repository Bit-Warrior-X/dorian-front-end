<template>
  <div class="servers-view">
    <div class="content-card filter-card">
      <div class="filter-header">
        <h3>Filters</h3>
        <div class="filter-actions">
          <button class="primary-btn" type="button" @click="blockIp" style="display: none;">Block IP</button>
          <button class="danger-btn" type="button" @click="flushAll">Flush All</button>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-field">
          <label for="blacklist-server">Server</label>
          <select id="blacklist-server" v-model="serverFilter">
            <option value="">All</option>
            <option v-for="server in servers" :key="server.id" :value="String(server.id)">
              {{ server.name }}
            </option>
          </select>
        </div>
        <div class="filter-field">
          <label for="blacklist-search">Identify Search</label>
          <div class="search-group">
            <input
              id="blacklist-search"
              v-model="searchQuery"
              type="text"
              placeholder="Search by IP"
            />
            <select id="blacklist-rule" v-model="ruleFilter">
              <option value="" disabled>Select Trigger Rule</option>
              <option value="all">All</option>
              <option value="l4ddos">L4 DDOS</option>
              <option value="blacklist">L7 Blacklist</option>
              <option value="geo">Geo Location</option>
              <option value="antiheader">Anti Header Setting</option>
              <option value="intervalfreqlimit">Interval Freq Limit</option>
              <option value="secondaryfreqlimit">Secondary Freq Limit</option>
              <option value="responsefreq">Response Freq</option>
              <option value="useragent">User Agent</option>
            </select>
            <button class="success-btn" type="button" @click="applySearch">Search</button>
          </div>
        </div>
      </div>
    </div>

    <div class="content-card table-card">
      <div class="card-title">
        <h3>Blacklist Entries</h3>
        <span class="count-pill">{{ filteredEntries.length }} items</span>
      </div>
      <div class="table-wrap">
        <table class="blacklist-table">
          <thead>
            <tr>
              <th>IP address</th>
              <th>URL</th>
              <th>GeoLocation</th>
              <th>Trigger Rule</th>
              <th>Blocked At</th>
              <th>TTL</th>
              <th>Remaining Time</th>
              <th>Source</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in filteredEntries" :key="entry.id">
              <td>{{ entry.ipAddress }}</td>
              <td>{{ entry.url || '-' }}</td>
              <td>{{ entry.geolocation }}</td>
              <td>{{ entry.triggerRule || 'manual' }}</td>
              <td>{{ formatTimestamp(entry.createdAt) }}</td>
              <td>{{ entry.ttl || 'Indefinite' }}</td>
              <td>{{ formatRemainingTime(entry) }}</td>
              <td>{{ entry.server || '-' }}</td>
              <td>
                <button
                  class="icon-danger-btn"
                  type="button"
                  aria-label="Unblock"
                  title="Unblock"
                  @click="removeEntry(entry.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6l-1 14H6L5 6"></path>
                    <path d="M10 11v6"></path>
                    <path d="M14 11v6"></path>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filteredEntries.length" class="empty-state">
          No blacklist entries match the current filters.
        </div>
      </div>
    </div>

    <div v-if="isBlockDialogOpen" class="dialog-backdrop" @click="closeBlockDialog">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h4>Block IP</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeBlockDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-grid">
          <div class="dialog-field">
            <label for="block-ip">IP address</label>
            <input
              id="block-ip"
              v-model="newBlock.ip"
              type="text"
              placeholder="192.168.1.10"
              required
            />
          </div>
          <div class="dialog-field">
            <label for="block-reason">Reason</label>
            <input
              id="block-reason"
              v-model="newBlock.reason"
              type="text"
              placeholder="Manual block"
            />
          </div>
          <div class="dialog-field">
            <label for="block-url">URL</label>
            <input
              id="block-url"
              v-model="newBlock.url"
              type="text"
              placeholder="e.g. /api/v1/health (optional)"
            />
          </div>
          <div class="dialog-field">
            <label for="block-server">Server</label>
            <select id="block-server" v-model="newBlock.server">
              <option value="" disabled>Select server</option>
              <option v-for="server in servers" :key="server.id" :value="String(server.id)">
                {{ server.name }}
              </option>
            </select>
          </div>
          <div class="dialog-field">
            <label for="block-ttl">TTL</label>
            <input
              id="block-ttl"
              v-model="newBlock.ttl"
              type="text"
              placeholder="30d"
              required
            />
          </div>
          <div class="dialog-field">
            <label for="block-rule">Trigger Rule</label>
            <select id="block-rule" v-model="newBlock.triggerRule">
              <option value="" disabled>Select Trigger Rule</option>
              <option value="waf-bruteforce">WAF-BruteForce</option>
              <option value="rate-limit">RateLimit</option>
              <option value="geo-block">GeoBlock</option>
              <option value="manual">Manual</option>
              <option value="custom">Customize</option>
            </select>
          </div>
          <div v-if="newBlock.triggerRule === 'custom'" class="dialog-field">
            <label for="block-custom-rule">Custom trigger rule</label>
            <div class="custom-rule-row">
              <input
                id="block-custom-rule"
                v-model="customTriggerRule"
                type="text"
                placeholder="Enter custom rule"
              />
            </div>
          </div>
        </div>
        <p v-if="validationError" class="validation-error">{{ validationError }}</p>
        <div class="dialog-actions">
          <button class="danger-btn" type="button" @click="closeBlockDialog">Cancel</button>
          <button class="primary-btn" type="button" @click="createBlock">Block IP</button>
        </div>
      </div>
    </div>
    <ConfirmDialog
      v-model="isConfirmDialogOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmConfirmText"
      cancel-text="Cancel"
      @confirm="handleConfirmDialog"
      @cancel="clearConfirmDialog"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import ConfirmDialog from "../ConfirmDialog.vue";
import { fetchServers } from "@/api/servers";
import {
  fetchBlacklistEntries,
  createBlacklistEntry,
  deleteBlacklistEntry,
  flushBlacklistEntries
} from "@/api/serverBlacklist";
import { notifyError, notifySuccess } from "@/utils/notify";

const BLACKLIST_TITLE = "Blacklist Management";
const serverFilter = ref("");
const ruleFilter = ref("");
const searchQuery = ref("");
const isBlockDialogOpen = ref(false);
const validationError = ref("");
const customTriggerRule = ref("");
const isConfirmDialogOpen = ref(false);
const confirmAction = ref(null);
const confirmTargetId = ref(null);
const servers = ref([]);
const now = ref(Date.now());
let remainingTimeTimer = null;
const newBlock = ref({
  ip: "",
  reason: "",
  url: "",
  server: "",
  ttl: "",
  triggerRule: ""
});
const blacklistEntries = ref([]);

const filteredEntries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return blacklistEntries.value.filter((entry) => {
    const matchesServer =
      !serverFilter.value || String(entry.serverId) === String(serverFilter.value);
    const matchesRule =
      !ruleFilter.value || ruleFilter.value === "all" || entry.triggerRule === ruleFilter.value;
    const matchesQuery =
      !query ||
      entry.ipAddress.toLowerCase().includes(query) ||
      entry.geolocation.toLowerCase().includes(query) ||
      entry.reason.toLowerCase().includes(query) ||
      entry.server?.toLowerCase().includes(query);
    return matchesServer && matchesRule && matchesQuery;
  });
});

const formatTimestamp = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const pad = (num) => String(num).padStart(2, "0");
  const year = parsed.getFullYear();
  const month = pad(parsed.getMonth() + 1);
  const day = pad(parsed.getDate());
  const hours = pad(parsed.getHours());
  const minutes = pad(parsed.getMinutes());
  const seconds = pad(parsed.getSeconds());
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

const formatRemainingTime = (entry) => {
  if (!entry || !entry.ttl || !entry.createdAt) return "-";

  const ttlSeconds = Number.parseInt(entry.ttl, 10);
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    return "-";
  }

  const created = new Date(entry.createdAt);
  if (Number.isNaN(created.getTime())) {
    return "-";
  }

  const remainingMs = created.getTime() + ttlSeconds * 1000 - now.value;
  if (remainingMs <= 0) {
    return "Expired";
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const loadServers = async () => {
  try {
    const list = await fetchServers();
    servers.value = Array.isArray(list) ? list : [];
  } catch (error) {
    notifyError(BLACKLIST_TITLE, error?.message || "The server list could not be loaded.");
  }
};

const loadBlacklist = async (serverId) => {
  try {
    const list = await fetchBlacklistEntries(serverId);
    const entries = Array.isArray(list) ? list : [];
    blacklistEntries.value = entries.map((entry) => ({
      ...entry,
      ipAddress: entry.ipAddress || "",
      geolocation: entry.geolocation || "Manual",
      reason: entry.reason || "",
      url: entry.url || "",
      server: entry.server || "",
      ttl: entry.ttl || "",
      triggerRule: entry.triggerRule || ""
    }));
  } catch (error) {
    notifyError(BLACKLIST_TITLE, error?.message || "The blacklist entries could not be loaded.");
  }
};

const resetFilters = () => {
  serverFilter.value = "";
  ruleFilter.value = "";
  searchQuery.value = "";
};

const applySearch = () => {
  searchQuery.value = searchQuery.value.trim();
};

const blockIp = () => {
  newBlock.value = {
    ip: "",
    reason: "",
    url: "",
    server: "",
    ttl: "",
    triggerRule: ""
  };
  validationError.value = "";
  customTriggerRule.value = "";
  isBlockDialogOpen.value = true;
};

const closeBlockDialog = () => {
  isBlockDialogOpen.value = false;
  validationError.value = "";
  customTriggerRule.value = "";
};

const createBlock = async () => {
  const ipAddress = newBlock.value.ip.trim();
  if (!ipAddress || !newBlock.value.ttl.trim()) {
    validationError.value = "IP address and TTL are required.";
    return;
  }
  if (!newBlock.value.server) {
    validationError.value = "Please select a server.";
    return;
  }
  if (newBlock.value.triggerRule === "custom" && !customTriggerRule.value.trim()) {
    validationError.value = "Please enter a custom trigger rule.";
    return;
  }

  const serverId = Number(newBlock.value.server);
  if (!serverId) {
    validationError.value = "Please select a server.";
    return;
  }

  const serverName = servers.value.find((server) => server.id === serverId)?.name || "";
  const reason = newBlock.value.reason.trim() || "Manual block";
  const triggerRule = customTriggerRule.value.trim() || newBlock.value.triggerRule || "manual";

  validationError.value = "";
  try {
    await createBlacklistEntry({
      serverId,
      ipAddress,
      geolocation: "Manual",
      reason,
      url: newBlock.value.url.trim() || "",
      server: serverName,
      ttl: newBlock.value.ttl.trim() || "Indefinite",
      triggerRule
    });
    await loadBlacklist(serverFilter.value ? Number(serverFilter.value) : undefined);
    notifySuccess(BLACKLIST_TITLE, "The blacklist entry is successfully created.");
    closeBlockDialog();
  } catch (error) {
    notifyError(BLACKLIST_TITLE, error?.message || "The blacklist entry could not be created.");
  }
};

const flushAll = () => {
  confirmAction.value = "flush";
  confirmTargetId.value = null;
  isConfirmDialogOpen.value = true;
};

const removeEntry = (entryId) => {
  confirmAction.value = "remove";
  confirmTargetId.value = entryId;
  isConfirmDialogOpen.value = true;
};

const confirmTitle = computed(() => {
  if (confirmAction.value === "flush") return "Flush all blacklist entries";
  if (confirmAction.value === "remove") return "Remove blacklist entry";
  return "Confirm action";
});

const confirmMessage = computed(() => {
  if (confirmAction.value === "flush") {
    return "Are you sure you want to flush all blacklist entries?";
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

const handleConfirmDialog = async () => {
  try {
    if (confirmAction.value === "flush") {
      await flushBlacklistEntries(serverFilter.value ? Number(serverFilter.value) : undefined);
      notifySuccess(BLACKLIST_TITLE, "All blacklist entries are successfully flushed.");
    } else if (confirmAction.value === "remove") {
      await deleteBlacklistEntry(confirmTargetId.value);
      notifySuccess(BLACKLIST_TITLE, "The blacklist entry is successfully deleted.");
    }
    await loadBlacklist(serverFilter.value ? Number(serverFilter.value) : undefined);
  } catch (error) {
    notifyError(BLACKLIST_TITLE, error?.message || "The blacklist could not be updated.");
  }
  clearConfirmDialog();
};

onMounted(async () => {
  await loadServers();
  await loadBlacklist();

  // Update "Remaining Time" column reactively without needing a full page reload.
  if (!remainingTimeTimer) {
    remainingTimeTimer = window.setInterval(() => {
      now.value = Date.now();
    }, 1000);
  }
});

watch(serverFilter, async (value) => {
  const serverId = value ? Number(value) : undefined;
  await loadBlacklist(serverId);
});

const clearConfirmDialog = () => {
  isConfirmDialogOpen.value = false;
  confirmAction.value = null;
  confirmTargetId.value = null;
};

onBeforeUnmount(() => {
  if (remainingTimeTimer) {
    clearInterval(remainingTimeTimer);
    remainingTimeTimer = null;
  }
});
</script>

<style scoped>
.servers-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.content-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 12px 0;
}

.content-card p {
  margin: 0;
  color: #4a5568;
  font-size: 0.98rem;
}

.filter-card {
  padding-bottom: 20px;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.filter-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-field label {
  font-size: 0.85rem;
  color: #718096;
  font-weight: 500;
}

.filter-field input,
.filter-field select {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  background: white;
  color: #1a202c;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-field input:focus,
.filter-field select:focus {
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 220px;
  min-width: 200px;
}

.search-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.search-group input,
.search-group select {
  flex: 1 1 200px;
  min-width: 180px;
}

.success-btn {
  /* neutral outline from theme.css */
}

.icon-danger-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.6);
  background: rgba(254, 242, 242, 0.9);
  color: #b91c1c;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.icon-danger-btn svg {
  width: 18px;
  height: 18px;
}

.icon-danger-btn:hover {
  border-color: rgba(220, 38, 38, 0.8);
  color: #991b1b;
  background: rgba(239, 68, 68, 0.16);
}

.primary-btn,
.danger-btn {
  /* colors from theme.css */
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.dialog-card {
  width: 100%;
  max-width: 620px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 24px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dialog-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f2937;
}

.dialog-close {
  border: none;
  background: rgba(148, 163, 184, 0.15);
  color: #475569;
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
  background: rgba(148, 163, 184, 0.25);
  color: #1f2937;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-field label {
  font-size: 0.85rem;
  color: #718096;
  font-weight: 500;
}

.dialog-field input,
.dialog-field select {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  background: white;
  color: #1a202c;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dialog-field input:focus,
.dialog-field select:focus {
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.custom-rule-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.custom-rule-row input {
  flex: 1 1 220px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.validation-error {
  margin: 14px 0 0 0;
  color: #b91c1c;
  font-size: 0.9rem;
}

.table-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

.card-title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.count-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
}

.table-wrap {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  overflow: hidden;
}

.blacklist-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.blacklist-table thead {
  background: rgba(248, 250, 252, 0.9);
}

.blacklist-table th,
.blacklist-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.92rem;
  color: #1f2937;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.blacklist-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  font-weight: 600;
}

.empty-state {
  padding: 18px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.92rem;
}
</style>

