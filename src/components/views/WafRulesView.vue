<template>
  <div class="waf-view">
    <header class="waf-topbar">
      <div class="waf-topbar__left">
        <p class="waf-kicker">Security</p>
        <h2>WAF rules</h2>
        <p>{{ wafSubtitle }}</p>
      </div>
      <div class="waf-topbar__right">
        <button class="waf-primary-btn" type="button" @click="openCreateDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New rule set
        </button>
      </div>
    </header>

    <section class="waf-panel">
      <div class="waf-filterbar">
        <div class="waf-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
          <input
            id="waf-rule-name-filter"
            v-model="filters.name"
            type="search"
            aria-label="Search rule sets"
            placeholder="Search rule sets…"
          />
        </div>
        <div class="list-status-pills" role="group" aria-label="Role">
          <button type="button" :class="{ 'is-active': filters.role === '' }" @click="filters.role = ''">All</button>
          <button type="button" :class="{ 'is-active': filters.role === 'predefined' }" @click="filters.role = 'predefined'">Predefined</button>
          <button type="button" :class="{ 'is-active': filters.role === 'custom' }" @click="filters.role = 'custom'">Custom</button>
        </div>
        <div ref="wafFilterMenu" class="list-filter">
          <button
            type="button"
            class="list-filter__toggle"
            :class="{ 'is-active': wafFiltersOpen || wafExtraFilterCount }"
            :aria-expanded="wafFiltersOpen"
            @click="wafFiltersOpen = !wafFiltersOpen"
          >
            Filters
            <span v-if="wafExtraFilterCount" class="list-filter__count">{{ wafExtraFilterCount }}</span>
          </button>
          <div v-if="wafFiltersOpen" class="list-filter__panel">
            <div class="waf-filter-field">
              <label for="waf-rule-count-filter">Rules</label>
              <select id="waf-rule-count-filter" v-model="filters.ruleCount">
                <option value="">All</option>
                <option value="5">5 or more</option>
                <option value="10">10 or more</option>
                <option value="20">20 or more</option>
                <option value="30">30 or more</option>
              </select>
            </div>
            <div class="waf-filter-field">
              <label for="waf-site-count-filter">Sites using the set</label>
              <select id="waf-site-count-filter" v-model="filters.siteCount">
                <option value="">All</option>
                <option value="1">1 or more</option>
                <option value="2">2 or more</option>
                <option value="5">5 or more</option>
                <option value="10">10 or more</option>
              </select>
            </div>
            <button v-if="wafExtraFilterCount" class="list-filter__clear" type="button" @click="clearWafExtraFilters">
              Clear filters
            </button>
          </div>
        </div>
        <span class="waf-filter-summary num">{{ filteredRules.length }} of {{ rules.length }}</span>
      </div>

      <div class="waf-table-wrap">
        <table class="waf-table">
          <thead>
            <tr>
              <th>Rule set</th>
              <th>Role</th>
              <th>Rules</th>
              <th>Sites</th>
              <th class="waf-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="waf-empty">Loading WAF rule sets…</td>
            </tr>
            <tr v-else-if="!filteredRules.length">
              <td colspan="5" class="waf-empty">
                <span class="waf-empty__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /></svg>
                </span>
                <span>No WAF rule sets match these filters.</span>
                <button class="waf-empty-link" type="button" @click="openCreateDialog">Create a rule set</button>
              </td>
            </tr>
            <tr
              v-for="rule in paginatedRules"
              :key="rule.id"
              class="waf-row"
              @click="openRuleDialog(rule)"
            >
              <td>
                <div class="waf-name">
                  <span class="waf-name__tile" :class="{ 'waf-name__tile--predefined': isPredefinedRule(rule) }" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /><path d="M9 12l2 2 4-4" /></svg>
                  </span>
                  <span class="waf-name__copy">
                    <button type="button" class="waf-name-link" @click.stop="openRuleDialog(rule)">
                      {{ rule.name }}
                    </button>
                    <span class="waf-name__sub">Created {{ formatShortDate(rule.createdAt) }}</span>
                  </span>
                </div>
              </td>
              <td>
                <span class="role-pill" :class="rolePillClass(rule.role)">{{ formatRole(rule.role) }}</span>
              </td>
              <td>
                <span class="waf-stat num" :class="{ 'is-zero': !Number(rule.ruleCount) }">{{ rule.ruleCount ?? 0 }}</span>
              </td>
              <td>
                <span class="waf-sites" :class="{ 'is-hot': Number(rule.siteCount) > 0 }">
                  <span class="num">{{ rule.siteCount ?? 0 }}</span>
                  {{ Number(rule.siteCount) === 1 ? 'site' : 'sites' }}
                </span>
              </td>
              <td class="waf-col-actions" @click.stop>
                <div class="waf-actions">
                  <button
                    v-if="!isPredefinedRule(rule)"
                    class="waf-action-btn"
                    type="button"
                    @click="openConfigureDialog(rule, 'waf')"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>
                    Configure
                  </button>
                  <button
                    v-if="isPredefinedRule(rule)"
                    class="waf-action-btn"
                    type="button"
                    @click="openDuplicateDialog(rule)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
                    Duplicate
                  </button>
                  <span
                    class="waf-action-wrap"
                    :title="deleteButtonTitle(rule)"
                  >
                    <button
                      class="waf-icon-btn waf-icon-btn--danger"
                      type="button"
                      :aria-label="deletingId === rule.id ? 'Deleting rule set' : 'Delete rule set'"
                      :disabled="!canDeleteRule(rule) || deletingId === rule.id"
                      @click="requestDeleteConfirm(rule)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" /><path d="M9 7V4h6v3" /></svg>
                    </button>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="waf-footer">
        <span class="waf-footer__info num">
          {{ pageStart }}–{{ pageEnd }} of {{ filteredRules.length }}
        </span>
        <div class="waf-footer__pager">
          <button class="waf-pager-btn" type="button" :disabled="currentPage === 1" @click="prevPage">
            Prev
          </button>
          <span class="waf-footer__page num">{{ currentPage }} / {{ totalPages }}</span>
          <button class="waf-pager-btn" type="button" :disabled="currentPage === totalPages" @click="nextPage">
            Next
          </button>
        </div>
      </div>
    </section>

    <div
      v-if="isRuleDialogOpen && loadedRule"
      class="dialog-backdrop"
      @click="closeRuleDialog"
    >
      <div class="dialog-card dialog-card--detail" role="dialog" aria-modal="true" aria-label="WAF rule set" @click.stop>
        <div class="dialog-header">
          <div class="dialog-head">
            <span class="dialog-head__tile" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /><path d="M9 12l2 2 4-4" /></svg>
            </span>
            <div class="dialog-head__copy">
              <p class="dialog-kicker">WAF rule set</p>
              <h3 class="dialog-title">{{ loadedRule.name }}</h3>
            </div>
          </div>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeRuleDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="dialog-body">
          <dl class="overview-list">
            <div class="overview-item">
              <dt>Role</dt>
              <dd>
                <span class="role-pill" :class="rolePillClass(loadedRule.role)">{{ formatRole(loadedRule.role) }}</span>
              </dd>
            </div>
            <div class="overview-item">
              <dt>Rules</dt>
              <dd class="num">{{ isRuleSummariesLoading ? '…' : ruleSummaries.length }}</dd>
            </div>
            <div class="overview-item">
              <dt>Applied sites</dt>
              <dd class="num">{{ loadedRule.siteCount ?? 0 }}</dd>
            </div>
            <div class="overview-item">
              <dt>Created</dt>
              <dd class="overview-item__date">{{ formatCreatedAt(loadedRule.createdAt) }}</dd>
            </div>
          </dl>

          <section class="dialog-section">
            <h4 class="dialog-section-title">Rules</h4>
            <div v-if="isRuleSummariesLoading" class="rules-summary">Loading rules…</div>
            <ul v-else-if="ruleSummaries.length" class="rules-summary-list">
              <li v-for="(summary, index) in ruleSummaries" :key="index" class="rule-summary-item">
                <span class="rule-badge rule-badge--type">{{ summary.type }}</span>
                <span class="rule-summary-parts">
                  <span v-for="part in summary.parts" :key="part.label" class="rule-part">
                    <span class="rule-part-label">{{ part.label }}</span>
                    <span class="rule-part-value">{{ part.value }}</span>
                  </span>
                </span>
                <span v-if="summary.disabled" class="rule-badge rule-badge--disabled">Disabled</span>
              </li>
            </ul>
            <p v-else class="rules-summary">No WAF rules configured yet.</p>
          </section>
        </div>

        <div class="dialog-actions">
          <button class="secondary-btn" type="button" @click="closeRuleDialog">Close</button>
          <button
            v-if="!isPredefinedRule(loadedRule)"
            class="primary-btn"
            type="button"
            @click="openConfigureDialog(loadedRule, 'waf')"
          >
            Configure rules
          </button>
          <button
            v-else
            class="primary-btn"
            type="button"
            @click="duplicateFromDetail"
          >
            Duplicate
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="isConfigureDialogOpen && loadedRule"
      class="dialog-backdrop dialog-backdrop--configure"
      @click="closeConfigureDialog"
    >
      <div class="dialog-card dialog-card--workspace" role="dialog" aria-modal="true" aria-label="Configure WAF rule set" @click.stop>
        <div class="dialog-header">
          <div class="dialog-head">
            <span class="dialog-head__tile" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /><path d="M9 12l2 2 4-4" /></svg>
            </span>
            <div class="dialog-head__copy">
              <p class="dialog-kicker">Configure WAF rule set</p>
              <h3 class="dialog-title">{{ loadedRule.name }}</h3>
            </div>
            <span class="role-pill" :class="rolePillClass(loadedRule.role)">{{ formatRole(loadedRule.role) }}</span>
            <span class="dialog-head__meta num">
              {{ loadedRule.siteCount ?? 0 }} {{ Number(loadedRule.siteCount) === 1 ? 'site' : 'sites' }}
            </span>
          </div>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeConfigureDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form class="workspace-name" @submit.prevent="saveRule">
          <label for="waf-rule-name">Name</label>
          <input id="waf-rule-name" v-model="form.name" type="text" required placeholder="e.g. OWASP Core" />
          <button
            class="workspace-name__save"
            type="submit"
            :disabled="isSaving || !form.name.trim() || form.name.trim() === loadedRule.name"
          >
            {{ isSaving ? 'Saving…' : 'Rename' }}
          </button>
        </form>

        <div class="workspace-body site-cfg">
          <WafPanel :key="loadedRule.id" embedded :waf-rule-id="loadedRule.id" />
        </div>

        <div class="dialog-actions">
          <span class="dialog-actions__hint">Rule changes are saved as you add them.</span>
          <button class="primary-btn" type="button" @click="closeConfigureDialog">Done</button>
        </div>
      </div>
    </div>

    <div
      v-if="isDuplicateDialogOpen && duplicateSourceRule"
      class="dialog-backdrop"
      @click="!isDuplicating && closeDuplicateDialog()"
    >
      <div class="dialog-card" role="dialog" aria-modal="true" aria-label="Duplicate WAF rule set" @click.stop>
        <div class="dialog-header">
          <div class="dialog-head">
            <span class="dialog-head__tile" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
            </span>
            <div class="dialog-head__copy">
              <p class="dialog-kicker">WAF rule set</p>
              <h3 class="dialog-title">Duplicate rule set</h3>
            </div>
          </div>
          <button
            class="dialog-close"
            type="button"
            aria-label="Close dialog"
            :disabled="isDuplicating"
            @click="closeDuplicateDialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="dialog-body">
          <p class="wizard-step-desc">
            Creates a custom copy of <strong>{{ duplicateSourceRule.name }}</strong> with all of its rules, ready to assign to sites.
          </p>
          <div class="form-field">
            <label for="duplicate-waf-rule-name">Rule set name</label>
            <input
              id="duplicate-waf-rule-name"
              v-model="duplicateForm.name"
              type="text"
              required
              placeholder="e.g. OWASP Core Copy"
              :disabled="isDuplicating"
              @keyup.enter="submitDuplicateRule"
            />
          </div>
        </div>

        <div class="dialog-actions">
          <button class="secondary-btn" type="button" :disabled="isDuplicating" @click="closeDuplicateDialog">
            Cancel
          </button>
          <button
            class="primary-btn"
            type="button"
            :disabled="isDuplicating || !duplicateForm.name.trim()"
            @click="submitDuplicateRule"
          >
            {{ isDuplicating ? 'Duplicating…' : 'Duplicate' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="isCreateDialogOpen" class="dialog-backdrop">
      <div
        class="dialog-card"
        :class="{ 'dialog-card--workspace': createStep === 2 }"
        role="dialog"
        aria-modal="true"
        aria-label="Create WAF rule set"
        @click.stop
      >
        <div class="dialog-header">
          <div class="dialog-head">
            <span class="dialog-head__tile" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" /><path d="M12 9v6M9 12h6" /></svg>
            </span>
            <div class="dialog-head__copy">
              <p class="dialog-kicker">New WAF rule set</p>
              <h3 class="dialog-title">{{ createStep === 2 && createForm.name.trim() ? createForm.name.trim() : 'Create rule set' }}</h3>
            </div>
          </div>
          <ol class="wizard-steps" aria-label="Creation steps">
            <li
              v-for="(label, index) in createStepLabels"
              :key="label"
              class="wizard-step"
              :class="{
                active: createStep === index + 1,
                done: createStep > index + 1,
              }"
            >
              <span class="wizard-step-circle num">
                <svg v-if="createStep > index + 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                <template v-else>{{ index + 1 }}</template>
              </span>
              <span class="wizard-step-label">{{ label }}</span>
            </li>
          </ol>
        </div>

        <div v-if="createStep === 1" class="dialog-body">
          <p class="wizard-step-desc">Name the rule set. You'll add whitelist, blacklist, rate-limit and filter rules next.</p>
          <div class="form-field">
            <label for="new-waf-rule-name">Rule set name</label>
            <input
              id="new-waf-rule-name"
              v-model="createForm.name"
              type="text"
              required
              placeholder="e.g. OWASP Core"
              @keyup.enter="goCreateNextFromName"
            />
          </div>
        </div>

        <div v-else-if="createStep === 2" class="workspace-body site-cfg">
          <WafPanel v-if="createDraftId" :key="createDraftId" embedded :waf-rule-id="createDraftId" />
        </div>

        <div v-else class="dialog-body">
          <p class="wizard-step-desc">Choose how this rule set is used.</p>
          <div class="role-options" role="radiogroup" aria-label="Role">
            <label class="role-option" :class="{ 'is-active': createForm.role === 'predefined' }">
              <input v-model="createForm.role" type="radio" name="new-waf-rule-role" value="predefined" />
              <span class="role-option__title">Predefined</span>
              <span class="role-option__desc">A template. Duplicate it to create per-site custom sets.</span>
            </label>
            <label class="role-option" :class="{ 'is-active': createForm.role === 'custom' }">
              <input v-model="createForm.role" type="radio" name="new-waf-rule-role" value="custom" />
              <span class="role-option__title">Custom</span>
              <span class="role-option__desc">Assigned directly to individual sites.</span>
            </label>
          </div>
        </div>

        <div class="dialog-actions" :class="{ 'dialog-actions--split': createStep > 1 }">
          <button
            v-if="createStep > 1"
            class="secondary-btn"
            type="button"
            :disabled="isCreating"
            @click="goCreatePrevious"
          >
            Previous
          </button>
          <div class="dialog-actions-right">
            <button
              class="secondary-btn"
              type="button"
              :disabled="isCreating"
              @click="cancelCreateDialog"
            >
              Cancel
            </button>
            <button
              v-if="createStep === 1"
              class="primary-btn"
              type="button"
              :disabled="isCreating || !createForm.name.trim()"
              @click="goCreateNextFromName"
            >
              {{ isCreating ? 'Saving…' : 'Next' }}
            </button>
            <button
              v-else-if="createStep === 2"
              class="primary-btn"
              type="button"
              @click="goCreateNextFromWaf"
            >
              Next
            </button>
            <button
              v-else
              class="primary-btn"
              type="button"
              :disabled="isCreating"
              @click="finalizeCreateRule"
            >
              {{ isCreating ? 'Creating…' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-model="isDeleteConfirmOpen"
      title="Delete WAF Rule Set"
      :message="deleteConfirmMessage"
      confirm-text="Delete"
      cancel-text="Cancel"
      @confirm="handleDeleteRule"
      @cancel="clearDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmDialog from '../ConfirmDialog.vue'
import { createWafRule, deleteWafRule, duplicateWafRule, fetchWafRule, fetchWafRules, updateWafRule } from '@/api/wafRules'
import { notifyError, notifySuccess } from '@/utils/notify'
import { fetchWafRuleSummaries } from '@/utils/wafRuleSummary'
import WafPanel from './WafPanel.vue'
import '@/assets/styles/site-config.css'

const PAGE_TITLE = 'WAF Rule Set'

const route = useRoute()
const router = useRouter()

const rules = ref([])
const isLoading = ref(false)
const selectedRuleId = ref('')
const loadedRule = ref(null)
const isRuleDialogOpen = ref(false)
const isConfigureDialogOpen = ref(false)
const ruleSummaries = ref([])
const isRuleSummariesLoading = ref(false)
const isSaving = ref(false)
const isCreating = ref(false)
const isCreateDialogOpen = ref(false)
const createStep = ref(1)
const createDraftId = ref(null)
const createStepLabels = ['Name', 'WAF Rules', 'Role']
const isDuplicateDialogOpen = ref(false)
const duplicateSourceRule = ref(null)
const isDuplicating = ref(false)
const isDeleteConfirmOpen = ref(false)
const deleteTarget = ref(null)
const deletingId = ref(null)
const pageSize = ref(10)
const currentPage = ref(1)

const filters = reactive({
  name: '',
  role: '',
  ruleCount: '',
  siteCount: '',
})

const wafSubtitle = computed(() => {
  const total = rules.value.length
  if (!total) return 'Create and manage WAF rule sets applied across your sites.'
  const custom = rules.value.filter((rule) => String(rule.role || '').toLowerCase() === 'custom').length
  const assigned = rules.value.reduce((sum, rule) => sum + Number(rule.siteCount || 0), 0)
  return `${total} rule set${total === 1 ? '' : 's'} · ${custom} custom · ${assigned} site assignment${assigned === 1 ? '' : 's'}`
})

const form = reactive({ name: '' })
const createForm = reactive({ name: '', role: 'predefined' })
const duplicateForm = reactive({ name: '' })

const matchesMinCount = (value, minimum) => {
  if (!minimum) return true
  return Number(value ?? 0) >= minimum
}

const compareWafRules = (left, right) => {
  const leftPredefined = String(left?.role || '').toLowerCase() === 'predefined'
  const rightPredefined = String(right?.role || '').toLowerCase() === 'predefined'
  if (leftPredefined !== rightPredefined) {
    return leftPredefined ? -1 : 1
  }
  return new Date(right?.createdAt || 0) - new Date(left?.createdAt || 0)
}

const filteredRules = computed(() => {
  const nameQuery = filters.name.trim().toLowerCase()
  const roleFilter = filters.role.trim().toLowerCase()
  const ruleCountMin = Number(filters.ruleCount) || 0
  const siteCountMin = Number(filters.siteCount) || 0
  return rules.value
    .filter((rule) => {
      if (nameQuery && !String(rule.name || '').toLowerCase().includes(nameQuery)) return false
      if (roleFilter && String(rule.role || '').toLowerCase() !== roleFilter) return false
      if (!matchesMinCount(rule.ruleCount, ruleCountMin)) return false
      if (!matchesMinCount(rule.siteCount, siteCountMin)) return false
      return true
    })
    .sort(compareWafRules)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRules.value.length / pageSize.value)),
)

const paginatedRules = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRules.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() =>
  filteredRules.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0,
)

const pageEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, filteredRules.value.length),
)

