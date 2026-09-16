<template>
  <div class="edges-view">
    <section class="edges-metrics" aria-label="Edge fleet metrics">
      <article
        v-for="metric in edgeMetricCards"
        :key="metric.label"
        class="edges-metric"
        :class="`edges-metric--${metric.tone}`"
      >
        <span class="edges-metric__label">{{ metric.label }}</span>
        <strong class="edges-metric__value num">{{ metric.value }}</strong>
        <span class="edges-metric__hint">{{ metric.hint }}</span>
      </article>
    </section>

    <div class="edges-filterbar">
      <div class="edges-filter-field edges-filter-field--grow">
        <label for="edge-name-filter">Name</label>
        <input
          id="edge-name-filter"
          v-model="filters.name"
          type="search"
          placeholder="Search by name…"
        />
      </div>
      <div class="edges-filter-field">
        <label for="edge-ip-filter">IP</label>
        <input
          id="edge-ip-filter"
          v-model="filters.ip"
          type="search"
          placeholder="Search by IP…"
        />
      </div>
      <div class="edges-filter-field">
        <label for="edge-angelos-filter">Angelos</label>
        <select id="edge-angelos-filter" v-model="filters.angelos">
          <option value="">All</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="deployed">Deployed</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>
      <div class="edges-filter-field">
        <label for="edge-license-filter">License</label>
        <select id="edge-license-filter" v-model="filters.license">
          <option value="">All</option>
          <option value="Trial">Trial</option>
          <option value="L4">L4</option>
          <option value="L7">L7</option>
          <option value="Unified">Unified</option>
        </select>
      </div>
      <div class="edges-filter-summary">
        <span class="edges-live-dot" aria-hidden="true"></span>
        {{ filteredServers.length }} shown · runtime status
      </div>
    </div>

    <section class="edges-panel">
      <div class="edges-panel__head">
        <div class="edges-panel__head-left">
          <h3>Edge nodes</h3>
          <span class="edges-count-tag">{{ filteredServers.length }}</span>
        </div>
        <button class="edges-primary-btn" type="button" @click="openNewServerDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Edge
        </button>
      </div>

      <div class="edges-table-wrap">
        <table class="edges-table">
          <thead>
            <tr>
              <th class="edges-col-layers" aria-label="L4 and L7 status"></th>
              <th>Edge</th>
              <th>Angelos</th>
              <th>License</th>
              <th>Users</th>
              <th>Version</th>
              <th>OS</th>
              <th>Expires</th>
              <th>Created</th>
              <th class="edges-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filteredServers.length">
              <td colspan="10" class="edges-empty">
                No edges match these filters.
                <button class="edges-empty-link" type="button" @click="openNewServerDialog">Create an edge</button>
              </td>
            </tr>
            <tr
              v-for="server in paginatedServers"
              :key="server.id"
              class="edges-row"
              :class="edgeRowClass(server)"
            >
              <td class="edges-col-layers">
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
              <td>
                <div class="edges-identity">
                  <span class="edges-identity__name">{{ server.name }}</span>
                  <span class="edges-identity__ip num">{{ server.ip }}</span>
                </div>
              </td>
              <td>
                <div
                  class="edges-angelos"
                  :class="isRuntimeStatusRefreshing(server.id) ? 'edges-angelos--loading' : `edges-angelos--${angelosStatusClass(server)}`"
                  :aria-busy="isRuntimeStatusRefreshing(server.id)"
                  :aria-label="isRuntimeStatusRefreshing(server.id) ? 'Angelos: checking status' : undefined"
                >
                  <span class="edges-angelos__dot" aria-hidden="true"></span>
                  <strong v-if="!isRuntimeStatusRefreshing(server.id)">{{ angelosStatusLabel(server) }}</strong>
                  <strong v-else>Checking…</strong>
                </div>
              </td>
              <td>
                <span class="edges-license">{{ server.license || '—' }}</span>
              </td>
              <td>
                <div v-if="server.managedUsers?.length" class="edges-users">
                  <span
                    v-for="user in server.managedUsers.slice(0, 2)"
                    :key="user"
                    class="edges-user-chip"
                  >
                    {{ user }}
                  </span>
                  <span
                    v-if="server.managedUsers.length > 2"
                    class="edges-user-more"
                    :title="server.managedUsers.slice(2).join(', ')"
                  >
                    +{{ server.managedUsers.length - 2 }}
                  </span>
                </div>
                <span v-else class="edges-muted">—</span>
              </td>
              <td>
                <span class="edges-meta num">{{ displayServerVersion(server.version) }}</span>
              </td>
              <td>
                <span class="edges-meta">{{ displayServerOs(server.os) }}</span>
              </td>
              <td>
                <div
                  class="edges-expiry"
                  :class="`edges-expiry--${licenseExpiryTone(server)}`"
                >
                  <strong>{{ formatEdgeExpiryLabel(server) }}</strong>
                  <span v-if="server.expiredDate">{{ server.expiredDate }}</span>
                </div>
              </td>
              <td>
                <span class="edges-meta">{{ server.created || '—' }}</span>
              </td>
              <td class="edges-col-actions">
                <div class="menu-wrap">
                  <button
                    class="edges-icon-btn"
                    title="Settings"
                    type="button"
                    @click.stop="toggleRowMenu(server.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                  <div v-if="activeRowMenu === server.id" class="row-menu">
                    <button class="row-menu-item" type="button" @click="openEditServer(server)">
                      Edit
                    </button>
                    <button class="row-menu-item" type="button" @click="openUpgradeDialog(server)">
                      Upgrade
                    </button>
                    <button
                      class="row-menu-item"
                      type="button"
                      :disabled="isRuntimeStatusRefreshing(server.id)"
                      @click="refreshRuntimeStatus(server)"
                    >
                      {{ isRuntimeStatusRefreshing(server.id) ? 'Refreshing…' : 'Refresh status' }}
                    </button>
                    <button class="row-menu-item" type="button" @click="openLicenseUpgradeDialog(server)">
                      License
                    </button>
                    <button class="row-menu-item danger" type="button" @click="requestDeleteConfirm(server)">
                      Delete
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="edges-footer">
        <span class="edges-footer__info num">
          {{ pageStart }}–{{ pageEnd }} of {{ filteredServers.length }}
        </span>
        <div class="edges-footer__pager">
          <button class="edges-pager-btn" type="button" :disabled="currentPage === 1" @click="prevPage">
            Prev
          </button>
          <span class="edges-footer__page num">{{ currentPage }} / {{ totalPages }}</span>
          <button class="edges-pager-btn" type="button" :disabled="currentPage === totalPages" @click="nextPage">
            Next
          </button>
        </div>
      </div>
    </section>
  </div>

  <div
    v-if="isNewServerDialogOpen"
    class="dialog-backdrop"
    @click="!isCreatingServer && !isLoadingCreateVersions && closeNewServerDialog()"
  >
    <div
      class="dialog-card dialog-card--wide dialog-card--form dialog-card--edge-wizard"
      :class="{ 'dialog-card--busy': isCreatingServer || isLoadingCreateVersions }"
      @click.stop
    >
      <div class="dialog-header">
        <div class="dialog-header-text">
          <p class="edge-wizard-kicker">Infrastructure</p>
          <h3>New Edge</h3>
          <p class="wizard-step-label">
            Step {{ newServerStep }} of {{ edgeWizardSteps.length }} — {{ currentEdgeWizardStep.label }}
          </p>
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

      <nav class="edge-wizard-steps" aria-label="New edge steps">
        <button
          v-for="(step, index) in edgeWizardSteps"
          :key="step.id"
          type="button"
          class="edge-wizard-step"
          :class="{
            'is-active': index + 1 === newServerStep,
            'is-complete': index + 1 < newServerStep,
            'is-reachable': index + 1 <= newServerStep,
          }"
          :disabled="isCreatingServer || isLoadingCreateVersions || index + 1 > newServerStep"
          :aria-current="index + 1 === newServerStep ? 'step' : undefined"
          @click="goToNewServerStep(index + 1)"
        >
          <span class="edge-wizard-step__index">{{ index + 1 }}</span>
          <span class="edge-wizard-step__label">{{ step.label }}</span>
        </button>
      </nav>

      <aside class="edge-wizard-guide" :aria-label="`${currentEdgeWizardStep.label} guidance`">
        <div class="edge-wizard-guide__title">{{ currentEdgeWizardStep.title }}</div>
        <p class="edge-wizard-guide__lead">{{ currentEdgeWizardStep.description }}</p>
        <ul class="edge-wizard-guide__list">
          <li v-for="tip in currentEdgeWizardStep.tips" :key="tip">{{ tip }}</li>
        </ul>
      </aside>

      <form class="new-server-dialog-form" @submit.prevent="onNewServerFormSubmit">
      <div class="dialog-body">
        <div v-show="newServerStep === 1" class="new-server-step-basic">
        <div class="new-server-basic-panel dialog-section">
          <p class="edge-panel-kicker">Host</p>
          <h4>Connection</h4>
          <div class="new-server-basic-fields">
            <div class="dialog-field">
              <label for="new-server-name">Name</label>
              <input
                id="new-server-name"
                v-model="newServer.name"
                type="text"
                autocomplete="off"
                placeholder="edge-eu-1"
              />
            </div>
            <div class="dialog-field">
              <label for="new-server-ip">IP address</label>
              <input
                id="new-server-ip"
                v-model="newServer.ip"
                type="text"
                placeholder="203.0.113.10"
              />
            </div>
          </div>
          <div v-if="createSubmitError && newServerStep === 1" class="upgrade-error" role="alert">
            {{ createSubmitError }}
          </div>
        </div>

        <div class="new-server-basic-panel dialog-section">
          <p class="edge-panel-kicker">Access</p>
          <h4>SSH</h4>
          <div class="new-server-basic-fields">
            <div class="dialog-field">
              <label for="new-server-username">Username</label>
              <input
                id="new-server-username"
                v-model="newServer.username"
                type="text"
                placeholder="root"
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
          <p class="edge-panel-kicker">Access control</p>
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
        <div class="dialog-section edge-wizard-section">
          <p class="edge-panel-kicker">Deploy</p>
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
        <div class="dialog-section dialog-section--license dialog-section--license-full edge-wizard-section">
          <p class="edge-panel-kicker">Entitlement</p>
          <h4>License</h4>
          <div v-if="createSubmitError" class="upgrade-error" role="alert">
            {{ createSubmitError }}
          </div>
          <p class="license-tier-hint license-tier-hint--intro">
            Select a license tier for this deployment. Each plan lists pricing and included capabilities below.
          </p>
          <LicenseTierSelector
            v-model="licenseTier"
            v-model:billing-period="licenseBillingPeriod"
            aria-label="License type for new edge"
            @update:model-value="onLicenseTierChange"
          />
          <p class="license-tier-hint license-tier-hint--deploy">
            <template v-if="licenseTier === 'Trial'">
              A new 3-day trial license will be generated and bound to the target host.
            </template>
            <template v-else>
              A new {{ licenseTier }} license
              ({{ licenseBillingPeriod === 'monthly' ? '30 days' : '365 days' }},
              billed {{ licenseBillingPeriod }}) will be generated for the target host.
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
      <div class="dialog-footer dialog-footer--wizard">
        <button
          class="secondary-btn"
          type="button"
          :disabled="isCreatingServer || isLoadingCreateVersions"
          @click="newServerStep === 1 ? closeNewServerDialog() : goToPrevNewServerStep()"
        >
          {{ newServerStep === 1 ? 'Cancel' : 'Back' }}
        </button>
        <div class="dialog-footer__actions">
          <span class="edge-wizard-progress">
            Step {{ newServerStep }} of {{ edgeWizardSteps.length }}
          </span>
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
        <h3>Edit Edge</h3>
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
                placeholder="Enter edge name"
              />
            </div>
            <div class="dialog-field">
              <label for="edit-server-ip">IP</label>
              <input
                id="edit-server-ip"
                v-model="editServer.ip"
                type="text"
                placeholder="Enter edge IP"
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
      class="dialog-card dialog-card--form dialog-card--upgrade"
      :class="{ 'dialog-card--busy': isLoadingUpgradeVersions || isUpgradingServer }"
      @click.stop
    >
      <div class="dialog-header">
        <div class="dialog-header-text">
          <p class="edge-wizard-kicker">Edge software</p>
          <h3>Upgrade edge</h3>
          <p class="wizard-step-label">
            Deploy a newer Dorian build to this host. License and SSH settings stay unchanged.
          </p>
        </div>
        <button
          class="dialog-close"
          type="button"
          aria-label="Close dialog"
          :disabled="isLoadingUpgradeVersions || isUpgradingServer"
          @click="closeUpgradeDialog"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="dialog-body upgrade-dialog-body">
        <section v-if="upgradeTargetServer" class="upgrade-edge-panel" aria-label="Target edge">
          <div class="upgrade-edge-panel__identity">
            <div class="upgrade-edge-panel__name-row">
              <strong class="upgrade-edge-panel__name">{{ upgradeTargetServer.name || 'Edge' }}</strong>
              <span
                class="upgrade-edge-status"
                :class="`upgrade-edge-status--${angelosStatusClass(upgradeTargetServer)}`"
              >
                {{ angelosStatusLabel(upgradeTargetServer) }}
              </span>
            </div>
            <span class="upgrade-edge-panel__ip num">{{ upgradeTargetServer.ip || '—' }}</span>
          </div>
          <dl class="upgrade-facts">
            <div class="upgrade-fact">
              <dt>OS</dt>
              <dd>{{ upgradeTargetOsLabel }}</dd>
            </div>
            <div class="upgrade-fact">
              <dt>Installed</dt>
              <dd class="num">{{ displayServerVersion(upgradeTargetServer.version) }}</dd>
            </div>
            <div class="upgrade-fact">
              <dt>License</dt>
              <dd>{{ upgradeTargetServer.license || '—' }}</dd>
            </div>
            <div class="upgrade-fact">
              <dt>Catalog</dt>
              <dd class="num">{{ upgradeCatalogSummary }}</dd>
            </div>
          </dl>
        </section>

        <section
          v-if="upgradeTargetServer && selectedUpgradeVersion"
          class="upgrade-path"
          aria-label="Upgrade path"
        >
          <div class="upgrade-path__side">
            <span class="upgrade-path__label">Current</span>
            <strong class="upgrade-path__version num">
              v{{ normalizeVersionLabel(upgradeTargetServer.version) || '—' }}
            </strong>
            <span class="upgrade-path__meta">{{ upgradeTargetOsLabel }}</span>
          </div>
          <div class="upgrade-path__arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </div>
          <div class="upgrade-path__side upgrade-path__side--target">
            <span class="upgrade-path__label">Deploy</span>
            <strong class="upgrade-path__version num">
              v{{ normalizeVersionLabel(selectedUpgradeVersion.version) || '—' }}
            </strong>
            <span class="upgrade-path__meta">
              <template v-if="upgradePathDelta">{{ upgradePathDelta }} · </template>
              {{ selectedUpgradePackageLabel }}
            </span>
          </div>
        </section>

        <section class="upgrade-version-section">
          <div class="upgrade-version-head">
            <h4 class="upgrade-version-heading">Available builds</h4>
            <p class="upgrade-version-sub">
              Filtered to {{ upgradeTargetOsLabel }}. Angelos packages the build and restarts edge services.
            </p>
          </div>

          <div v-if="isLoadingUpgradeVersions" class="dialog-deploy-status" role="status">
            Loading available versions…
          </div>
          <div v-else-if="isUpgradingServer" class="dialog-deploy-status" role="status">
            Upgrading remote edge (this may take several minutes)…
          </div>
          <div v-else-if="upgradeVersionsError" class="upgrade-error" role="alert">
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
        </section>
      </div>

      <div class="dialog-footer">
        <span class="edge-wizard-progress">
          <template v-if="isUpgradingServer">Deploying upgrade…</template>
          <template v-else-if="selectedUpgradeVersionLabel">
            Selected {{ selectedUpgradeVersionLabel }}
          </template>
          <template v-else>Select a version to continue</template>
        </span>
        <div class="dialog-footer-actions">
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
            <span v-if="isUpgradingServer" class="btn-spinner" aria-hidden="true"></span>
            {{ isUpgradingServer ? 'Upgrading…' : 'Upgrade edge' }}
          </button>
        </div>
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
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
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
  normalizeVersionLabel,
  versionPackageLabel,
} from '@/utils/deployVersions'
import {
  angelosStatusClass,
  angelosStatusLabel,
  layerDotDescription,
  layerDotTitle,
  resolveAngelosRuntimeStatus,
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
import { BILLING_PERIODS } from '@/data/licensePlans'
import { notifyError, notifySuccess } from '@/utils/notify'

/** Synchronous guard: reactive isCreatingServer can still allow parallel createServer() in the same tick. */
let createServerSyncLock = false

const isNewServerDialogOpen = ref(false)
const newServerStep = ref(1)
const edgeWizardSteps = [
  {
    id: 'connection',
    label: 'Connection',
    title: 'Connect to the host',
    description: 'Identify the edge and provide SSH credentials so Angelos can install packages.',
    tips: [
      'Use a reachable public or private IP the control plane can SSH to.',
      'Prefer a dedicated deploy user with sudo when possible.',
      'Assign management users who should see this edge in the console.',
    ],
  },
  {
    id: 'version',
    label: 'Version',
    title: 'Choose a build',
    description: 'We detect the host OS, then show compatible Dorian packages to deploy.',
    tips: [
      'Pick the latest stable build unless you need a specific patch.',
      'OS detection runs over SSH when you leave the Connection step.',
      'If no versions appear, confirm the host OS is supported.',
    ],
  },
  {
    id: 'license',
    label: 'License',
    title: 'Pick entitlement',
    description: 'Select Trial, L4, L7, or Unified capacity for this edge before deploy.',
    tips: [
      'Trial is best for smoke tests and short evaluations.',
      'L4 / L7 / Unified unlock the matching protection layers.',
      'You can upload an existing .lic file instead of generating one.',
    ],
  },
]
const currentEdgeWizardStep = computed(
  () => edgeWizardSteps[Math.max(0, Math.min(edgeWizardSteps.length, newServerStep.value) - 1)],
)
const detectedHostOs = ref('')
const isCreatingServer = ref(false)
const auth = useAuth()
const allUsers = ref([])
const selectedUsers = ref([])
const isUserDropdownOpen = ref(false)
const licenseTier = ref('Trial')
const licenseBillingPeriod = ref(BILLING_PERIODS.ANNUAL)
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
const createSubmitError = ref('')
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

const selectedUpgradeVersion = computed(() => {
  const uuid = selectedUpgradeVersionUuid.value
  if (!uuid) return null
  return upgradeVersions.value.find((v) => v.uuid === uuid) || null
})

const selectedUpgradeVersionLabel = computed(() => {
  const picked = selectedUpgradeVersion.value
  if (!picked) return ''
  const os = formatVersionOs(picked.os)
  return os ? `${picked.version} · ${os}` : String(picked.version || '')
})

const upgradeCatalogSummary = computed(() => {
  const total = upgradeVersions.value.length
  if (!total) return '—'
  const latest = normalizeVersionLabel(upgradeVersions.value[0]?.version)
  if (total === 1) return latest ? `1 build · v${latest}` : '1 build'
  return latest ? `${total} builds · latest v${latest}` : `${total} builds`
})

const upgradePathDelta = computed(() => {
  const current = normalizeVersionLabel(upgradeTargetServer.value?.version)
  const target = normalizeVersionLabel(selectedUpgradeVersion.value?.version)
  if (!current || !target || current === target) return ''
  if (
    upgradeVersions.value[0] &&
    isSameProductVersion(selectedUpgradeVersion.value?.version, upgradeVersions.value[0]?.version)
  ) {
    return 'Latest'
  }
  return 'Selected'
})

const selectedUpgradePackageLabel = computed(() => {
  const picked = selectedUpgradeVersion.value
  if (!picked) return ''
  return versionPackageLabel(picked)
})

const isLicenseUpgradeDialogOpen = ref(false)
const licenseUpgradeTarget = ref(null)
const isLicenseUpgrading = ref(false)
const servers = ref([])
const deployVersionsCatalog = ref([])
const pageSize = ref(8)
const currentPage = ref(1)
const filters = reactive({
  name: '',
  ip: '',
  angelos: '',
  license: '',
})
const newServer = ref({
  name: '',
  ip: '',
  username: '',
  password: '',
  sshPort: ''
})

const filteredServers = computed(() => {
  const nameQuery = filters.name.trim().toLowerCase()
  const ipQuery = filters.ip.trim().toLowerCase()
  return servers.value.filter((server) => {
    if (nameQuery && !String(server.name || '').toLowerCase().includes(nameQuery)) return false
    if (ipQuery && !String(server.ip || '').toLowerCase().includes(ipQuery)) return false
    if (filters.angelos && resolveAngelosRuntimeStatus(server) !== filters.angelos) return false
    if (filters.license && String(server.license || '') !== filters.license) return false
    return true
  })
})

const edgeMetricCards = computed(() => {
  const list = servers.value
  const total = list.length
  const angelosRunning = list.filter((server) => resolveAngelosRuntimeStatus(server) === 'running').length
  const l4Running = list.filter((server) => resolveLayerStatus(server, 'l4') === 'running').length
  const l7Running = list.filter((server) => resolveLayerStatus(server, 'l7') === 'running').length
  const licenseRisk = list.filter((server) => {
    const tone = licenseExpiryTone(server)
    return tone === 'expired' || tone === 'expiring'
  }).length
  return [
    { label: 'Edges', value: String(total), hint: 'Registered nodes', tone: 'viper' },
    { label: 'Angelos', value: String(angelosRunning), hint: 'Runtime healthy', tone: 'signal' },
    { label: 'L4 live', value: String(l4Running), hint: 'Sparta running', tone: 'l4' },
    { label: 'L7 live', value: String(l7Running), hint: 'Athens running', tone: 'ok' },
    { label: 'License risk', value: String(licenseRisk), hint: 'Expired or ≤14d', tone: 'warn' },
  ]
})

const licenseExpiryTone = (server) => {
  const raw = server?.expiredDate
  if (!raw || raw === '—') return 'none'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return 'none'
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000)
  if (days < 0) return 'expired'
  if (days <= 14) return 'expiring'
  return 'ok'
}

