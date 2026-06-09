<template>
  <div class="servers-view">
    <div class="toast-stack">
      <div
        v-for="note in notifications"
        :key="note.id"
        class="toast"
        :class="note.type"
      >
        {{ note.message }}
      </div>
    </div>

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
            <option value="Trial">Trial</option>
            <option value="L4">L4</option>
            <option value="L7">L7</option>
            <option value="Unified">Unified</option>
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
              <th class="col-layer-dots" aria-label="L4 and L7 status"></th>
              <th>Name</th>
              <th>IP</th>
              <th>Angelos</th>
              <th>Users</th>
              <th>License</th>
              <th>Version</th>
              <th>OS</th>
              <th>Expired Date</th>
              <th>Created</th>
              <th>Settings</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="server in paginatedServers" :key="server.id">
              <td class="col-layer-dots">
                <span class="layer-status-dots" :aria-busy="isRuntimeStatusRefreshing(server.id)">
                  <LayerStatusDot
                    layer="l4"
                    :loading="isRuntimeStatusRefreshing(server.id)"
                    :status="resolveLayerStatus(server, 'l4')"
                    :description="runtimeStatusDotDescription(server, 'l4')"
                    :aria-label="runtimeStatusAriaLabel(server, 'l4')"
                  />
                  <LayerStatusDot
                    layer="l7"
                    :loading="isRuntimeStatusRefreshing(server.id)"
                    :status="resolveLayerStatus(server, 'l7')"
                    :description="runtimeStatusDotDescription(server, 'l7')"
                    :aria-label="runtimeStatusAriaLabel(server, 'l7')"
                  />
                </span>
              </td>
              <td>{{ server.name }}</td>
              <td>{{ server.ip }}</td>
              <td>
                <span
                  class="status-pill server-status-pill"
                  :class="isRuntimeStatusRefreshing(server.id) ? 'runtime-status-loading' : angelosStatusClass(server)"
                  :aria-busy="isRuntimeStatusRefreshing(server.id)"
                  :aria-label="isRuntimeStatusRefreshing(server.id) ? 'Angelos: checking status' : undefined"
                >
                  <template v-if="!isRuntimeStatusRefreshing(server.id)">
                    {{ angelosStatusLabel(server) }}
                  </template>
                </span>
              </td>
              <td>
                <div v-if="server.managedUsers?.length" class="server-users">
                  <span v-for="user in server.managedUsers" :key="user" class="server-user-pill">
                    {{ user }}
                  </span>
                </div>
                <span v-else class="muted-text">—</span>
              </td>
              <td>{{ server.license }}</td>
              <td>{{ displayServerVersion(server.version) }}</td>
              <td>{{ displayServerOs(server.os) }}</td>
              <td>{{ server.expiredDate }}</td>
              <td>{{ server.created }}</td>
              <td>
                <div class="menu-wrap">
                  <button
                    class="icon-btn"
                    title="Settings"
                    @click.stop="toggleRowMenu(server.id)"
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
                    <button class="row-menu-item" @click="openUpgradeDialog(server)">
                      Upgrade
                    </button>
                    <button
                      class="row-menu-item"
                      :disabled="isRuntimeStatusRefreshing(server.id)"
                      @click="refreshRuntimeStatus(server)"
                    >
                      {{ isRuntimeStatusRefreshing(server.id) ? 'Refreshing…' : 'Refresh status' }}
                    </button>
                    <button class="row-menu-item" @click="openLicenseUpgradeDialog(server)">
                      License
                    </button>
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
    @click="!isCreatingServer && !isLoadingCreateVersions && closeNewServerDialog()"
  >
    <div
      class="dialog-card dialog-card--wide dialog-card--form"
      :class="{ 'dialog-card--busy': isCreatingServer || isLoadingCreateVersions }"
      @click.stop
    >
      <div class="dialog-header">
        <div class="dialog-header-text">
          <h3>New Server</h3>
          <p class="wizard-step-label">Step {{ newServerStep }} of 3</p>
        </div>
        <button
          class="dialog-close"
          type="button"
          :disabled="isCreatingServer || isLoadingCreateVersions"
          @click="closeNewServerDialog"
          aria-label="Close dialog"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <form class="new-server-dialog-form" @submit.prevent="onNewServerFormSubmit">
      <div class="dialog-body">
        <div v-show="newServerStep === 1" class="new-server-step-basic">
        <div class="new-server-basic-panel dialog-section">
          <h4>Basic Setting</h4>
          <div class="new-server-basic-fields">
            <div class="dialog-field">
              <label for="new-server-name">Name</label>
              <input
                id="new-server-name"
                v-model="newServer.name"
                type="text"
                autocomplete="off"
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

        <div class="new-server-basic-panel dialog-section">
          <h4>SSH Setting</h4>
          <div class="new-server-basic-fields">
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

        <div class="new-server-basic-panel dialog-section">
          <h4>Management users</h4>
          <div class="new-server-basic-fields">
            <div v-if="selectedUsers.length" class="selected-users">
              <button
                v-for="userId in selectedUsers"
                :key="userId"
                type="button"
                class="user-chip"
                @click="removeUser(userId)"
              >
                {{ getUserLabelById(userId) }}
              </button>
            </div>
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
                    :key="user.id"
                    type="button"
                    class="combobox-option"
                    @click="addUser(user)"
                  >
                    <span>{{ getUserLabel(user) }}</span>
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

        <div v-show="newServerStep === 2">
        <div class="dialog-section">
          <h4>Product version</h4>
          <p class="license-tier-hint">
            <template v-if="isLoadingCreateVersions">
              Connecting to the target host and loading versions for its operating system…
            </template>
            <template v-else-if="detectedHostOs">
              Choose the Dorian build to deploy on
              <strong>{{ createHostOsLabel }}</strong>.
            </template>
            <template v-else>
              Choose the Dorian build (version and target OS) to deploy on this host.
            </template>
          </p>
          <div v-if="isLoadingCreateVersions" class="dialog-deploy-status" role="status">
            <span class="btn-spinner btn-spinner--inline" aria-hidden="true"></span>
            Detecting host OS and loading available versions…
          </div>
          <div v-else-if="createVersionsError" class="upgrade-error">
            {{ createVersionsError }}
          </div>
          <p v-else-if="!createVersions.length" class="muted-text">
            No versions available for {{ createHostOsLabel }}.
          </p>
          <div v-else class="upgrade-version-panels">
            <VersionPanelSelector
              v-model="selectedCreateVersionUuid"
              :versions="createVersions"
              aria-label="Product version to deploy"
            />
          </div>
        </div>
        </div>

        <div v-show="newServerStep === 3" class="new-server-step-license">
        <div class="dialog-section dialog-section--license dialog-section--license-full">
          <h4>License</h4>
          <p class="license-tier-hint license-tier-hint--intro">
            Select a license tier for this deployment. Each plan lists pricing and included capabilities below.
          </p>
          <LicenseTierSelector
            v-model="licenseTier"
            aria-label="License type for new server"
            @update:model-value="onLicenseTierChange"
          />
          <p class="license-tier-hint license-tier-hint--deploy">
            <template v-if="licenseTier === 'Trial'">
              A new 3-day trial license will be generated and bound to the target host.
            </template>
            <template v-else>
              A new {{ licenseTier }} license (365 days) will be generated for the target host.
              Optionally load an existing license file to reuse it instead.
            </template>
          </p>
          <div v-if="licenseTier !== 'Trial'" class="license-existing-row">
            <label class="checkbox-option">
              <input
                type="checkbox"
                v-model="useExistingLicense"
                @change="onUseExistingLicenseChange"
              />
              <span>Load existing license file instead of generating</span>
            </label>
            <div v-if="useExistingLicense" class="license-file">
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
        </div>
      </div>
      <p v-if="isCreatingServer" class="dialog-deploy-status" role="status">
        <span class="btn-spinner btn-spinner--inline" aria-hidden="true"></span>
        Deploying package to the target host… This may take a minute.
      </p>
      <div class="dialog-footer">
        <button
          class="secondary-btn"
          type="button"
          :disabled="isCreatingServer || isLoadingCreateVersions"
          @click="newServerStep === 1 ? closeNewServerDialog() : goToPrevNewServerStep()"
        >
          {{ newServerStep === 1 ? 'Cancel' : 'Back' }}
        </button>
        <button
          v-if="newServerStep < 3"
          class="primary-btn"
          type="button"
          :disabled="isCreatingServer || isLoadingCreateVersions || !canProceedNewServerStep"
          @click="goToNextNewServerStep"
        >
          <span v-if="isLoadingCreateVersions" class="btn-spinner" aria-hidden="true"></span>
          {{ isLoadingCreateVersions ? 'Loading…' : 'Next' }}
        </button>
        <button
          v-else
          class="primary-btn"
          type="submit"
          :disabled="isCreatingServer || !canSubmitCreateServer"
        >
          <span v-if="isCreatingServer" class="btn-spinner" aria-hidden="true"></span>
          {{ isCreatingServer ? 'Deploying…' : 'Deploy' }}
        </button>
      </div>
      </form>
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
              v-for="userId in selectedUsers"
              :key="userId"
              type="button"
              class="user-chip"
              @click="removeUser(userId)"
            >
              {{ getUserLabelById(userId) }}
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
                    :key="user.id"
                    type="button"
                    class="combobox-option"
                    @click="addUser(user)"
                  >
                    <span>{{ getUserLabel(user) }}</span>
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

  <div
    v-if="isUpgradeDialogOpen"
    class="dialog-backdrop"
    @click="!isLoadingUpgradeVersions && !isUpgradingServer && closeUpgradeDialog()"
  >
    <div
      class="dialog-card dialog-card--wide dialog-card--upgrade"
      :class="{ 'dialog-card--busy': isLoadingUpgradeVersions || isUpgradingServer }"
      @click.stop
    >
      <div class="dialog-header">
        <h3>Upgrade server</h3>
        <button
          class="dialog-close"
          type="button"
          aria-label="Close dialog"
          @click="closeUpgradeDialog"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="dialog-body">
        <p v-if="upgradeTargetServer" class="upgrade-server-line">
          <strong>{{ upgradeTargetServer.name }}</strong>
          <span class="muted-text">({{ upgradeTargetServer.ip }})</span>
        </p>
        <p class="muted-text upgrade-hint">
          Select a Dorian product version for
          <strong>{{ upgradeTargetOsLabel }}</strong>.
          Current: {{ upgradeTargetServer?.version || '—' }}
        </p>
        <div v-if="isLoadingUpgradeVersions" class="dialog-deploy-status" role="status">
          Loading available versions…
        </div>
        <div v-else-if="isUpgradingServer" class="dialog-deploy-status" role="status">
          Upgrading remote server (this may take several minutes)…
        </div>
        <div v-else-if="upgradeVersionsError" class="upgrade-error">
          {{ upgradeVersionsError }}
        </div>
        <p v-else-if="!upgradeVersions.length" class="muted-text">
          No versions available for {{ upgradeTargetOsLabel }}.
        </p>
        <div v-else class="upgrade-version-panels">
          <VersionPanelSelector
            v-model="selectedUpgradeVersionUuid"
            :versions="upgradeVersions"
            :current-version="upgradeTargetServer?.version"
            :disabled="isUpgradingServer"
            aria-label="Product version to install"
          />
        </div>
      </div>
      <div class="dialog-footer">
        <button
          class="secondary-btn"
          type="button"
          :disabled="isLoadingUpgradeVersions || isUpgradingServer"
          @click="closeUpgradeDialog"
        >
          Cancel
        </button>
        <button
          class="primary-btn"
          type="button"
          :disabled="isLoadingUpgradeVersions || isUpgradingServer || !canSubmitVersionUpgrade"
          @click="submitUpgradeVersionChoice"
        >
          Upgrade
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="isLicenseUpgradeDialogOpen"
    class="dialog-backdrop"
    @click="!isLicenseUpgrading && closeLicenseUpgradeDialog()"
  >
    <div
      class="dialog-card dialog-card--wide"
      :class="{ 'dialog-card--busy': isLicenseUpgrading }"
      @click.stop
    >
      <div class="dialog-header">
        <h3>Change license type</h3>
        <button
          class="dialog-close"
          type="button"
          aria-label="Close dialog"
          :disabled="isLicenseUpgrading"
          @click="closeLicenseUpgradeDialog"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="dialog-body">
        <p v-if="licenseUpgradeTarget" class="upgrade-server-line">
          <strong>{{ licenseUpgradeTarget.name }}</strong>
          <span class="muted-text">({{ licenseUpgradeTarget.ip }})</span>
        </p>
        <p class="muted-text upgrade-hint">
          Current license: <strong>{{ licenseUpgradeTarget?.license || '—' }}</strong>
        </p>
        <LicenseTierUpgradePanel
          v-if="licenseUpgradeTarget"
          :server="licenseUpgradeTarget"
          :intro="''"
          ok-label="OK"
          @pending="isLicenseUpgrading = $event"
          @close="closeLicenseUpgradeDialog"
          @success="onLicenseUpgradeSuccess"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import ConfirmDialog from '../ConfirmDialog.vue'