watch(
  () => [filters.name, filters.role, filters.ruleCount, filters.siteCount],
  () => {
    currentPage.value = 1
  },
)

const isPredefinedRule = (rule) => String(rule?.role || '').toLowerCase() === 'predefined'

const canDeleteRule = (rule) => Number(rule?.siteCount ?? 0) === 0

const deleteButtonTitle = (rule) => {
  const siteCount = Number(rule?.siteCount ?? 0)
  if (siteCount > 0) {
    return 'This WAF rule is applied to sites and cannot be deleted.'
  }
  return 'Delete WAF rule set'
}

const deleteConfirmMessage = computed(() => {
  const name = deleteTarget.value?.name || 'this WAF rule set'
  return `Delete "${name}"? This action cannot be undone.`
})

const formatRole = (value) => {
  const role = String(value || '').toLowerCase()
  return role === 'predefined' ? 'Predefined' : 'Custom'
}

const rolePillClass = (value) =>
  String(value || '').toLowerCase() === 'predefined' ? 'role-pill--predefined' : 'role-pill--custom'

const formatCreatedAt = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, { hour12: false })
}

const formatShortDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const applyRuleToForm = (rule) => {
  loadedRule.value = rule
  form.name = rule.name || ''
}

const loadRules = async () => {
  isLoading.value = true
  try {
    const data = await fetchWafRules('')
    rules.value = Array.isArray(data) ? data : []
  } catch (error) {
    rules.value = []
    notifyError(PAGE_TITLE, error?.message || 'WAF rule sets could not be loaded.')
  } finally {
    isLoading.value = false
  }
}