const formatEdgeExpiryLabel = (server) => {
  const tone = licenseExpiryTone(server)
  if (tone === 'expired') return 'Expired'
  if (tone === 'expiring') {
    const days = Math.ceil((new Date(server.expiredDate).getTime() - Date.now()) / 86400000)
    return days === 0 ? 'Expires today' : `${days}d left`
  }
  if (tone === 'ok') return 'Active'
  return '—'
}

const edgeRowClass = (server) => {
  const classes = []
  if (resolveAngelosRuntimeStatus(server) === 'running') classes.push('edges-row--live')
  if (resolveAngelosRuntimeStatus(server) === 'stopped') classes.push('edges-row--stopped')
  const tone = licenseExpiryTone(server)
  if (tone === 'expired') classes.push('edges-row--license-danger')
  else if (tone === 'expiring') classes.push('edges-row--license-warn')
  return classes
}

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
  if (confirmAction.value === 'delete') return 'Delete edge'
  if (confirmAction.value === 'edit') return 'Edge is modified'
  return 'Confirm action'
})

const confirmMessage = computed(() => {
  if (confirmAction.value === 'delete') {
    return 'Are you sure you want to delete this edge? This action cannot be undone.'
  }
  if (confirmAction.value === 'edit') {
    return 'Are you sure you want to apply these changes to the edge?'
  }
  return 'Are you sure you want to continue?'
})