import LayerStatusDot from '../LayerStatusDot.vue'
import LicenseTierUpgradePanel from '../LicenseTierUpgradePanel.vue'
import LicenseTierSelector from '../LicenseTierSelector.vue'
import VersionPanelSelector from '../VersionPanelSelector.vue'
import {
  formatServerVersionDisplay,
  formatVersionOs,
  filterVersionsForServerOs,
  isSameProductVersion,
  latestDeployVersionFromList,
} from '@/utils/deployVersions'
import {
  angelosStatusClass,
  angelosStatusLabel,
  layerDotDescription,
  layerDotTitle,
  resolveLayerStatus,
} from '@/utils/serverLayerStatus'
import {
  createServer as createServerApi,
  fetchServers,
  fetchDeployVersions,
  probeHostVersions,
  upgradeServer,
  refreshServerRuntimeStatus,
  deleteServer,
  updateServer,
  updateServerUsers,
} from '@/api/servers'
import { fetchUsers } from '@/api/users'
import { useAuth } from '@/stores/auth'

/** Synchronous guard: reactive isCreatingServer can still allow parallel createServer() in the same tick. */
let createServerSyncLock = false

const isNewServerDialogOpen = ref(false)
const newServerStep = ref(1)
const detectedHostOs = ref('')
const isCreatingServer = ref(false)
const auth = useAuth()
const notifications = ref([])
const allUsers = ref([])
const selectedUsers = ref([])
const isUserDropdownOpen = ref(false)
const licenseTier = ref('Trial')
const useExistingLicense = ref(false)
const licenseFileName = ref('')
const licenseInput = ref(null)
const userSearch = ref('')
const activeRowMenu = ref(null)
const runtimeStatusRefreshingIds = ref(new Set())
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

