<template>
  <div class="servers-view">

    <div class="content-card">
      <div class="filter-header">
        <h3>Filters</h3>
        <button class="primary-btn" @click="openNewServerDialog">New Server</button>
      </div>
      <div class="filter-bar">
        <div class="filter-field">
          <label for="status-filter">Status</label>
          <select id="status-filter">
            <option value="">All</option>
            <option value="active">Normal</option>
            <option value="inactive">Pause</option>
            <option value="maintenance">Expired</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="name-filter">Name</label>
          <input id="name-filter" type="text" placeholder="Search by name" />
        </div>
        <div class="filter-field">
          <label for="ip-filter">IP</label>
          <input id="ip-filter" type="text" placeholder="Search by IP" />
        </div>
        <div class="filter-field">
          <label for="license-filter">License Type</label>
          <select id="license-filter">
            <option value="">All</option>
            <option value="enterprise">Enterprise</option>
            <option value="professional">Professional</option>
            <option value="trial">Trial</option>
          </select>
        </div>
      </div>
    </div>

    <div class="content-card servers-table-card">
      <div class="card-title">
        <h3>Servers</h3>
      </div>
      <div class="table-wrap">
        <table class="servers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>IP</th>
              <th>Status</th>
              <th>Users</th>
              <th>License</th>
              <th>Version</th>
              <th>Expired Date</th>
              <th>Created</th>
              <th>Settings</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="server in paginatedServers" :key="server.id">
              <td>{{ server.name }}</td>
              <td>{{ server.ip }}</td>
              <td>
                <span class="status-pill" :class="server.statusClass">
                  {{ server.statusLabel }}
                </span>
              </td>
              <td>{{ server.users }}</td>
              <td>{{ server.license }}</td>
              <td>{{ server.version }}</td>
              <td>{{ server.expiredDate }}</td>
              <td>{{ server.created }}</td>
              <td>
                <div class="menu-wrap">
                  <button
                    class="icon-btn"
                    title="Settings"
                    @click="toggleRowMenu(server.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0L5.636 18.364M18.364 5.636l-4.243 4.243m-4.242 0L5.636 5.636"></path>
                    </svg>
                  </button>
                  <div v-if="activeRowMenu === server.id" class="row-menu">
                    <button class="row-menu-item" @click="openEditServer(server)">
                      Edit
                    </button>
                    <button class="row-menu-item" @click="requestUpgradeConfirm(server)">
                      Upgrade
                    </button>
                    <button class="row-menu-item">License</button>
                    <button class="row-menu-item danger" @click="requestDeleteConfirm(server)">
                      Delete
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span class="pagination-info">
          Showing {{ pageStart }}-{{ pageEnd }} of {{ servers.length }}
        </span>
        <div class="pagination-controls">
          <button class="pagination-btn" :disabled="currentPage === 1" @click="prevPage">
            Prev
          </button>
          <span class="pagination-page">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="pagination-btn" :disabled="currentPage === totalPages" @click="nextPage">
            Next
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="isNewServerDialogOpen"
    class="dialog-backdrop"
    @click="closeNewServerDialog"
  >
    <div class="dialog-card" @click.stop>
      <div class="dialog-header">
        <h3>New Server</h3>
        <button class="dialog-close" @click="closeNewServerDialog" aria-label="Close dialog">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="dialog-body">
        <div class="dialog-section">
          <h4>Basic Setting</h4>
          <div class="dialog-grid">
            <div class="dialog-field">
              <label for="new-server-name">Name</label>
              <input
                id="new-server-name"
                v-model="newServer.name"
                type="text"
                placeholder="Enter server name"
              />
            </div>
            <div class="dialog-field">
              <label for="new-server-ip">IP</label>
              <input
                id="new-server-ip"
                v-model="newServer.ip"
                type="text"
                placeholder="Enter server IP"
              />
            </div>
          </div>
        </div>

        <div class="dialog-section">
          <h4>SSH Setting</h4>
          <div class="dialog-grid">
            <div class="dialog-field">
              <label for="new-server-username">UserName</label>
              <input
                id="new-server-username"
                v-model="newServer.username"
                type="text"
                placeholder="Enter username"
              />
            </div>
            <div class="dialog-field">
              <label for="new-server-password">Password</label>
              <input
                id="new-server-password"
                v-model="newServer.password"
                type="password"
                placeholder="Enter password"
              />
            </div>
            <div class="dialog-field">
              <label for="new-server-ssh">SSH port</label>
              <input
                id="new-server-ssh"
                v-model="newServer.sshPort"
                type="number"
                placeholder="22"
              />
            </div>
          </div>
        </div>

        <div class="dialog-section">
          <h4>Management users</h4>
          <div v-if="selectedUsers.length" class="selected-users">
            <button
              v-for="user in selectedUsers"
              :key="user"
              type="button"
              class="user-chip"
              @click="removeUser(user)"
            >
              {{ user }}
            </button>
          </div>
          <div class="dialog-grid">
            <div class="dialog-field">
              <label for="new-server-users">Choose users</label>
              <div class="combobox" @click="toggleUserDropdown">
                <input
                  id="new-server-users"
                  v-model="userSearch"
                  type="text"
                  placeholder="Search and select users"
                  @focus="openUserDropdown"
                />
                <span class="combobox-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
                <div v-show="isUserDropdownOpen" class="combobox-menu">
                  <button
                    v-for="user in filteredAvailableUsers"
                    :key="user"
                    type="button"
                    class="combobox-option"
                    @click="addUser(user)"
                  >
                    <span>{{ user }}</span>
                  </button>
                  <div v-if="!filteredAvailableUsers.length" class="combobox-empty">
                    No users found
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-section">
          <h4>License management</h4>
          <div class="license-options">
            <label class="radio-option">
              <input
                type="radio"
                name="license-management"
                value="trial"
                v-model="licenseOption"
              />
              <span>Trial</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="license-management"
                value="existing"
                v-model="licenseOption"
                @change="openLicensePicker"
              />
              <span>Load existing license file</span>
            </label>
          </div>
          <div v-if="licenseOption === 'existing'" class="license-file">
            <input
              ref="licenseInput"
              type="file"
              class="license-input"
              accept=".lic,.txt"
              @change="handleLicenseFile"
            />
            <button class="secondary-btn" type="button" @click="openLicensePicker">
              Choose file
            </button>
            <span class="license-path">
              {{ licenseFileName ? licenseFileName : 'No file selected' }}
            </span>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="secondary-btn" @click="closeNewServerDialog">Cancel</button>
        <button class="primary-btn" @click="createServer">Create</button>
      </div>
    </div>
  </div>

  <div
    v-if="isEditServerDialogOpen"
    class="dialog-backdrop"
    @click="closeEditServerDialog"
  >
    <div class="dialog-card" @click.stop>
      <div class="dialog-header">
        <h3>Edit Server</h3>
        <button class="dialog-close" @click="closeEditServerDialog" aria-label="Close dialog">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="dialog-body">
        <div class="dialog-section">
          <h4>Basic Setting</h4>
          <div class="dialog-grid">
            <div class="dialog-field">
              <label for="edit-server-name">Name</label>
              <input
                id="edit-server-name"
                v-model="editServer.name"
                type="text"
                placeholder="Enter server name"
              />
            </div>
            <div class="dialog-field">
              <label for="edit-server-ip">IP</label>
              <input
                id="edit-server-ip"
                v-model="editServer.ip"
                type="text"
                placeholder="Enter server IP"
              />
            </div>
          </div>
        </div>

        <div class="dialog-section">
          <h4>SSH Setting</h4>
          <div class="dialog-grid">
            <div class="dialog-field">
              <label for="edit-server-username">UserName</label>
              <input
                id="edit-server-username"
                v-model="editServer.username"
                type="text"
                placeholder="Enter username"
              />
            </div>
            <div class="dialog-field">
              <label for="edit-server-password">Password</label>
              <input
                id="edit-server-password"
                v-model="editServer.password"
                type="password"
                placeholder="Enter password"
              />
            </div>
            <div class="dialog-field">
              <label for="edit-server-ssh">SSH port</label>
              <input
                id="edit-server-ssh"
                v-model="editServer.sshPort"
                type="number"
                placeholder="22"
              />
            </div>
          </div>
        </div>

        <div class="dialog-section">
          <h4>Management users</h4>
          <div v-if="selectedUsers.length" class="selected-users">
            <button
              v-for="user in selectedUsers"
              :key="user"
              type="button"
              class="user-chip"
              @click="removeUser(user)"
            >
              {{ user }}
            </button>
          </div>
          <div class="dialog-grid">
            <div class="dialog-field">
              <label for="edit-server-users">Choose users</label>
              <div class="combobox" @click="toggleUserDropdown">
                <input
                  id="edit-server-users"
                  v-model="userSearch"
                  type="text"
                  placeholder="Search and select users"
                  @focus="openUserDropdown"
                />
                <span class="combobox-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
                <div v-show="isUserDropdownOpen" class="combobox-menu">
                  <button
                    v-for="user in filteredAvailableUsers"
                    :key="user"
                    type="button"
                    class="combobox-option"
                    @click="addUser(user)"
                  >
                    <span>{{ user }}</span>
                  </button>
                  <div v-if="!filteredAvailableUsers.length" class="combobox-empty">
                    No users found
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="secondary-btn" @click="closeEditServerDialog">Cancel</button>
        <button class="primary-btn" @click="requestEditConfirm">Confirm</button>
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
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import ConfirmDialog from '../ConfirmDialog.vue'
import { serverList } from '@/data/servers'