const confirmConfirmText = computed(() => {
  if (confirmAction.value === 'delete') return 'Delete'
  if (confirmAction.value === 'edit') return 'Apply'
  return 'Confirm'
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredServers.value.length / pageSize.value))
)

const paginatedServers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredServers.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() =>
  filteredServers.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0
)

const pageEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, filteredServers.value.length)
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

const goToNewServerStep = (step) => {
  const target = Number(step)
  if (!Number.isFinite(target) || target < 1 || target > newServerStep.value) return
  if (isCreatingServer.value || isLoadingCreateVersions.value) return
  newServerStep.value = target
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
  licenseBillingPeriod.value = BILLING_PERIODS.ANNUAL
  useExistingLicense.value = false
  licenseFileName.value = ''
  createVersions.value = []
  createVersionsError.value = ''
  createSubmitError.value = ''
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
  () => [filters.name, filters.ip, filters.angelos, filters.license],
  () => {
    currentPage.value = 1
  },
)

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

const enqueueNotification = (message, type = 'success', title = 'Edge Management') => {
  if (type === 'error') notifyError(title, message)
  else notifySuccess(title, message)
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
  createSubmitError.value = ''
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
    billingPeriod: licenseBillingPeriod.value,
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
    enqueueNotification(`The edge is successfully created.${detail}`, 'success')
    currentPage.value = 1
    // Clear busy state before closing so the dialog is not stuck behind pointer-events: none.
    isCreatingServer.value = false
    createSubmitError.value = ''
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
        'The create request timed out in the browser, but the edge may already exist. Refreshing the list.',
        'error'
      )
      void loadServers()
      isCreatingServer.value = false
      await nextTick()
      isNewServerDialogOpen.value = false
    } else {
      const msg = error?.message || 'The edge could not be created.'
      createSubmitError.value = msg
      enqueueNotification(msg, 'error')
      // Keep the wizard open so the customer can change host/credentials and retry.
      isCreatingServer.value = false
      newServerStep.value = 1
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
    enqueueNotification(`The runtime status is successfully refreshed for ${server.name}.`, 'success')
    await loadServers()
  } catch (error) {
    const msg = error?.message || 'The runtime status could not be refreshed.'
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
    const msg = error?.message || 'The product versions could not be loaded.'
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
    enqueueNotification('This version is already installed on the edge.', 'error')
    return
  }
  isUpgradingServer.value = true
  try {
    await upgradeServer(server.id, { versionUuid: uuid })
    enqueueNotification(`The edge is successfully upgraded to version ${v.version}.`, 'success')
    closeUpgradeDialog()
    void loadServers()
    void loadDeployVersionsCatalog()
  } catch (error) {
    enqueueNotification(error?.message || 'The edge could not be upgraded.', 'error')
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
  enqueueNotification(`The license is successfully updated to ${label}.`, 'success', 'License Management')
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
    enqueueNotification('The edge could not be updated.', 'error')
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

  enqueueNotification('The edge is successfully updated.', 'success')
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
    enqueueNotification('The edge is successfully deleted.', 'success')
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (error) {
    enqueueNotification(error?.message || 'The edge could not be deleted.', 'error')
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

.edges-view {
  --edges-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 1680px;
  margin: 0 auto;
  min-height: 100%;
  font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.edges-primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--edges-radius);
  padding: 8px 12px;
  background: var(--dorian-viper-500, var(--app-accent));
  color: #08120e;
  font-weight: 650;
  font-size: 13px;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.edges-primary-btn svg {
  width: 14px;
  height: 14px;
}

.edges-primary-btn:hover {
  filter: brightness(1.06);
}

.edges-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.edges-metric {
  position: relative;
  overflow: hidden;
  padding: 12px 14px 12px 16px;
  border-radius: var(--edges-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
}

.edges-metric::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--metric-accent, var(--dorian-viper-500, var(--app-accent)));
}

.edges-metric--viper { --metric-accent: var(--dorian-viper-500, #2e9e6c); }
.edges-metric--signal { --metric-accent: var(--dorian-viper-400, #3fbd85); }
.edges-metric--l4 { --metric-accent: #5b9df0; }
.edges-metric--ok { --metric-accent: #4fbd7a; }
.edges-metric--warn { --metric-accent: #e0a83f; }

.edges-metric__label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  font-weight: 600;
}

.edges-metric__value {
  display: block;
  margin-top: 6px;
  font-size: 1.3rem;
  font-weight: 650;
  color: var(--app-heading);
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.edges-metric__hint {
  display: block;
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.edges-filterbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--edges-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
}

.edges-filter-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 128px;
}

.edges-filter-field--grow {
  flex: 1 1 180px;
  min-width: 160px;
}

.edges-filter-field label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.edges-filter-field input,
.edges-filter-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 6px;
  padding: 8px 11px;
  font-size: 13px;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
}

.edges-filter-field input:focus,
.edges-filter-field select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.edges-filter-summary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(46, 158, 108, 0.08);
  color: var(--dorian-viper-400, var(--app-accent));
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.edges-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dorian-viper-400, var(--app-accent));
  box-shadow: 0 0 0 3px rgba(63, 189, 133, 0.16);
  animation: edges-live-pulse 1.8s ease-in-out infinite;
}

@keyframes edges-live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.edges-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--edges-radius);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  overflow: hidden;
}

.edges-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface-elevated) 70%, transparent);
}