const isUpgradeDialogOpen = ref(false)
const isLoadingUpgradeVersions = ref(false)
const isUpgradingServer = ref(false)
const upgradeTargetServer = ref(null)
const upgradeVersions = ref([])
const upgradeVersionsError = ref('')
const selectedUpgradeVersionUuid = ref('')

const createVersions = ref([])
const isLoadingCreateVersions = ref(false)
const createVersionsError = ref('')
const selectedCreateVersionUuid = ref('')

const canProceedBasicStep = computed(() => {
  if (!newServer.value.name?.trim() || !newServer.value.ip?.trim()) return false
  if (!newServer.value.username?.trim() || !newServer.value.password?.trim()) return false
  return true
})

const canProceedVersionStep = computed(() => {
  if (isLoadingCreateVersions.value || createVersionsError.value) return false
  return Boolean(selectedCreateVersionUuid.value && createVersions.value.length)
})

const canProceedNewServerStep = computed(() => {
  if (newServerStep.value === 1) return canProceedBasicStep.value
  if (newServerStep.value === 2) return canProceedVersionStep.value
  return false
})

const canSubmitCreateServer = computed(() => {
  if (!selectedCreateVersionUuid.value || !createVersions.value.length) return false
  return canProceedBasicStep.value
})

const createHostOsLabel = computed(() => {
  const label = formatVersionOs(detectedHostOs.value)
  return label || 'this platform'
})