const loadRuleSummaries = async () => {
  if (!selectedRuleId.value) {
    ruleSummaries.value = []
    return
  }
  isRuleSummariesLoading.value = true
  try {
    ruleSummaries.value = await fetchWafRuleSummaries(selectedRuleId.value)
  } catch {
    ruleSummaries.value = []
  } finally {
    isRuleSummariesLoading.value = false
  }
}

const loadSelectedRule = async () => {
  if (!selectedRuleId.value) {
    loadedRule.value = null
    ruleSummaries.value = []
    return
  }
  try {
    const rule = await fetchWafRule(selectedRuleId.value)
    applyRuleToForm(rule)
    await loadRuleSummaries()
  } catch (error) {
    loadedRule.value = null
    ruleSummaries.value = []
    notifyError(PAGE_TITLE, error?.message || 'WAF rule set could not be loaded.')
  }
}

const syncRouteQuery = async () => {
  const query = { ...route.query }
  if (selectedRuleId.value) {
    query.wafRuleId = selectedRuleId.value
  } else {
    delete query.wafRuleId
  }
  await router.replace({ query })
}

const openRuleDialog = async (rule) => {
  selectedRuleId.value = String(rule.id)
  isRuleDialogOpen.value = true
  isConfigureDialogOpen.value = false
  await syncRouteQuery()
  await loadSelectedRule()
}