const isNewServerDialogOpen = ref(false)
const allUsers = [
  'Alex Morgan',
  'Jamie Lee',
  'Pat Kim',
  'Riley Chen',
  'Taylor Singh'
]
const selectedUsers = ref([])
const isUserDropdownOpen = ref(false)
const licenseOption = ref('trial')
const licenseFileName = ref('')
const licenseInput = ref(null)
const userSearch = ref('')
const activeRowMenu = ref(null)
const isEditServerDialogOpen = ref(false)
const editServerId = ref(null)
const editServer = ref({
  name: '',
  ip: '',
  username: '',
  password: '',
  sshPort: ''
})
const isConfirmDialogOpen = ref(false)
const confirmAction = ref(null)
const confirmTarget = ref(null)
const servers = ref(serverList.map((server) => ({ ...server })))
const pageSize = ref(6)
const currentPage = ref(1)
const newServer = ref({
  name: '',
  ip: '',
  username: '',
  password: '',
  sshPort: ''
})

const availableUsers = computed(() =>
  allUsers.filter((user) => !selectedUsers.value.includes(user))
)

const filteredAvailableUsers = computed(() => {
  const query = userSearch.value.trim().toLowerCase()
  const list = availableUsers.value
  if (!query) return list
  return list.filter((user) => user.toLowerCase().includes(query))
})