.edges-panel__head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.edges-panel__head h3 {
  margin: 0;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
}

.edges-count-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--app-border);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  color: var(--app-text-muted);
}

.edges-table-wrap {
  overflow-x: auto;
  flex: 1;
}

.edges-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.edges-table th,
.edges-table td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--app-border);
  vertical-align: middle;
}

.edges-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--app-surface-elevated);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--app-text-muted);
  font-weight: 650;
}

.edges-row {
  transition: background 0.12s ease;
  box-shadow: inset 3px 0 0 transparent;
}

.edges-row:hover {
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 6%, transparent);
}

.edges-row--live {
  box-shadow: inset 3px 0 0 var(--dorian-viper-500, #2e9e6c);
}

.edges-row--license-danger {
  background: rgba(225, 82, 65, 0.05);
}

.edges-row--license-danger:hover {
  background: rgba(225, 82, 65, 0.09);
}

.edges-row--license-warn {
  background: rgba(224, 168, 63, 0.05);
}

.edges-row--license-warn:hover {
  background: rgba(224, 168, 63, 0.09);
}

.edges-col-layers {
  width: 52px;
  padding-left: 14px !important;
}

.edges-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.edges-identity__name {
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
  line-height: 1.25;
}

.edges-identity__ip {
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.edges-angelos {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.edges-angelos__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
}

.edges-angelos strong {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.edges-angelos--running {
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.14);
  border-color: rgba(46, 158, 108, 0.32);
}

.edges-angelos--running .edges-angelos__dot {
  box-shadow: 0 0 0 3px rgba(63, 189, 133, 0.2);
  animation: edges-live-pulse 1.8s ease-in-out infinite;
}

.edges-angelos--deployed {
  color: #5b9df0;
  background: rgba(91, 157, 240, 0.14);
  border-color: rgba(91, 157, 240, 0.3);
}

.edges-angelos--stopped {
  color: #e15241;
  background: rgba(225, 82, 65, 0.14);
  border-color: rgba(225, 82, 65, 0.34);
}

.edges-angelos--unknown,
.edges-angelos--loading {
  color: var(--app-text-muted);
  background: rgba(139, 151, 143, 0.12);
  border-color: rgba(139, 151, 143, 0.24);
}

.edges-license {
  font-size: 12.5px;
  font-weight: 650;
  color: var(--app-heading);
}

.edges-users {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.edges-user-chip,
.edges-user-more {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid rgba(46, 158, 108, 0.24);
  background: rgba(46, 158, 108, 0.1);
  color: var(--dorian-viper-400, #3fbd85);
  font-size: 11.5px;
  font-weight: 600;
}

.edges-user-more {
  border-color: var(--app-border);
  background: rgba(139, 151, 143, 0.1);
  color: var(--app-text-muted);
}

.edges-meta {
  font-size: 12.5px;
  color: var(--app-text);
}

.edges-muted {
  color: var(--app-text-muted);
  font-size: 12.5px;
}

.edges-expiry {
  display: inline-flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.edges-expiry strong {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.edges-expiry span {
  font-size: 10px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  opacity: 0.82;
}

.edges-expiry--ok {
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.14);
  border-color: rgba(46, 158, 108, 0.32);
}

.edges-expiry--expiring {
  color: #d4921f;
  background: rgba(224, 168, 63, 0.14);
  border-color: rgba(224, 168, 63, 0.32);
}

.edges-expiry--expired {
  color: #e15241;
  background: rgba(225, 82, 65, 0.14);
  border-color: rgba(225, 82, 65, 0.34);
}

.edges-expiry--none {
  color: var(--app-text-muted);
  background: transparent;
  border-color: transparent;
  padding-left: 0;
}

.edges-col-actions {
  width: 48px;
}

.edges-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.edges-icon-btn svg {
  width: 14px;
  height: 14px;
}

.edges-icon-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.edges-empty {
  text-align: center;
  padding: 40px 16px !important;
  color: var(--app-text-muted);
  font-size: 13px;
}

.edges-empty-link {
  display: inline;
  margin-left: 6px;
  border: none;
  background: none;
  color: var(--dorian-viper-400, var(--app-accent));
  font-weight: 650;
  cursor: pointer;
  padding: 0;
}

.edges-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface-elevated) 70%, transparent);
}

.edges-footer__info,
.edges-footer__page {
  font-size: 12px;
  color: var(--app-text-muted);
}

.edges-footer__pager {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.edges-pager-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface);
  color: var(--app-text);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.edges-pager-btn:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent);
}