const canSubmitVersionUpgrade = computed(() => {
  if (!upgradeVersions.value.length || !selectedUpgradeVersionUuid.value) return false
  const picked = upgradeVersions.value.find((v) => v.uuid === selectedUpgradeVersionUuid.value)
  if (!picked) return false
  return !isSameProductVersion(picked.version, upgradeTargetServer.value?.version)
})

const upgradeTargetOsLabel = computed(() => {
  const label = formatVersionOs(upgradeTargetServer.value?.os)
  return label || 'this platform'
})
const isLicenseUpgradeDialogOpen = ref(false)
const licenseUpgradeTarget = ref(null)
const isLicenseUpgrading = ref(false)
const servers = ref([])
const deployVersionsCatalog = ref([])
const pageSize = ref(6)
const currentPage = ref(1)
const newServer = ref({
  name: '',
  ip: '',
  username: '',
  password: '',
  sshPort: ''
})

const usersById = computed(() => {
  const map = new Map()
  allUsers.value.forEach((user) => {
    map.set(user.id, user)
  })
  return map
})

const availableUsers = computed(() =>
  allUsers.value.filter((user) => !selectedUsers.value.includes(user.id))
)

const filteredAvailableUsers = computed(() => {
  const query = userSearch.value.trim().toLowerCase()
  const list = availableUsers.value
  if (!query) return list
  return list.filter((user) =>
    getUserLabel(user).toLowerCase().includes(query)
  )
})

const confirmTitle = computed(() => {
  if (confirmAction.value === 'delete') return 'Delete server'
  if (confirmAction.value === 'edit') return 'Server is modified'
  return 'Confirm action'
})

const confirmMessage = computed(() => {
  if (confirmAction.value === 'delete') {
    return 'Are you sure you want to delete this server? This action cannot be undone.'
  }
  if (confirmAction.value === 'edit') {
    return 'Are you sure you want to apply these changes to the server?'
  }
  return 'Are you sure you want to continue?'
})

const confirmConfirmText = computed(() => {
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

const loadCreateVersionsForHost = async () => {
  isLoadingCreateVersions.value = true
  createVersionsError.value = ''
  createVersions.value = []
  selectedCreateVersionUuid.value = ''
  detectedHostOs.value = ''
  try {
    const data = await probeHostVersions({
      ip: newServer.value.ip?.trim() || '',
      sshUser: newServer.value.username?.trim() || '',
      sshPassword: newServer.value.password?.trim() || '',
      sshPort: newServer.value.sshPort?.toString().trim() || '',
    })
    const list = Array.isArray(data?.versions) ? data.versions : []
    detectedHostOs.value = data?.os || ''
    createVersions.value = list
    deployVersionsCatalog.value = list
    if (list.length) {
      selectedCreateVersionUuid.value = list[0].uuid
    }
  } catch (error) {
    const msg = error?.message || 'Failed to detect host OS or load versions.'
    createVersionsError.value = msg
    createVersions.value = []
    detectedHostOs.value = ''
  } finally {
    isLoadingCreateVersions.value = false
  }
}

const goToNextNewServerStep = async () => {
  if (newServerStep.value === 1) {
    if (!canProceedBasicStep.value) {
      enqueueNotification('Please fill in all required basic settings.', 'error')
      return
    }
    newServerStep.value = 2
    await loadCreateVersionsForHost()
    return
  }
  if (newServerStep.value === 2) {
    if (!canProceedVersionStep.value) {
      enqueueNotification('Please select a product version.', 'error')
      return
    }
    newServerStep.value = 3
  }
}

const goToPrevNewServerStep = () => {
  if (newServerStep.value <= 1 || isCreatingServer.value || isLoadingCreateVersions.value) return
  newServerStep.value -= 1
}

const onNewServerFormSubmit = () => {
  if (newServerStep.value === 3) {
    void createServer()
  }
}

const openNewServerDialog = () => {
  // Reset dialog state each time it's opened
  selectedUsers.value = []
  userSearch.value = ''
  isUserDropdownOpen.value = false
  licenseTier.value = 'Trial'
  useExistingLicense.value = false
  licenseFileName.value = ''
  createVersions.value = []
  createVersionsError.value = ''
  selectedCreateVersionUuid.value = ''
  detectedHostOs.value = ''
  newServerStep.value = 1
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
  if (isCreatingServer.value || isLoadingCreateVersions.value) return
  isNewServerDialogOpen.value = false
  newServerStep.value = 1
}

const openEditServer = (server) => {
  editServerId.value = server.id
  editServer.value = {
    name: server.name,
    ip: server.ip,
    username: server.sshUser || '',
    password: server.sshPassword || '',
    sshPort: server.sshPort || ''
  }
  selectedUsers.value = server.managedUserIds
    ? [...server.managedUserIds]
    : []
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
  if (selectedUsers.value.includes(user.id)) return
  selectedUsers.value = [...selectedUsers.value, user.id]
  userSearch.value = ''
  isUserDropdownOpen.value = false
}

const removeUser = (userId) => {
  selectedUsers.value = selectedUsers.value.filter((item) => item !== userId)
}

const toggleRowMenu = (rowId) => {
  activeRowMenu.value = activeRowMenu.value === rowId ? null : rowId
}

const handleClickOutsideMenu = (event) => {
  if (!event.target.closest('.menu-wrap')) {
    activeRowMenu.value = null
  }
}

const latestDeployVersion = computed(() =>
  latestDeployVersionFromList(deployVersionsCatalog.value)
)

const displayServerVersion = (version) =>
  formatServerVersionDisplay(version, latestDeployVersion.value)

const displayServerOs = (os) => formatVersionOs(os) || '—'

const loadDeployVersionsCatalog = async () => {
  try {
    const data = await fetchDeployVersions()
    deployVersionsCatalog.value = Array.isArray(data?.versions) ? data.versions : []
  } catch {
    deployVersionsCatalog.value = []
  }
}

const loadServers = async () => {
  try {
    const data = await fetchServers()
    const list = Array.isArray(data) ? data.map((server) => ({ ...server })) : []
    const isAdmin =
      String(auth.state.user?.role || '').toLowerCase() === 'admin'
    if (isAdmin) {
      servers.value = list
      return
    }
    const userId = auth.state.user?.id
    if (!userId) {
      servers.value = []
      return
    }
    servers.value = list.filter((server) =>
      Array.isArray(server.managedUserIds)
        ? server.managedUserIds.includes(userId)
        : false
    )
  } catch {
    servers.value = []
  }
}

const loadUsers = async () => {
  try {
    const data = await fetchUsers()
    allUsers.value = Array.isArray(data)
      ? data.filter((user) => user.role === 'User')
      : []
  } catch {
    allUsers.value = []
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutsideMenu)
  void loadServers()
  void loadUsers()
  void loadDeployVersionsCatalog()
})

watch(
  () => auth.state.user,
  () => {
    void loadServers()
  }
)

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideMenu)
  createServerSyncLock = false
})