const confirmTitle = computed(() => {
  if (confirmAction.value === 'upgrade') return 'Upgrade server'
  if (confirmAction.value === 'delete') return 'Delete server'
  if (confirmAction.value === 'edit') return 'Server is modified'
  return 'Confirm action'
})

const confirmMessage = computed(() => {
  if (confirmAction.value === 'upgrade') {
    return 'Do you want to upgrade this server with latest version of our proxy service?'
  }
  if (confirmAction.value === 'delete') {
    return 'Are you sure you want to delete this server? This action cannot be undone.'
  }
  if (confirmAction.value === 'edit') {
    return 'Are you sure you want to apply these changes to the server?'
  }
  return 'Are you sure you want to continue?'
})

const confirmConfirmText = computed(() => {
  if (confirmAction.value === 'upgrade') return 'Upgrade'
  if (confirmAction.value === 'delete') return 'Delete'
  if (confirmAction.value === 'edit') return 'Apply'
  return 'Confirm'
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(servers.value.length / pageSize.value))
)

const paginatedServers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return servers.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() =>
  servers.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0
)

const pageEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, servers.value.length)
)

const openNewServerDialog = () => {
  // Reset dialog state each time it's opened
  selectedUsers.value = []
  userSearch.value = ''
  isUserDropdownOpen.value = false
  licenseOption.value = 'trial'
  licenseFileName.value = ''
  newServer.value = {
    name: '',
    ip: '',
    username: '',
    password: '',
    sshPort: ''
  }
  if (licenseInput.value) {
    licenseInput.value.value = ''
  }
  isNewServerDialogOpen.value = true
}