.edges-pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.menu-wrap {
  position: relative;
  display: inline-flex;
}

.menu-wrap:has(.row-menu) {
  z-index: 5;
}

.row-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 148px;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-elevated, var(--app-surface));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  z-index: 20;
}

.row-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--app-text);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12.5px;
  cursor: pointer;
}

.row-menu-item:hover:not(:disabled) {
  background: color-mix(in srgb, var(--app-accent) 10%, transparent);
  color: var(--app-accent);
}

.row-menu-item.danger {
  color: #e15241;
}

.row-menu-item.danger:hover:not(:disabled) {
  background: rgba(225, 82, 65, 0.1);
  color: #e15241;
}

.row-menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .edges-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .edges-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .edges-filter-summary {
    margin-left: 0;
    width: 100%;
  }
}

.servers-view { display: none; }

.servers-table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}


.content-card {
  background: var(--app-surface);
  backdrop-filter: blur(20px);
  border-radius: 10px;
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 0.5px solid var(--app-border);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.content-card h2 {
  font-size: var(--type-section-title);
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
  font-size: var(--type-section-title);
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
  font-size: var(--type-section-title);
  font-weight: 600;
  color: var(--app-heading);
}

.content-card p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: var(--type-base);
}

.muted-text {
  color: var(--app-text-muted);
  font-size: var(--type-base);
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
  max-height: min(92vh, 900px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.dialog-card--edge-wizard {
  max-width: 860px;
}

.dialog-card--form .dialog-header {
  flex-shrink: 0;
  margin-bottom: 0;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--app-border);
}

.dialog-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.edge-wizard-kicker {
  margin: 0 0 2px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.wizard-step-label {
  margin: 0;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--app-text-muted);
}

.edge-wizard-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 16px 0;
  flex-shrink: 0;
}