const openConfigureDialog = async (rule) => {
  selectedRuleId.value = String(rule.id)
  isConfigureDialogOpen.value = true
  isRuleDialogOpen.value = false
  await syncRouteQuery()
  await loadSelectedRule()
}

const suggestedDuplicateName = (rule) => {
  const baseName = String(rule?.name || '').trim()
  return baseName ? `${baseName} Copy` : 'WAF Rule Copy'
}

const openDuplicateDialog = (rule) => {
  duplicateSourceRule.value = rule
  duplicateForm.name = suggestedDuplicateName(rule)
  isDuplicateDialogOpen.value = true
}

const duplicateFromDetail = () => {
  const rule = loadedRule.value
  if (!rule) return
  void closeRuleDialog()
  openDuplicateDialog(rule)
}

const resetDuplicateDialog = () => {
  isDuplicateDialogOpen.value = false
  duplicateSourceRule.value = null
  duplicateForm.name = ''
}

const closeDuplicateDialog = () => {
  if (isDuplicating.value) return
  resetDuplicateDialog()
}

const submitDuplicateRule = async () => {
  const source = duplicateSourceRule.value
  const name = duplicateForm.name.trim()
  if (!source?.id || !name) return

  isDuplicating.value = true
  try {
    const created = await duplicateWafRule(source.id, { name })
    if (!created?.id) {
      notifyError(PAGE_TITLE, 'WAF rule set was duplicated but the server response was invalid.')
      return
    }
    await loadRules()
    resetDuplicateDialog()
    notifySuccess(PAGE_TITLE, 'WAF rule set duplicated.')
  } catch (error) {
    notifyError(PAGE_TITLE, error?.message || 'WAF rule set could not be duplicated.')
  } finally {
    isDuplicating.value = false
  }
}