const openLicensePicker = () => {
  if (!licenseInput.value) return
  useExistingLicense.value = true
  licenseInput.value.click()
}

const handleLicenseFile = (event) => {
  const file = event.target.files?.[0]
  licenseFileName.value = file ? file.name : ''
}

// When the tier switches back to Trial, clear any previously picked file
// so the next submit does not accidentally carry an L4/L7/Unified selection.
const onLicenseTierChange = () => {
  if (licenseTier.value === 'Trial') {
    useExistingLicense.value = false
    licenseFileName.value = ''
  }
}

const onUseExistingLicenseChange = () => {
  if (!useExistingLicense.value) {
    licenseFileName.value = ''
  } else {
    openLicensePicker()
  }
}

const enqueueNotification = (message, type = 'success') => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  notifications.value = [...notifications.value, { id, message, type }]
  setTimeout(() => {
    notifications.value = notifications.value.filter((note) => note.id !== id)
  }, 3500)
}

const getUserLabel = (user) => user?.name || user?.email || 'Unknown user'

const getUserLabelById = (userId) => {
  const user = usersById.value.get(userId)
  return getUserLabel(user)
}

const formatDate = (date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

const createServer = async () => {
  if (createServerSyncLock) return
  if (!canSubmitCreateServer.value) {
    enqueueNotification('Please select a product version and fill required fields.', 'error')
    return
  }
  const pickedVersion = createVersions.value.find((v) => v.uuid === selectedCreateVersionUuid.value)
  if (!pickedVersion) {
    enqueueNotification('Please select a product version.', 'error')
    return
  }
  createServerSyncLock = true
  isCreatingServer.value = true
  const idempotencyKey =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const payload = {
    name: newServer.value.name?.trim() || '',
    ip: newServer.value.ip?.trim() || '',
    status: 'Normal',
    // licenseType: one of 'Trial' | 'L4' | 'L7' | 'Unified'.
    // The Go backend lowercases this and forwards it to deploy_license as license_type.
    licenseType: licenseTier.value,
    // licenseFile is only meaningful for non-Trial tiers when the user opted to reuse
    // an existing license. The Go backend forwards it as license_string to deploy_license.
    licenseFile:
      licenseTier.value !== 'Trial' && useExistingLicense.value
        ? licenseFileName.value || ''
        : '',
    version: '',
    versionUuid: pickedVersion.uuid,
    os: pickedVersion.os || '',
    sshUser: newServer.value.username?.trim() || '',
    sshPassword: newServer.value.password?.trim() || '',
    sshPort: newServer.value.sshPort?.toString().trim() || '',
    userIds: [...selectedUsers.value],
  }

  try {
    const created = await createServerApi(payload, { 'Idempotency-Key': idempotencyKey })
    const detailParts = []
    if (created?.license) detailParts.push(`license: ${created.license}`)
    if (created?.version) detailParts.push(`version: ${created.version}`)
    if (created?.os) detailParts.push(`os: ${displayServerOs(created.os)}`)
    if (created?.expiredDate) detailParts.push(`expires: ${created.expiredDate}`)
    const detail = detailParts.length ? ` ${detailParts.join(' · ')}` : ''
    enqueueNotification(`Server created successfully.${detail}`, 'success')
    currentPage.value = 1
    // Clear busy state before closing so the dialog is not stuck behind pointer-events: none.
    isCreatingServer.value = false
    await nextTick()
    isNewServerDialogOpen.value = false
    void loadServers()
  } catch (error) {
    const isAbort =
      error?.name === 'AbortError' ||
      (typeof DOMException !== 'undefined' &&
        error instanceof DOMException &&
        (error.name === 'TimeoutError' || error.name === 'AbortError'))
    if (isAbort) {
      enqueueNotification(
        'The create request timed out in the browser, but the server may already have created it. Refreshing the list.',
        'error'
      )
      void loadServers()
      isCreatingServer.value = false
      await nextTick()
      isNewServerDialogOpen.value = false
    } else {
      const msg = error?.message || 'Failed to create server.'
      enqueueNotification(msg, 'error')
      isCreatingServer.value = false
      await nextTick()
      isNewServerDialogOpen.value = false
      void loadServers()
    }
  } finally {
    isCreatingServer.value = false
    createServerSyncLock = false
  }
}

const requestEditConfirm = () => {
  confirmAction.value = 'edit'
  confirmTarget.value = null
  isConfirmDialogOpen.value = true
}

const closeUpgradeDialog = () => {
  isUpgradeDialogOpen.value = false
  upgradeTargetServer.value = null
  upgradeVersions.value = []
  upgradeVersionsError.value = ''
  selectedUpgradeVersionUuid.value = ''
  isUpgradingServer.value = false
}

const isRuntimeStatusRefreshing = (serverId) => runtimeStatusRefreshingIds.value.has(serverId)

const setRuntimeStatusRefreshing = (serverId, refreshing) => {
  const next = new Set(runtimeStatusRefreshingIds.value)
  if (refreshing) {
    next.add(serverId)
  } else {
    next.delete(serverId)
  }
  runtimeStatusRefreshingIds.value = next
}

const runtimeStatusAriaLabel = (server, layer) => {
  if (isRuntimeStatusRefreshing(server?.id)) {
    const name = layer === 'l4' ? 'L4 (Sparta)' : 'L7 (Athens)'
    return `${name}: checking status`
  }
  return layerDotTitle(server, layer)
}

const runtimeStatusDotDescription = (server, layer) => {
  if (isRuntimeStatusRefreshing(server?.id)) {
    const name = layer === 'l4' ? 'L4 · Sparta' : 'L7 · Athens'
    return `${name}\nChecking service status on the remote host…`
  }
  return layerDotDescription(server, layer)
}

const mergeServerRuntimeStatus = (serverId, updated) => {
  if (!updated || typeof updated !== 'object') return
  const index = servers.value.findIndex((item) => item.id === serverId)
  if (index === -1) return
  servers.value[index] = {
    ...servers.value[index],
    ...updated,
    serviceStatus: updated.serviceStatus ?? updated.service_status ?? servers.value[index].serviceStatus,
    l4Status: updated.l4Status ?? updated.l4_status ?? servers.value[index].l4Status,
    l7Status: updated.l7Status ?? updated.l7_status ?? servers.value[index].l7Status,
  }
}

const refreshRuntimeStatus = async (server) => {
  activeRowMenu.value = null
  if (!server?.id || isRuntimeStatusRefreshing(server.id)) return
  setRuntimeStatusRefreshing(server.id, true)
  try {
    const updated = await refreshServerRuntimeStatus(server.id)
    mergeServerRuntimeStatus(server.id, updated)
    enqueueNotification(`Runtime status refreshed for ${server.name}.`, 'success')
    await loadServers()
  } catch (error) {
    const msg = error?.message || 'Failed to refresh runtime status.'
    enqueueNotification(msg, 'error')
  } finally {
    setRuntimeStatusRefreshing(server.id, false)
  }
}

const openUpgradeDialog = async (server) => {
  activeRowMenu.value = null
  upgradeTargetServer.value = server
  upgradeVersions.value = []
  upgradeVersionsError.value = ''
  selectedUpgradeVersionUuid.value = ''
  isUpgradeDialogOpen.value = true
  isLoadingUpgradeVersions.value = true
  try {
    const data = await fetchDeployVersions()
    const all = Array.isArray(data?.versions) ? data.versions : []
    deployVersionsCatalog.value = all
    const list = filterVersionsForServerOs(all, server?.os)
    upgradeVersions.value = list
    if (list.length) {
      const current = server?.version
      const preferred = list.find((v) => !isSameProductVersion(v.version, current))
      selectedUpgradeVersionUuid.value = (preferred || list[0]).uuid
    }
  } catch (error) {
    const msg = error?.message || 'Failed to load versions from deploy_license.'
    upgradeVersionsError.value = msg
    enqueueNotification(msg, 'error')
  } finally {
    isLoadingUpgradeVersions.value = false
  }
}

const submitUpgradeVersionChoice = async () => {
  const server = upgradeTargetServer.value
  const uuid = selectedUpgradeVersionUuid.value
  const v = upgradeVersions.value.find((item) => item.uuid === uuid)
  if (!server || !uuid || !v) {
    enqueueNotification('Please select a version.', 'error')
    return
  }
  if (isSameProductVersion(v.version, server.version)) {
    enqueueNotification('This version is already installed on the server.', 'error')
    return
  }
  isUpgradingServer.value = true
  try {
    await upgradeServer(server.id, { versionUuid: uuid })
    enqueueNotification(`Server ${server.name} upgraded to version ${v.version}.`, 'success')
    closeUpgradeDialog()
    void loadServers()
    void loadDeployVersionsCatalog()
  } catch (error) {
    enqueueNotification(error?.message || 'Upgrade failed.', 'error')
  } finally {
    isUpgradingServer.value = false
  }
}

const closeLicenseUpgradeDialog = () => {
  if (isLicenseUpgrading.value) return
  isLicenseUpgradeDialogOpen.value = false
  licenseUpgradeTarget.value = null
  isLicenseUpgrading.value = false
}

const openLicenseUpgradeDialog = (server) => {
  activeRowMenu.value = null
  licenseUpgradeTarget.value = server
  isLicenseUpgrading.value = false
  isLicenseUpgradeDialogOpen.value = true
}

const onLicenseUpgradeSuccess = async (updated) => {
  const label = updated?.license || 'new tier'
  enqueueNotification(`License updated to ${label}.`, 'success')
  isLicenseUpgrading.value = false
  isLicenseUpgradeDialogOpen.value = false
  licenseUpgradeTarget.value = null
  void loadServers()
}

const requestDeleteConfirm = (server) => {
  confirmAction.value = 'delete'
  confirmTarget.value = server
  isConfirmDialogOpen.value = true
  activeRowMenu.value = null
}

const applyEditServer = async () => {
  const index = servers.value.findIndex((item) => item.id === editServerId.value)
  if (index === -1) return

  const updatedUsers = [...selectedUsers.value]
  try {
    await updateServer(editServerId.value, {
      name: editServer.value.name || servers.value[index].name,
      ip: editServer.value.ip || servers.value[index].ip,
      sshUser: editServer.value.username || '',
      sshPassword: editServer.value.password || '',
      sshPort: editServer.value.sshPort?.toString().trim() || '',
    })
    await updateServerUsers(editServerId.value, updatedUsers)
  } catch {
    enqueueNotification('Failed to update server.', 'error')
    return
  }
  servers.value[index] = {
    ...servers.value[index],
    name: editServer.value.name || servers.value[index].name,
    ip: editServer.value.ip || servers.value[index].ip,
    users: updatedUsers.length,
    managedUsers: updatedUsers
      .map((id) => usersById.value.get(id)?.name)
      .filter(Boolean),
    managedUserIds: updatedUsers,
    sshUser: editServer.value.username,
    sshPassword: editServer.value.password,
    sshPort: editServer.value.sshPort
  }

  enqueueNotification('Server updated successfully.', 'success')
  closeEditServerDialog()
}

const handleConfirmDialog = async () => {
  if (confirmAction.value === 'edit') {
    await applyEditServer()
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

const handleDeleteServer = async () => {
  if (!confirmTarget.value) return
  try {
    await deleteServer(confirmTarget.value.id)
    await loadServers()
    enqueueNotification('Server deleted successfully.', 'success')
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (error) {
    enqueueNotification(error?.message || 'Failed to delete server.', 'error')
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

.toast-stack {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1200;
}

.toast {
  min-width: 240px;
  max-width: 360px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--app-text);
  background: var(--app-surface-solid);
  box-shadow: 0 12px 24px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.toast.success {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(236, 253, 245, 0.95);
  color: #065f46;
}

.toast.error {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(254, 242, 242, 0.95);
  color: #b91c1c;
}
.servers-table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}


.content-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
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
  color: var(--app-heading);
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
  color: var(--app-heading);
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
  color: var(--app-heading);
}

.content-card p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.98rem;
}

.muted-text {
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.primary-btn {
  /* colors from theme.css */
}

.primary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
}

.primary-btn:disabled:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
}

.secondary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dialog-close:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dialog-card--busy {
  pointer-events: none;
}

.dialog-card--form {
  max-height: min(92vh, 880px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.dialog-card--form .dialog-header {
  flex-shrink: 0;
  margin-bottom: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--app-border);
}

.dialog-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wizard-step-label {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--app-text-muted);
}

.new-server-step-basic {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.new-server-basic-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-elevated);
}

.new-server-basic-panel h4 {
  margin: 0;
}

.new-server-basic-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.new-server-basic-panel .selected-users {
  margin-top: 0;
}

@media (max-width: 960px) {
  .new-server-step-basic {
    grid-template-columns: 1fr;
  }
}

.new-server-dialog-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  margin: 0;
  overflow: hidden;
}