.edge-wizard-step {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface-elevated) 80%, transparent);
  color: var(--app-text-muted);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.edge-wizard-step:disabled {
  cursor: default;
  opacity: 0.55;
}

.edge-wizard-step.is-reachable:not(:disabled):hover {
  border-color: rgba(46, 158, 108, 0.45);
  color: var(--dorian-viper-400, #3fbd85);
}

.edge-wizard-step.is-complete {
  border-color: rgba(46, 158, 108, 0.28);
  color: var(--dorian-viper-400, #3fbd85);
  background: rgba(46, 158, 108, 0.1);
}

.edge-wizard-step.is-active {
  border-color: rgba(46, 158, 108, 0.45);
  background: rgba(46, 158, 108, 0.12);
  color: var(--app-heading);
  opacity: 1;
  box-shadow: inset 0 -2px 0 var(--dorian-viper-500, var(--app-accent));
}

.edge-wizard-step__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid currentColor;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  font-weight: 650;
}

.edge-wizard-step.is-active .edge-wizard-step__index,
.edge-wizard-step.is-complete .edge-wizard-step__index {
  background: var(--dorian-viper-500, #2e9e6c);
  border-color: var(--dorian-viper-500, #2e9e6c);
  color: #08120e;
}

.edge-wizard-step__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 650;
}

.edge-wizard-guide {
  margin: 12px 16px 0;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(46, 158, 108, 0.24);
  background: rgba(46, 158, 108, 0.08);
  flex-shrink: 0;
}

.edge-wizard-guide__title {
  margin: 0 0 4px;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
}

.edge-wizard-guide__lead {
  margin: 0 0 8px;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--app-text-muted);
}

.edge-wizard-guide__list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edge-wizard-guide__list li {
  font-size: 12px;
  line-height: 1.4;
  color: var(--app-text-secondary, var(--app-text-muted));
}

.edge-panel-kicker {
  margin: 0 0 3px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.edge-wizard-section h4,
.new-server-basic-panel h4 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 650;
  color: var(--app-heading);
}

.new-server-step-basic {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.new-server-basic-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-elevated, var(--app-surface));
}