const requestDeleteConfirm = (rule) => {
  if (!canDeleteRule(rule)) return
  deleteTarget.value = rule
  isDeleteConfirmOpen.value = true
}

const clearDeleteConfirm = () => {
  isDeleteConfirmOpen.value = false
  deleteTarget.value = null
}

const closeOpenRuleViews = async () => {
  if (isRuleDialogOpen.value) {
    await closeRuleDialog()
  }
  if (isConfigureDialogOpen.value) {
    await closeConfigureDialog()
  }
}

const handleDeleteRule = async () => {
  const rule = deleteTarget.value
  if (!rule?.id) return

  deletingId.value = rule.id
  try {
    await deleteWafRule(rule.id)
    if (String(selectedRuleId.value) === String(rule.id)) {
      await closeOpenRuleViews()
    }
    await loadRules()
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
    notifySuccess(PAGE_TITLE, 'WAF rule set deleted.')
  } catch (error) {
    notifyError(PAGE_TITLE, error?.message || 'WAF rule set could not be deleted.')
  } finally {
    deletingId.value = null
    clearDeleteConfirm()
  }
}

const closeRuleDialog = async () => {
  const ruleId = selectedRuleId.value
  isRuleDialogOpen.value = false
  if (!isConfigureDialogOpen.value) {
    selectedRuleId.value = ''
    loadedRule.value = null
    ruleSummaries.value = []
    await syncRouteQuery()
  }
  if (ruleId) {
    try {
      const updated = await fetchWafRule(ruleId)
      const index = rules.value.findIndex((rule) => String(rule.id) === String(ruleId))
      if (index >= 0) {
        rules.value[index] = updated
      }
    } catch {
      // Keep the existing list if the refresh fails.
    }
  }
}

const closeConfigureDialog = async () => {
  const ruleId = selectedRuleId.value
  isConfigureDialogOpen.value = false
  selectedRuleId.value = ''
  loadedRule.value = null
  ruleSummaries.value = []
  await syncRouteQuery()
  if (ruleId) {
    try {
      const updated = await fetchWafRule(ruleId)
      const index = rules.value.findIndex((rule) => String(rule.id) === String(ruleId))
      if (index >= 0) {
        rules.value[index] = updated
      }
    } catch {
      // Keep the existing list if the refresh fails.
    }
  }
}

const saveRule = async () => {
  if (!selectedRuleId.value || !form.name.trim()) return
  isSaving.value = true
  try {
    const updated = await updateWafRule(selectedRuleId.value, {
      name: form.name.trim(),
      role: loadedRule.value?.role || 'custom',
    })
    applyRuleToForm(updated)
    await loadRules()
    if (isRuleDialogOpen.value) {
      await loadRuleSummaries()
    }
    notifySuccess(PAGE_TITLE, 'WAF rule set saved successfully.')
  } catch (error) {
    notifyError(PAGE_TITLE, error?.message || 'WAF rule set could not be saved.')
  } finally {
    isSaving.value = false
  }
}