const closeNewServerDialog = () => {
  isNewServerDialogOpen.value = false
}

const openEditServer = (server) => {
  editServerId.value = server.id
  editServer.value = {
    name: server.name,
    ip: server.ip,
    username: server.username || '',
    password: server.password || '',
    sshPort: server.sshPort || ''
  }
  selectedUsers.value = server.managedUsers ? [...server.managedUsers] : []
  userSearch.value = ''
  isUserDropdownOpen.value = false
  isEditServerDialogOpen.value = true
  activeRowMenu.value = null
}

const closeEditServerDialog = () => {
  isEditServerDialogOpen.value = false
}

const openUserDropdown = () => {
  isUserDropdownOpen.value = true
}

const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value
}

const addUser = (user) => {
  if (selectedUsers.value.includes(user)) return
  selectedUsers.value = [...selectedUsers.value, user]
  userSearch.value = ''
  isUserDropdownOpen.value = false
}

const removeUser = (user) => {
  selectedUsers.value = selectedUsers.value.filter((item) => item !== user)
}

const toggleRowMenu = (rowId) => {
  activeRowMenu.value = activeRowMenu.value === rowId ? null : rowId
}

const handleClickOutsideMenu = (event) => {
  if (!event.target.closest('.menu-wrap')) {
    activeRowMenu.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutsideMenu)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideMenu)
})

const openLicensePicker = () => {
  if (!licenseInput.value) return
  licenseOption.value = 'existing'
  licenseInput.value.click()
}

const handleLicenseFile = (event) => {
  const file = event.target.files?.[0]
  licenseFileName.value = file ? file.name : ''
}

const formatDate = (date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

const createServer = () => {
  const createdDate = formatDate(new Date())
  const newId = `${newServer.value.name || 'server'}-${Date.now()}`.toLowerCase()
  const licenseLabel = licenseOption.value === 'trial' ? 'Trial' : 'Licensed'

  servers.value.unshift({
    id: newId,
    name: newServer.value.name || 'New Server',
    ip: newServer.value.ip || '0.0.0.0',
    statusLabel: 'Active',
    statusClass: 'active',
    users: selectedUsers.value.length,
    managedUsers: [...selectedUsers.value],
    username: newServer.value.username,
    password: newServer.value.password,
    sshPort: newServer.value.sshPort,
    license: licenseLabel,
    expiredDate: licenseOption.value === 'trial' ? '30 days' : 'TBD',
    created: createdDate
  })

  currentPage.value = 1
  closeNewServerDialog()
}

const requestEditConfirm = () => {
  confirmAction.value = 'edit'
  confirmTarget.value = null
  isConfirmDialogOpen.value = true
}

const requestUpgradeConfirm = (server) => {
  confirmAction.value = 'upgrade'
  confirmTarget.value = server
  isConfirmDialogOpen.value = true
  activeRowMenu.value = null
}

const requestDeleteConfirm = (server) => {
  confirmAction.value = 'delete'
  confirmTarget.value = server
  isConfirmDialogOpen.value = true
  activeRowMenu.value = null
}

const applyEditServer = () => {
  const index = servers.value.findIndex((item) => item.id === editServerId.value)
  if (index === -1) return

  const updatedUsers = [...selectedUsers.value]
  servers.value[index] = {
    ...servers.value[index],
    name: editServer.value.name || servers.value[index].name,
    ip: editServer.value.ip || servers.value[index].ip,
    users: updatedUsers.length,
    managedUsers: updatedUsers,
    username: editServer.value.username,
    password: editServer.value.password,
    sshPort: editServer.value.sshPort
  }

  closeEditServerDialog()
}

const handleConfirmDialog = () => {
  if (confirmAction.value === 'edit') {
    applyEditServer()
  } else if (confirmAction.value === 'upgrade') {
    handleUpgradeServer()
  } else if (confirmAction.value === 'delete') {
    handleDeleteServer()
  }
  clearConfirmDialog()
}

const clearConfirmDialog = () => {
  isConfirmDialogOpen.value = false
  confirmAction.value = null
  confirmTarget.value = null
}

const handleUpgradeServer = () => {
  if (!confirmTarget.value) return
  // Placeholder for upgrade action; integrate API call here when available.
}

const handleDeleteServer = () => {
  if (!confirmTarget.value) return
  servers.value = servers.value.filter((item) => item.id !== confirmTarget.value.id)
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}
</script>

<style scoped>
.servers-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100%;
}
.servers-table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}