.new-server-dialog-form .dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px;
  gap: 12px;
}

.new-server-dialog-form .dialog-deploy-status {
  flex-shrink: 0;
  margin: 0 16px 8px;
}

.new-server-dialog-form .dialog-footer {
  flex-shrink: 0;
  margin-top: 0;
  padding: 12px 16px;
  border-top: 1px solid var(--app-border);
  background: var(--app-surface-solid);
}

.dialog-section--license .license-tier-hint {
  margin: 8px 0 0;
  font-size: 0.8rem;
}

.dialog-section--license-full .license-tier-hint--intro {
  margin: 0 0 14px;
  font-size: 0.88rem;
}

.dialog-section--license-full .license-tier-hint--deploy {
  margin-top: 14px;
}

.new-server-step-license :deep(.tier-grid) {
  padding-bottom: 4px;
}

.dialog-section--license .license-existing-row {
  margin-top: 8px;
  padding-top: 8px;
}

.dialog-deploy-status {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--app-accent-soft);
  border: 1px solid rgba(168, 85, 247, 0.25);
  color: var(--app-accent);
  font-size: 0.9rem;
  line-height: 1.45;
}

.upgrade-server-line {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: var(--app-text);
}

.upgrade-hint {
  margin: 0 0 16px 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--app-text-muted);
}