const resetCreateWizard = () => {
  createStep.value = 1
  createDraftId.value = null
  createForm.name = ''
  createForm.role = 'predefined'
}

const openCreateDialog = () => {
  resetCreateWizard()
  isCreateDialogOpen.value = true
}

const cancelCreateDialog = async () => {
  if (isCreating.value) return
  if (createDraftId.value) {
    try {
      await deleteWafRule(createDraftId.value)
    } catch {
      // Draft cleanup is best-effort on cancel.
    }
  }
  isCreateDialogOpen.value = false
  resetCreateWizard()
}

const ensureCreateDraft = async () => {
  const name = createForm.name.trim()
  if (!name) {
    throw new Error('Rule name is required.')
  }

  if (createDraftId.value) {
    try {
      return await updateWafRule(createDraftId.value, {
        name,
        role: 'predefined',
      })
    } catch (error) {
      if (error?.status !== 404) {
        throw error
      }
      createDraftId.value = null
    }
  }

  const created = await createWafRule({ name })
  if (!created?.id) {
    throw new Error('WAF rule set was created but the server response was invalid.')
  }
  createDraftId.value = created.id
  return created
}

const goCreateNextFromName = async () => {
  if (!createForm.name.trim()) return
  isCreating.value = true
  try {
    await ensureCreateDraft()
    createStep.value = 2
  } catch (error) {
    notifyError(PAGE_TITLE, error?.message || 'WAF rule set could not be saved.')
  } finally {
    isCreating.value = false
  }
}

const goCreateNextFromWaf = () => {
  if (!createDraftId.value) {
    notifyError(PAGE_TITLE, 'Create the rule name first, then configure WAF rules.')
    createStep.value = 1
    return
  }
  createStep.value = 3
}

const goCreatePrevious = async () => {
  if (createStep.value === 3) {
    createStep.value = 2
    return
  }
  if (createStep.value === 2) {
    createStep.value = 1
  }
}

const finalizeCreateRule = async () => {
  if (!createForm.name.trim()) {
    notifyError(PAGE_TITLE, 'Rule name is required.')
    createStep.value = 1
    return
  }

  isCreating.value = true
  try {
    await ensureCreateDraft()
    if (!createDraftId.value) {
      throw new Error('WAF rule set draft could not be created.')
    }

    await updateWafRule(createDraftId.value, {
      name: createForm.name.trim(),
      role: createForm.role,
    })
    await loadRules()
    isCreateDialogOpen.value = false
    resetCreateWizard()
    notifySuccess(PAGE_TITLE, 'WAF rule set created.')
  } catch (error) {
    notifyError(PAGE_TITLE, error?.message || 'WAF rule set could not be created.')
  } finally {
    isCreating.value = false
  }
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

watch(
  () => route.name,
  (name) => {
    if (name === 'waf-rules') {
      void loadRules()
    }
  },
  { immediate: true },
)

watch(
  () => route.query.wafRuleId,
  (wafRuleId) => {
    const nextId = wafRuleId ? String(wafRuleId) : ''
    if (nextId === selectedRuleId.value) return
    if (!nextId) {
      isRuleDialogOpen.value = false
      isConfigureDialogOpen.value = false
      selectedRuleId.value = ''
      loadedRule.value = null
      ruleSummaries.value = []
      return
    }
    selectedRuleId.value = nextId
    isRuleDialogOpen.value = true
    isConfigureDialogOpen.value = false
    void loadSelectedRule()
  },
)

const wafFiltersOpen = ref(false)
const wafFilterMenu = ref(null)
const wafExtraFilterCount = computed(() =>
  [filters.ruleCount, filters.siteCount].filter(Boolean).length,
)
const clearWafExtraFilters = () => {
  filters.ruleCount = ''
  filters.siteCount = ''
}
const onWafFilterOutside = (event) => {
  if (wafFilterMenu.value && !wafFilterMenu.value.contains(event.target)) {
    wafFiltersOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onWafFilterOutside)
  window.addEventListener('cdnproxy-sites-changed', loadRules)
  if (route.query.wafRuleId) {
    selectedRuleId.value = String(route.query.wafRuleId)
    isRuleDialogOpen.value = true
    await loadSelectedRule()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onWafFilterOutside)
  window.removeEventListener('cdnproxy-sites-changed', loadRules)
})
</script>

<style scoped>
.waf-view {
  --waf-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 1680px;
  margin: 0 auto;
  min-height: 100%;
  font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
}

.num {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

/* Top bar ------------------------------------------------------------------ */

.waf-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.waf-kicker,
.dialog-kicker {
  margin: 0 0 3px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.waf-view .waf-topbar__left h2 {
  margin: 0 0 3px;
  font-size: 1.4rem !important;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
  line-height: 1.2;
}

.waf-topbar__left p:last-child {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.waf-primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  border-radius: var(--waf-radius);
  padding: 9px 14px;
  background: var(--dorian-viper-500, var(--app-accent));
  color: #08120e;
  font-weight: 650;
  font-size: 13px;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.waf-primary-btn svg {
  width: 14px;
  height: 14px;
}

.waf-primary-btn:hover {
  filter: brightness(1.06);
}

/* Panel + toolbar ---------------------------------------------------------- */

.waf-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 12px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
}

.waf-filterbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 0.5px solid var(--app-border);
}

.waf-search {
  position: relative;
  flex: 1 1 240px;
  max-width: 360px;
}

.waf-search svg {
  position: absolute;
  left: 11px;
  top: 50%;
  width: 14px;
  height: 14px;
  transform: translateY(-50%);
  color: var(--app-text-muted);
  pointer-events: none;
}

.waf-search input {
  width: 100%;
  height: 34px;
  padding: 0 12px 0 32px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: 13px;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
}

.waf-search input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.waf-filter-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 128px;
}