.new-server-basic-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.new-server-basic-panel .selected-users {
  margin-top: 0;
}

@media (max-width: 960px) {
  .new-server-step-basic {
    grid-template-columns: 1fr;
  }

  .edge-wizard-steps {
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

.dialog-footer--wizard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dialog-footer__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.edge-wizard-progress {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
  font-weight: 650;
  color: var(--app-text-muted);
}

.dialog-section--license .license-tier-hint {
  margin: 8px 0 0;
  font-size: var(--type-caption);
}

.dialog-section--license-full .license-tier-hint--intro {
  margin: 0 0 14px;
  font-size: var(--type-base);
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
  border: 1px solid rgba(46, 158, 108, 0.25);
  color: var(--app-accent);
  font-size: var(--type-base);
  line-height: 1.45;
}

.upgrade-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 2px;
}

.upgrade-edge-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface-elevated) 70%, transparent);
}

.upgrade-edge-panel__identity {
  min-width: 0;
}

.upgrade-edge-panel__name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.upgrade-edge-panel__name {
  font-size: 15px;
  font-weight: 650;
  color: var(--app-heading);
  letter-spacing: -0.01em;
}

.upgrade-edge-panel__ip {
  display: block;
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--app-text-muted);
}

.upgrade-edge-status {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--app-border);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  background: color-mix(in srgb, var(--app-surface) 80%, transparent);
}