.upgrade-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #f87171;
  font-size: 0.9rem;
}

.upgrade-version-panels {
  margin-top: 4px;
}

.dialog-card--upgrade {
  max-height: min(92vh, 900px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.dialog-card--upgrade .dialog-header {
  flex-shrink: 0;
  margin-bottom: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--app-border);
}

.dialog-card--upgrade .dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px;
}

.dialog-card--upgrade .dialog-footer {
  flex-shrink: 0;
  margin-top: 0;
  padding: 12px 16px;
  border-top: 1px solid var(--app-border);
  background: var(--app-surface-solid);
}

.btn-spinner {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: btn-spin 0.7s linear infinite;
}

.btn-spinner--inline {
  border-color: var(--app-border);
  border-top-color: var(--app-accent);
  margin-top: 2px;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

.primary-btn:disabled:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
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
  color: var(--app-text-muted);
  font-weight: 500;
}

.filter-field input,
.filter-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-field input::placeholder {
  color: var(--app-text-muted);
}

.filter-field input:focus,
.filter-field select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.table-wrap {
  overflow-x: auto;
  overflow-y: visible;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  flex: 1;
}

.servers-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.servers-table thead {
  background: var(--app-surface-elevated);
}

.servers-table th,
.servers-table td {
  text-align: left;
  padding: 14px 16px;
  font-size: 0.92rem;
  color: var(--app-text);
  border-bottom: 1px solid var(--app-border);
}