.waf-filter-field label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.waf-filter-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  padding: 8px 11px;
  font-size: 13px;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
}

.waf-filter-field select:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.waf-filter-summary {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 999px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

/* Table -------------------------------------------------------------------- */

.waf-table-wrap {
  overflow-x: auto;
  flex: 1;
}

.waf-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.waf-table th,
.waf-table td {
  text-align: left;
  padding: 12px 14px;
  border-bottom: 0.5px solid var(--app-border) !important;
  vertical-align: middle;
  background: transparent !important;
}

.waf-table tbody tr:last-child td {
  border-bottom: 0 !important;
}

.waf-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding-top: 10px;
  padding-bottom: 10px;
  background: var(--app-surface-muted) !important;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--app-text-muted) !important;
  font-weight: 650;
}

.waf-row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.waf-row:hover td {
  background: var(--app-surface-muted) !important;
}

.waf-name {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.waf-name__tile {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 0.5px solid color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 32%, transparent);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 10%, transparent);
  color: var(--dorian-viper-400, #3fbd85);
}

.waf-name__tile--predefined {
  border-color: rgba(91, 157, 240, 0.32);
  background: rgba(91, 157, 240, 0.1);
  color: #7fb2f5;
}

.waf-name__tile svg {
  width: 16px;
  height: 16px;
}

.waf-name__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.waf-name-link {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
  cursor: pointer;
  text-align: left;
}

.waf-name-link:hover {
  color: var(--dorian-viper-400, var(--app-accent));
}

.waf-name__sub {
  font-size: 11.5px;
  color: var(--app-text-muted);
}

.role-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.3;
  white-space: nowrap;
  border: 0.5px solid transparent;
}

.role-pill::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.role-pill--predefined {
  color: #7fb2f5;
  background: rgba(91, 157, 240, 0.12);
  border-color: rgba(91, 157, 240, 0.32);
}

.role-pill--custom {
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 12%, transparent);
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 32%, transparent);
}

.waf-stat {
  font-size: 13px;
  font-weight: 650;
  color: var(--app-heading);
}

.waf-stat.is-zero {
  color: var(--app-text-muted);
}

.waf-sites {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  font-size: 12px;
  color: var(--app-text-muted);
}

.waf-sites .num {
  font-size: 13px;
  font-weight: 650;
}

.waf-sites.is-hot .num {
  color: var(--dorian-viper-400, var(--app-accent));
}

.waf-col-actions {
  width: 1%;
  white-space: nowrap;
  cursor: default;
}

.waf-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.waf-action-wrap {
  display: inline-flex;
}

.waf-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  border: 0.5px solid var(--app-border-strong);
  background: transparent;
  color: var(--app-text);
  border-radius: 8px;
  padding: 0 11px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.waf-action-btn svg {
  width: 13px;
  height: 13px;
}

.waf-action-btn:hover {
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 45%, transparent);
  color: var(--dorian-viper-400, var(--app-accent));
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 10%, transparent);
}

.waf-icon-btn {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 0.5px solid transparent;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.waf-icon-btn svg {
  width: 15px;
  height: 15px;
}

.waf-icon-btn--danger:hover:not(:disabled) {
  color: var(--dorian-danger, #e15241);
  border-color: color-mix(in srgb, var(--dorian-danger, #e15241) 38%, transparent);
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 10%, transparent);
}

.waf-icon-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.waf-empty {
  text-align: center;
  padding: 44px 16px !important;
  color: var(--app-text-muted);
  font-size: 13px;
}

.waf-empty__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin: 0 auto 10px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.waf-empty__icon svg {
  width: 18px;
  height: 18px;
}

.waf-empty-link {
  display: inline;
  margin-left: 6px;
  border: none;
  background: none;
  color: var(--dorian-viper-400, var(--app-accent));
  font-weight: 650;
  cursor: pointer;
  padding: 0;
}

.waf-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-top: 0.5px solid var(--app-border);
  border-radius: 0 0 12px 12px;
  background: var(--app-surface-muted);
}

.waf-footer__info,
.waf-footer__page {
  font-size: 12px;
  color: var(--app-text-muted);
}

.waf-footer__pager {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.waf-pager-btn {
  height: var(--btn-height-sm, 32px);
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface);
  color: var(--app-text);
  border-radius: 8px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.waf-pager-btn:hover:not(:disabled) {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.waf-pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Dialogs ------------------------------------------------------------------ */

.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(4px);
}

.dialog-backdrop--configure {
  z-index: 1100;
}

.dialog-card {
  display: flex;
  flex-direction: column;
  width: min(480px, 100%);
  max-height: calc(100vh - 48px);
  overflow: hidden;
  border-radius: 14px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}

.dialog-card--detail {
  width: min(720px, 100%);
}

.dialog-card.dialog-card--workspace {
  width: min(1120px, calc(100vw - 40px));
  height: min(780px, calc(100vh - 40px));
  max-height: calc(100vh - 40px);
}

.dialog-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 0.5px solid var(--app-border);
}

.dialog-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.dialog-head__tile {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 0.5px solid color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 32%, transparent);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 10%, transparent);
  color: var(--dorian-viper-400, #3fbd85);
}

.dialog-head__tile svg {
  width: 18px;
  height: 18px;
}

.dialog-head__copy {
  min-width: 0;
}

.dialog-head__copy .dialog-kicker {
  margin-bottom: 2px;
}

.waf-view .dialog-title {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15.5px !important;
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.3;
  color: var(--app-heading);
}

.dialog-head__meta {
  font-size: 11.5px;
  color: var(--app-text-muted);
  white-space: nowrap;
}

.dialog-close {
  flex-shrink: 0;
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 8px;
  border: 0.5px solid transparent;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.dialog-close svg {
  width: 15px;
  height: 15px;
}

.dialog-close:hover:not(:disabled) {
  background: var(--app-surface-muted);
  border-color: var(--app-border);
  color: var(--app-heading);
}

.dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 20px 20px;
}

.dialog-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 0.5px solid var(--app-border);
  border-radius: 0 0 14px 14px;
  background: var(--app-surface-muted);
}