.content-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.content-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 6px 0;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
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

.content-card p {
  margin: 0;
  color: #4a5568;
  font-size: 0.98rem;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 18px rgba(22, 163, 74, 0.25);
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px rgba(22, 163, 74, 0.3);
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  margin: 0;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 200px;
  min-width: 160px;
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

.table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  flex: 1;
  overflow-y: auto;
}

.servers-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.servers-table thead {
  background: rgba(248, 250, 252, 0.9);
}

.servers-table th,
.servers-table td {
  text-align: left;
  padding: 14px 16px;
  font-size: 0.92rem;
  color: #1f2937;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.servers-table th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  font-weight: 600;
}

.servers-table tbody tr:hover {
  background: rgba(248, 250, 252, 0.7);
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.pagination-info {
  color: #64748b;
  font-size: 0.9rem;
}

.pagination-controls {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.pagination-btn {
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: white;
  color: #334155;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: rgba(102, 126, 234, 0.6);
  color: #4c51bf;
  background: rgba(102, 126, 234, 0.08);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-page {
  color: #475569;
  font-size: 0.85rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(100, 116, 139, 0.12);
  color: #475569;
}

.status-pill.active {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.status-pill.inactive {
  background: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
}

.status-pill.maintenance {
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(248, 250, 252, 0.9);
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

.icon-btn:hover {
  border-color: rgba(102, 126, 234, 0.7);
  color: #4c51bf;
  background: rgba(102, 126, 234, 0.12);
  box-shadow: 0 6px 14px rgba(102, 126, 234, 0.18);
  transform: translateY(-1px);
}

.menu-wrap {
  position: relative;
  display: inline-flex;
}

.row-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: white;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
  padding: 8px;
  z-index: 6;
}

.row-menu-item {
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 0.92rem;
  color: #1f2937;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.row-menu-item:hover {
  background: rgba(102, 126, 234, 0.08);
  color: #4c51bf;
}

.row-menu-item.danger {
  color: #b91c1c;
}

.row-menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
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
  margin-bottom: 16px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
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

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-section h4 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  font-weight: 600;
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
  color: #64748b;
  font-weight: 500;
}

.dialog-field input {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: #1a202c;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dialog-field input:focus {
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.dialog-field select {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  background: white;
  color: #1a202c;
  outline: none;
  min-height: 44px;
}

.combobox {
  position: relative;
}

.combobox input {
  width: 100%;
  padding-right: 40px;
}

.combobox-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
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
  background: white;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 5;
}

.combobox-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1f2937;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
}

.combobox-option:hover {
  background: rgba(102, 126, 234, 0.08);
}

.combobox-empty {
  padding: 10px 12px;
  color: #94a3b8;
  font-size: 0.9rem;
}

.selected-users {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.user-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(102, 126, 234, 0.12);
  color: #4c51bf;
  font-size: 0.85rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.user-chip:hover {
  background: rgba(102, 126, 234, 0.18);
  color: #4338ca;
}

.license-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: #1f2937;
}

.radio-option input {
  width: 16px;
  height: 16px;
}

.license-file {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.license-input {
  display: none;
}

.license-path {
  color: #64748b;
  font-size: 0.9rem;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.secondary-btn {
  background: rgba(254, 242, 242, 0.9);
  border: 1px solid rgba(239, 68, 68, 0.6);
  color: #b91c1c;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  border-color: rgba(220, 38, 38, 0.8);
  color: #991b1b;
  background: rgba(239, 68, 68, 0.16);
}

@media (max-width: 768px) {
  .card-header,
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .primary-btn {
    width: 100%;
    text-align: center;
  }

  .dialog-card {
    padding: 20px;
  }
}
</style>