.servers-table th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
  font-weight: 600;
}

.servers-table tbody tr:hover {
  background: var(--app-surface-hover);
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.pagination-info {
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.pagination-controls {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.pagination-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  color: var(--app-text);
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-page {
  color: var(--app-text-muted);
  font-size: 0.85rem;
}

.col-layer-dots {
  width: 52px;
  padding-left: 12px !important;
  padding-right: 8px !important;
}

.server-users {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.server-user-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border: 1px solid rgba(168, 85, 247, 0.25);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  color: var(--app-text-muted);
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
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
  box-shadow: 0 4px 12px var(--app-shadow);
  transform: translateY(-1px);
}

.menu-wrap {
  position: relative;
  display: inline-flex;
  z-index: 1;
}

.menu-wrap:has(.row-menu) {
  z-index: 60;
}

.row-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 168px;
  background: var(--app-surface-solid);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  box-shadow: 0 12px 32px var(--app-shadow);
  padding: 6px;
  z-index: 50;
}

.row-menu-item {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--app-text);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.row-menu-item:hover {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.row-menu-item.danger {
  color: #f87171;
}

.row-menu-item.danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
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
  max-width: 520px;
  background: var(--app-surface-solid);
  border-radius: 18px;
  box-shadow: 0 24px 48px var(--app-shadow);
  border: 1px solid var(--app-border);
  padding: 24px;
}

.dialog-card--wide {
  max-width: 1180px;
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
  color: var(--app-heading);
}

.dialog-close {
  border: none;
  background: var(--app-surface-elevated);
  color: var(--app-text-muted);
  width: 32px;
  height: 32px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 1px solid var(--app-border);
}

.dialog-close:hover {
  background: var(--app-surface-hover);
  color: var(--app-text);
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
  color: var(--app-heading);
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
  color: var(--app-text-muted);
  font-weight: 500;
}

.dialog-field input {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: var(--app-text);
  background: var(--app-input-bg);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dialog-field input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.dialog-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  background: var(--app-input-bg);
  color: var(--app-text);
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
  color: var(--app-text-muted);
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
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
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

.combobox-option:hover {
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.combobox-empty {
  padding: 10px 12px;
  color: var(--app-text-muted);
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
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid rgba(168, 85, 247, 0.2);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.user-chip:hover {
  background: rgba(168, 85, 247, 0.25);
  color: var(--app-accent-hover);
}

.license-options {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: var(--app-text);
  cursor: pointer;
}

.radio-option input,
.checkbox-option input {
  width: 16px;
  height: 16px;
}

.license-tier-hint {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  color: var(--app-text-muted);
  line-height: 1.4;
}

.license-existing-row {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px dashed var(--app-border);
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
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.secondary-btn {
  background: var(--app-surface-elevated);
  border: 1px solid var(--app-border-strong);
  color: var(--app-text);
  transition: all 0.2s ease;
}

.secondary-btn:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
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