.dialog-actions--split {
  justify-content: space-between;
}

.dialog-actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.dialog-actions__hint {
  margin-right: auto;
  font-size: 12px;
  color: var(--app-text-muted);
}

.dialog-card .primary-btn,
.dialog-card .secondary-btn {
  border-radius: 8px !important;
}

.dialog-card .secondary-btn {
  background: transparent !important;
  color: var(--app-text) !important;
  border: 0.5px solid var(--app-border-strong) !important;
}

.dialog-card .secondary-btn:hover:not(:disabled) {
  background: var(--app-surface) !important;
  color: var(--app-heading) !important;
}

.dialog-card .primary-btn:disabled,
.dialog-card .secondary-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Detail dialog */

.overview-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.overview-item dt {
  margin: 0;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.overview-item dd {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
  line-height: 1.2;
  color: var(--app-heading);
}

.overview-item dd.overview-item__date {
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.35;
}

.dialog-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.waf-view .dialog-section-title {
  margin: 0;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.rules-summary-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 340px;
  overflow: auto;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.rule-summary-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 14px;
  border-bottom: 0.5px solid var(--app-border);
}

.rule-summary-item:last-child {
  border-bottom: none;
}

.rule-summary-parts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  flex: 1;
  min-width: 0;
}

.rule-part {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.rule-part-label {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.rule-part-value {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 12px;
  color: var(--app-heading);
  word-break: break-all;
}

.rule-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 9px;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.35;
  white-space: nowrap;
  border: 0.5px solid transparent;
}

.rule-badge--type {
  color: var(--dorian-viper-400, #3fbd85);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 12%, transparent);
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 30%, transparent);
}

.rule-badge--disabled {
  color: var(--dorian-danger, #e15241);
  background: color-mix(in srgb, var(--dorian-danger, #e15241) 10%, transparent);
  border-color: color-mix(in srgb, var(--dorian-danger, #e15241) 32%, transparent);
}

.rules-summary {
  margin: 0;
  padding: 18px 16px;
  border-radius: 10px;
  border: 0.5px dashed var(--app-border-strong);
  text-align: center;
  font-size: 13px;
  color: var(--app-text-muted);
}

/* Configure workspace */

.workspace-name {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.workspace-name label {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.workspace-name input {
  width: 100%;
  max-width: 420px;
  height: 32px;
  padding: 0 11px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: 13px;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
}

.workspace-name input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.workspace-name__save {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 0.5px solid var(--app-border-strong);
  background: transparent;
  color: var(--app-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.workspace-name__save:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 45%, transparent);
  color: var(--dorian-viper-400, var(--app-accent));
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 10%, transparent);
}

.workspace-name__save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.workspace-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 14px 20px;
}

.workspace-body :deep(.cfg-subpanel) {
  height: 100%;
}

/* Create wizard */

.wizard-steps {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.wizard-step {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--app-text-muted);
}

.wizard-step + .wizard-step::before {
  content: '';
  width: 16px;
  height: 1px;
  margin-right: 1px;
  background: var(--app-border-strong);
}

.wizard-step-circle {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface-muted);
  font-size: 11px;
  font-weight: 650;
}

.wizard-step-circle svg {
  width: 12px;
  height: 12px;
}

.wizard-step-label {
  font-size: 12px;
  font-weight: 600;
}

.wizard-step.active .wizard-step-circle {
  border-color: var(--dorian-viper-500, var(--app-accent));
  background: var(--dorian-viper-500, var(--app-accent));
  color: #08120e;
}

.wizard-step.done .wizard-step-circle {
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 45%, transparent);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 14%, transparent);
  color: var(--dorian-viper-400, #3fbd85);
}

.wizard-step.active .wizard-step-label {
  color: var(--app-heading);
}

.wizard-step-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--app-text-muted);
}

.wizard-step-desc strong {
  color: var(--app-heading);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-field label {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.form-field input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--app-input-border);
  border-radius: 8px;
  font-size: 13px;
  background: var(--app-input-bg);
  color: var(--app-text);
  outline: none;
}

.form-field input:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 3px var(--app-accent-soft);
}

.role-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.role-option {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 14px 14px 40px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface-muted);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.role-option input {
  position: absolute;
  left: 14px;
  top: 16px;
  margin: 0;
  accent-color: var(--dorian-viper-500, #2e9e6c);
}

.role-option.is-active {
  border-color: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 50%, transparent);
  background: color-mix(in srgb, var(--dorian-viper-400, #3fbd85) 8%, transparent);
}

.role-option__title {
  font-size: 13.5px;
  font-weight: 650;
  color: var(--app-heading);
}

.role-option__desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--app-text-muted);
}

@media (max-width: 760px) {
  .waf-filter-summary {
    margin-left: 0;
  }

  .overview-list,
  .role-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dialog-header {
    flex-wrap: wrap;
  }

  .dialog-head__meta,
  .dialog-actions__hint {
    display: none;
  }

  .workspace-name {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .workspace-name label {
    display: none;
  }
}
</style>