.upgrade-edge-status--running {
  color: var(--dorian-viper-400, var(--app-accent));
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 35%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 12%, transparent);
}

.upgrade-edge-status--deployed {
  color: #5b9df0;
  border-color: color-mix(in srgb, #5b9df0 35%, var(--app-border));
  background: color-mix(in srgb, #5b9df0 12%, transparent);
}

.upgrade-edge-status--stopped {
  color: #e15241;
  border-color: color-mix(in srgb, #e15241 35%, var(--app-border));
  background: color-mix(in srgb, #e15241 12%, transparent);
}

.upgrade-facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.upgrade-fact {
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
}

.upgrade-fact dt {
  margin: 0 0 3px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 9.5px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.upgrade-fact dd {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--app-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upgrade-path {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 28%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 7%, var(--app-surface));
}

.upgrade-path__side {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.upgrade-path__side--target {
  text-align: right;
  align-items: flex-end;
}

.upgrade-path__label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 9.5px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.upgrade-path__version {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--app-heading);
  line-height: 1.15;
}

.upgrade-path__meta {
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--app-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.upgrade-path__arrow {
  width: 28px;
  height: 28px;
  color: var(--dorian-viper-400, var(--app-accent));
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.upgrade-path__arrow svg {
  width: 20px;
  height: 20px;
}

.upgrade-version-section {
  min-width: 0;
}

.upgrade-version-head {
  margin-bottom: 10px;
}

.upgrade-version-heading {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.upgrade-version-sub {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--app-text-muted);
}

.dialog-card--upgrade .upgrade-version-panels {
  margin-top: 0;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface-elevated) 55%, transparent);
  max-height: min(42vh, 360px);
  overflow-y: auto;
}

@media (max-width: 640px) {
  .upgrade-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .upgrade-path {
    grid-template-columns: 1fr;
    text-align: left;
  }

  .upgrade-path__side--target {
    text-align: left;
    align-items: flex-start;
  }

  .upgrade-path__arrow {
    transform: rotate(90deg);
  }
}

.upgrade-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #f87171;
  font-size: var(--type-base);
}

.upgrade-server-line {
  margin: 0 0 8px;
  font-size: var(--type-base);
  color: var(--app-text);
}

.upgrade-hint {
  margin: 0 0 16px;
  font-size: var(--type-caption);
  line-height: 1.45;
  color: var(--app-text-muted);
}

.upgrade-version-panels {
  margin-top: 2px;
}

.dialog-card.dialog-card--upgrade {
  width: min(100%, 640px);
  max-width: 640px;
  max-height: min(92vh, 860px);
}

.dialog-card--upgrade .dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.dialog-card--upgrade .dialog-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
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
  font-family: var(--font-mono);
  font-size: var(--type-label);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  font-weight: 500;
}

.filter-field input,
.filter-field select {
  border: 0.5px solid var(--app-input-border);
  border-radius: 6px;
  padding: 7px 10px;
  font-size: var(--type-base);
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
  padding: var(--space-table-cell);
  font-size: var(--type-base);
  color: var(--app-text);
  border-bottom: 0.5px solid var(--app-border);
}

.servers-table th {
  font-family: var(--font-mono);
  font-size: var(--type-caption);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
  font-weight: 500;
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
  font-size: var(--type-caption);
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
  font-size: var(--type-caption);
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
  font-size: var(--type-caption);
  font-weight: 600;
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border: 1px solid rgba(46, 158, 108, 0.25);
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
  padding: 8px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: var(--type-base);
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
  font-size: var(--type-section-title);
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
  font-size: var(--type-base);
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
  font-family: var(--font-mono);
  font-size: var(--type-label);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  font-weight: 500;
}

.dialog-field input {
  border: 0.5px solid var(--app-input-border);
  border-radius: 6px;
  padding: 7px 10px;
  font-size: var(--type-base);
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
  border: 0.5px solid var(--app-input-border);
  border-radius: 6px;
  padding: 7px 10px;
  font-size: var(--type-base);
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
  min-height: var(--btn-height-md);
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
  padding: 8px 10px;
  border-radius: 8px;
  font-size: var(--type-base);
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
  padding: 8px 10px;
  color: var(--app-text-muted);
  font-size: var(--type-base);
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
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(46, 158, 108, 0.12);
  color: var(--dorian-viper-400, var(--app-accent));
  font-size: 12px;
  font-weight: 650;
  border: 1px solid rgba(46, 158, 108, 0.24);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.user-chip:hover {
  background: rgba(46, 158, 108, 0.2);
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
  font-size: var(--type-base);
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
  font-size: var(--type-caption);
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
  font-size: var(--type-caption);
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

