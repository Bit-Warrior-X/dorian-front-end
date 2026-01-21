<template>
  <div class="users-view">
    <div class="users-card">
      <div class="card-header">
        <h2>User Management</h2>
        <button class="add-button" type="button" @click="openAddDialog">+ Add User</button>
      </div>
      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Servers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="badge" :class="user.role === 'Admin' ? 'admin' : 'user'">{{ user.role }}</span>
              </td>
              <td>
                <span class="badge" :class="user.status === 'Active' ? 'active' : 'blocked'">{{ user.status }}</span>
              </td>
              <td>
                <div v-if="user.role === 'User' && user.servers?.length" class="server-list">
                  <span v-for="server in user.servers" :key="server" class="server-pill">{{ server }}</span>
                </div>
                <span v-else class="muted-text">—</span>
              </td>
              <td>
                <div class="actions">
                  <button class="action-btn action-btn--edit" type="button" aria-label="Edit" @click="openEditDialog(user)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                    </svg>
                  </button>
                  <button class="action-btn action-btn--block" type="button" aria-label="Block" @click="confirmBlockUser(user)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9"></circle>
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                    </svg>
                  </button>
                  <button class="action-btn action-btn--delete" type="button" aria-label="Delete" @click="confirmDeleteUser(user)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6l-1 14H6L5 6"></path>
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="isAddDialogOpen" class="dialog-backdrop" @click="closeAddDialog">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h4>{{ isEditMode ? 'Edit User' : 'Add User' }}</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeAddDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-grid">
          <div class="dialog-field">
            <label for="add-user-name">Name</label>
            <input id="add-user-name" v-model="newUser.name" type="text" placeholder="Jane Doe" />
          </div>
          <div class="dialog-field">
            <label for="add-user-email">Email</label>
            <input id="add-user-email" v-model="newUser.email" type="email" placeholder="jane@example.com" />
          </div>
          <div class="dialog-field">
            <label for="add-user-role">Role</label>
            <select id="add-user-role" v-model="newUser.role">
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>
          <div class="dialog-field">
            <label for="add-user-status">Status</label>
            <select id="add-user-status" v-model="newUser.status">
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
          <div v-if="newUser.role === 'User'" class="dialog-field dialog-field--full">
            <label>Servers</label>
            <div class="server-options">
              <label v-for="server in serverOptions" :key="server" class="server-option">
                <input v-model="newUser.servers" type="checkbox" :value="server" />
                <span>{{ server }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeAddDialog">Cancel</button>
          <button class="primary-btn" type="button" @click="submitAddUser">
            {{ isEditMode ? 'Save Changes' : 'Add User' }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="isConfirmDialogOpen" class="dialog-backdrop" @click="closeConfirmDialog">
      <div class="dialog-card dialog-card--confirm" @click.stop>
        <div class="dialog-header">
          <h4>{{ confirmTitle }}</h4>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeConfirmDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p class="dialog-text">{{ confirmMessage }}</p>
        <div class="dialog-actions">
          <button class="ghost-btn" type="button" @click="closeConfirmDialog">Cancel</button>
          <button class="danger-btn" type="button" @click="confirmAction">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { createUser, deleteUser, fetchUsers, updateUser } from '@/api/users'

const users = ref([])
const isLoading = ref(false)

const isAddDialogOpen = ref(false)
const isEditMode = ref(false)
const editingUserId = ref(null)
const isConfirmDialogOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
let pendingConfirmAction = null
const serverOptions = ['edge-nyc-01', 'edge-sin-05', 'edge-fra-04', 'edge-lon-02']
const newUser = reactive({
  name: '',
  email: '',
  role: 'User',
  status: 'Active',
  servers: [],
})

const openAddDialog = () => {
  isEditMode.value = false
  editingUserId.value = null
  resetNewUser()
  isAddDialogOpen.value = true
}

const openEditDialog = (user) => {
  isEditMode.value = true
  editingUserId.value = user.id
  newUser.name = user.name
  newUser.email = user.email
  newUser.role = user.role
  newUser.status = user.status
  newUser.servers = user.servers ? [...user.servers] : []
  isAddDialogOpen.value = true
}

const closeAddDialog = () => {
  isAddDialogOpen.value = false
}

const resetNewUser = () => {
  newUser.name = ''
  newUser.email = ''
  newUser.role = 'User'
  newUser.status = 'Active'
  newUser.servers = []
}

const loadUsers = async () => {
  isLoading.value = true
  try {
    const data = await fetchUsers()
    users.value = Array.isArray(data) ? data : []
  } catch {
    users.value = []
  } finally {
    isLoading.value = false
  }
}

const submitAddUser = async () => {
  const name = newUser.name.trim()
  const email = newUser.email.trim()

  if (!name || !email) {
    return
  }

  const payload = {
    name,
    email,
    role: newUser.role,
    status: newUser.status,
    servers: newUser.role === 'User' ? [...newUser.servers] : [],
  }

  if (isEditMode.value && editingUserId.value) {
    try {
      const updated = await updateUser(editingUserId.value, payload)
      const index = users.value.findIndex((user) => user.id === editingUserId.value)
      if (index !== -1) {
        users.value[index] = updated
      } else {
        users.value = [updated, ...users.value]
      }
    } catch {
      return
    }
  } else {
    try {
      const created = await createUser(payload)
      users.value = [created, ...users.value]
    } catch {
      return
    }
  }

  resetNewUser()
  isAddDialogOpen.value = false
}

const closeConfirmDialog = () => {
  isConfirmDialogOpen.value = false
  pendingConfirmAction = null
}

const openConfirmDialog = (title, message, action) => {
  confirmTitle.value = title
  confirmMessage.value = message
  pendingConfirmAction = action
  isConfirmDialogOpen.value = true
}

const confirmAction = () => {
  if (pendingConfirmAction) {
    pendingConfirmAction()
  }
  closeConfirmDialog()
}

const confirmDeleteUser = (user) => {
  openConfirmDialog(
    'Delete User',
    `Are you sure you want to delete ${user.name}?`,
    async () => {
      try {
        await deleteUser(user.id)
        users.value = users.value.filter((entry) => entry.id !== user.id)
      } catch {
        return
      }
    },
  )
}

const confirmBlockUser = (user) => {
  const nextStatus = user.status === 'Blocked' ? 'Active' : 'Blocked'
  const actionLabel = nextStatus === 'Blocked' ? 'block' : 'unblock'
  openConfirmDialog(
    `${nextStatus === 'Blocked' ? 'Block' : 'Unblock'} User`,
    `Are you sure you want to ${actionLabel} ${user.name}?`,
    async () => {
      const payload = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: nextStatus,
        servers: user.role === 'User' ? [...(user.servers || [])] : [],
      }
      try {
        const updated = await updateUser(user.id, payload)
        const index = users.value.findIndex((entry) => entry.id === user.id)
        if (index !== -1) {
          users.value[index] = updated
        }
      } catch {
        return
      }
    },
  )
}

watch(
  () => newUser.role,
  (role) => {
    if (role !== 'User') {
      newUser.servers = []
    }
  },
)

onMounted(() => {
  void loadUsers()
})
</script>

<style scoped>
.users-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.users-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1a202c 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.5px;
}

