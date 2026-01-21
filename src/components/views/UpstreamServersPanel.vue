<template>
  <div class="upstream-panel">
    <div class="panel-header">
      <div>
        <h3>Upstream Servers</h3>
        <p>Manage the origin servers serving traffic for this edge.</p>
      </div>
      <div class="header-actions">
        <button class="primary-btn" type="button" @click="openAddDialog">Add Server</button>
      </div>
    </div>

    <div class="content-card list-card">
      <div class="list-header">
        <h4>Upstream List</h4>
        <button class="ghost-btn" type="button" @click="refreshStatuses">Refresh</button>
      </div>
      <div class="table-wrap">
        <table class="upstream-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>IP:Port</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="server in upstreamServers" :key="server.id">
              <td>
                <span
                  class="status-dot"
                  :class="server.statusClass"
                  :aria-label="server.statusLabel"
                  role="img"
                ></span>
              </td>
              <td>{{ server.address }}</td>
              <td class="description-cell">
                <span class="description-text">{{ server.description }}</span>
              </td>
              <td>
                <button
                  class="icon-danger-btn"
                  type="button"
                  aria-label="Remove"
                  title="Remove"
                  @click="removeServer(server.id)"
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
        <div v-if="!upstreamServers.length" class="empty-state">
          No upstream servers configured yet.
        </div>
      </div>
    </div>

    <div v-if="isAddDialogOpen" class="dialog-backdrop" @click="closeAddDialog">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h4>Add Upstream Server</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeAddDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p class="helper-text">Enter the upstream address and optional weight, then add it to the list.</p>
        <div class="form-grid">
          <div class="form-field">
            <label for="upstream-address">Server Address</label>
            <input
              id="upstream-address"
              v-model="newServerAddress"
              type="text"
              placeholder="192.168.1.10:8080"
            />
          </div>
          <div class="form-field">
            <label for="upstream-weight">Weight (Optional)</label>
            <input
              id="upstream-weight"
              v-model="newServerWeight"
              type="number"
              min="1"
              placeholder="4"
            />
          </div>
        </div>
        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeAddDialog">Cancel</button>
          <button class="primary-btn" type="button" @click="addServer">Add Server</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { serverList } from "@/data/servers";

const upstreamServers = ref(
  serverList.map((server, index) => {
    const address = `${server.ip}:${server.sshPort || "80"}`;
    const weight = 4 + (index % 3);
    return {
      id: server.id,
      statusLabel: server.statusLabel,
      statusClass: server.statusClass,
      address,
      description: `weight=${weight} max_fails=3 fail_timeout=30s`
    };
  })
);

const formatDate = (date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

const newServerAddress = ref("");
const newServerWeight = ref("");
const isAddDialogOpen = ref(false);

const getDescription = (weight) => {
  if (weight) return `weight=${weight} max_fails=3 fail_timeout=30s`;
  return "max_fails=3 fail_timeout=30s";
};

const openAddDialog = () => {
  isAddDialogOpen.value = true;
};

const closeAddDialog = () => {
  isAddDialogOpen.value = false;
};

const addServer = () => {
  const address = newServerAddress.value.trim();
  if (!address) return;

  const weightValue = newServerWeight.value ? Number(newServerWeight.value) : "";
  upstreamServers.value.unshift({
    id: `upstream-${Date.now()}`,
    statusLabel: "Active",
    statusClass: "active",
    address,
    description: getDescription(weightValue)
  });
  newServerAddress.value = "";
  newServerWeight.value = "";
  closeAddDialog();
};

const removeServer = (serverId) => {
  upstreamServers.value = upstreamServers.value.filter((server) => server.id !== serverId);
};

const refreshStatuses = () => {
  upstreamServers.value = upstreamServers.value.map((server) => {
    const isActive = Math.random() > 0.35;
    return {
      ...server,
      statusLabel: isActive ? "Active" : "Inactive",
      statusClass: isActive ? "active" : "inactive"
    };
  });
};
</script>

<style scoped>
.upstream-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 0;
}

.content-card {
  background: rgba(248, 250, 252, 0.9);
  border-radius: 14px;
  padding: 18px;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.content-card h4 {
  margin: 0 0 14px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
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
  color: #64748b;
  font-size: 0.9rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.form-field input {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: #1a202c;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: #fff;
}

.form-field input:focus {
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
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
  max-width: 520px;
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
  margin-bottom: 12px;
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

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.ghost-btn {
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: white;
  color: #334155;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  border-color: rgba(59, 130, 246, 0.7);
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.08);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.panel-header h3 {
  margin: 0 0 6px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f2937;
}

.panel-header p {
  margin: 0;
  color: #64748b;
  font-size: 0.92rem;
}

.primary-btn {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 8px 18px rgba(22, 163, 74, 0.25);
  white-space: nowrap;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(22, 163, 74, 0.3);
}

.table-wrap {
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  overflow: hidden;
}

.upstream-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
}

.upstream-table thead {
  background: rgba(248, 250, 252, 0.9);
}

.upstream-table th,
.upstream-table td {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.92rem;
  color: #1f2937;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.upstream-table th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  font-weight: 600;
}

.description-cell {
  color: #475569;
  font-size: 0.9rem;
}

.description-text {
  display: inline;
  padding: 0;
  background: transparent;
  border-radius: 0;
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

.status-dot.maintenance {
  background: #f59e0b;
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

.empty-state {
  padding: 18px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.92rem;
}
</style>