.add-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.add-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.users-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
}

th {
  padding: 16px;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1a202c;
  transition: background 0.2s;
}

tbody tr:hover {
  background: rgba(102, 126, 234, 0.02);
}

.badge {
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.badge.admin {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.badge.user {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
}

.badge.active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.badge.blocked {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #b91c1c;
}

.muted-text {
  color: #94a3b8;
  font-size: 0.85rem;
}

.server-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.server-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e3a8a;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border: 1px solid rgba(165, 180, 252, 0.7);
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid rgba(203, 213, 225, 0.9);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn--edit {
  color: #1d4ed8;
  border-color: rgba(147, 197, 253, 0.8);
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.action-btn--edit:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.action-btn--block {
  color: #b45309;
  border-color: rgba(253, 230, 138, 0.9);
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.action-btn--block:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
}

.action-btn--delete {
  color: #b91c1c;
  border-color: rgba(254, 202, 202, 0.9);
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.action-btn--delete:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
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
  max-width: 560px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 24px;
}

.dialog-card--confirm {
  max-width: 480px;
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

.dialog-text {
  margin: 4px 0 16px;
  color: #475569;
  font-size: 0.95rem;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.dialog-field--full {
  grid-column: 1 / -1;
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
  font-size: 0.9rem;
  color: #1f2937;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.server-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.server-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.9);
  font-size: 0.85rem;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s ease;
}

.server-option input {
  accent-color: #6366f1;
}

.server-option:hover {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(224, 231, 255, 0.45);
}

.dialog-field input:focus,
.dialog-field select:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.7);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.ghost-btn {
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: white;
  color: #475569;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-btn:hover {
  border-color: rgba(148, 163, 184, 0.6);
  color: #1f2937;
  background: rgba(226, 232, 240, 0.35);
}

.danger-btn {
  border: none;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(239, 68, 68, 0.35);
  transition: all 0.2s ease;
}

.danger-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(239, 68, 68, 0.4);
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(102, 126, 234, 0.35);
  transition: all 0.2s ease;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(102, 126, 234, 0.4);
}
</style>

