<template>
  <div class="waf-rules-view">
    <div class="content-card">
      <div class="filter-header">
        <h3>Filters</h3>
        <button class="primary-btn" type="button" @click="openCreateDialog">New Rule</button>
      </div>
      <div class="filter-bar">
        <div class="filter-field">
          <label for="waf-rule-name-filter">Name</label>
          <input
            id="waf-rule-name-filter"
            v-model="filters.name"
            type="text"
            placeholder="Search by name"
          />
        </div>
        <div class="filter-field">
          <label for="waf-rule-role-filter">Role</label>
          <select id="waf-rule-role-filter" v-model="filters.role">
            <option value="">All</option>
            <option value="predefined">Predefined</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="waf-rule-count-filter">Rule Count</label>
          <select id="waf-rule-count-filter" v-model="filters.ruleCount">
            <option value="">All</option>
            <option value="5">&gt;= 5</option>
            <option value="10">&gt;= 10</option>
            <option value="20">&gt;= 20</option>
            <option value="30">&gt;= 30</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="waf-site-count-filter">Sites Count</label>
          <select id="waf-site-count-filter" v-model="filters.siteCount">
            <option value="">All</option>
            <option value="1">&gt;= 1</option>
            <option value="2">&gt;= 2</option>
            <option value="5">&gt;= 5</option>
            <option value="10">&gt;= 10</option>
          </select>
        </div>
      </div>
    </div>

    <div class="content-card rules-table-card">
      <div class="card-title">
        <h3>WAF Rule Sets</h3>
      </div>
      <div class="table-wrap">
        <table class="rules-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Rules</th>
              <th>Sites</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="muted-text">Loading WAF rule sets…</td>
            </tr>
            <tr v-else-if="!filteredRules.length">
              <td colspan="5" class="muted-text">No WAF rule sets found.</td>
            </tr>
            <tr
              v-for="rule in paginatedRules"
              :key="rule.id"
            >
              <td class="name-cell">
                <button type="button" class="name-link" @click="openRuleDialog(rule)">
                  {{ rule.name }}
                </button>
              </td>
              <td>
                <span class="role-pill" :class="rolePillClass(rule.role)">{{ formatRole(rule.role) }}</span>
              </td>
              <td>{{ rule.ruleCount ?? 0 }}</td>
              <td>{{ rule.siteCount ?? 0 }}</td>
              <td>
                <div class="actions-cell">
                  <button
                    v-if="isPredefinedRule(rule)"
                    class="secondary-btn table-action-btn"
                    type="button"
                    @click="openDuplicateDialog(rule)"
                  >
                    Duplicate
                  </button>
                  <button
                    v-else
                    class="secondary-btn table-action-btn"
                    type="button"
                    @click="openConfigureDialog(rule, 'waf')"
                  >
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <span class="pagination-info">
          Showing {{ pageStart }}-{{ pageEnd }} of {{ filteredRules.length }}
        </span>
        <div class="pagination-controls">
          <button class="pagination-btn" type="button" :disabled="currentPage === 1" @click="prevPage">
            Prev
          </button>
          <span class="pagination-page">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="pagination-btn" type="button" :disabled="currentPage === totalPages" @click="nextPage">
            Next
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="isRuleDialogOpen && loadedRule"
      class="dialog-backdrop"
      @click="closeRuleDialog"
    >
      <div class="dialog-card dialog-card--detail" @click.stop>
        <div class="dialog-header">
          <h3>WAF Rule Set</h3>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeRuleDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <section class="dialog-section">
          <h4 class="dialog-section-title">Overview</h4>
          <dl class="overview-list">
            <div class="overview-item">
              <dt>Rule name</dt>
              <dd>{{ loadedRule.name }}</dd>
            </div>
            <div class="overview-item">
              <dt>Role</dt>
              <dd>
                <span class="role-pill" :class="rolePillClass(loadedRule.role)">{{ formatRole(loadedRule.role) }}</span>
              </dd>
            </div>
            <div class="overview-item">
              <dt>Applied Sites</dt>
              <dd>{{ loadedRule.siteCount ?? 0 }}</dd>
            </div>
            <div class="overview-item">
              <dt>Created Time</dt>
              <dd>{{ formatCreatedAt(loadedRule.createdAt) }}</dd>
            </div>
          </dl>
        </section>

        <section class="dialog-section">
          <h4 class="dialog-section-title">Rules</h4>
          <div v-if="isRuleSummariesLoading" class="rules-summary muted-text">Loading rules…</div>
          <ul v-else-if="ruleSummaries.length" class="rules-summary-list">
            <li v-for="(summary, index) in ruleSummaries" :key="index" class="rule-summary-item">
              <div class="rule-summary-badges">
                <span class="rule-badge rule-badge--type">{{ summary.type }}</span>
                <span v-for="part in summary.parts" :key="part.label" class="rule-part">
                  <span class="rule-badge rule-badge--field">{{ part.label }}</span>
                  <span class="rule-part-value">{{ part.value }}</span>
                </span>
                <span v-if="summary.disabled" class="rule-badge rule-badge--disabled">Disabled</span>
              </div>
            </li>
          </ul>
          <p v-else class="rules-summary muted-text">No WAF rules configured.</p>
        </section>

        <div class="dialog-actions">
          <button
            v-if="!isPredefinedRule(loadedRule)"
            class="primary-btn"
            type="button"
            @click="openConfigureDialog(loadedRule, 'waf')"
          >
            Modify
          </button>
          <button class="secondary-btn" type="button" @click="closeRuleDialog">Close</button>
        </div>
      </div>
    </div>

    <div
      v-if="isConfigureDialogOpen && loadedRule"
      class="dialog-backdrop dialog-backdrop--configure"
      @click="closeConfigureDialog"
    >
      <div class="dialog-card dialog-card--wide" @click.stop>
        <div class="dialog-header">
          <h3>Configure WAF Rule Set</h3>
          <button class="dialog-close" type="button" aria-label="Close dialog" @click="closeConfigureDialog">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="rule-dialog-tabs">
          <div class="tabs-header">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
              type="button"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="tabs-body" :class="{ 'no-outline': activeTab === 'waf' }">
            <form v-if="activeTab === 'general'" class="settings-form" @submit.prevent="saveRule">
              <div class="form-field">
                <label for="waf-rule-name">Rule name</label>
                <input id="waf-rule-name" v-model="form.name" type="text" required placeholder="e.g. OWASP Core" />
              </div>
              <div class="form-actions">
                <button class="primary-btn" type="submit" :disabled="isSaving">
                  {{ isSaving ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </form>
            <WafPanel v-else-if="activeTab === 'waf'" :key="loadedRule.id" :waf-rule-id="loadedRule.id" />
          </div>
        </div>

        <div class="dialog-actions">
          <button class="secondary-btn" type="button" @click="closeConfigureDialog">Close</button>
        </div>
      </div>
    </div>

    <div
      v-if="isDuplicateDialogOpen && duplicateSourceRule"
      class="dialog-backdrop"
      @click="!isDuplicating && closeDuplicateDialog()"
    >
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h3>Duplicate WAF Rule Set</h3>
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
            Create a custom copy of <strong>{{ duplicateSourceRule.name }}</strong>.
          </p>
          <div class="form-field">
            <label for="duplicate-waf-rule-name">Rule name</label>
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
        :class="{ 'dialog-card--wide': createStep === 2 }"
        @click.stop
      >
        <div class="dialog-header">
          <h3>Create WAF Rule Set</h3>
        </div>

        <div class="wizard-steps" aria-label="Creation steps">
          <div
            v-for="(label, index) in createStepLabels"
            :key="label"
            class="wizard-step"
            :class="{
              active: createStep === index + 1,
              done: createStep > index + 1,
            }"
          >
            <span class="wizard-step-circle">{{ index + 1 }}</span>
            <span class="wizard-step-label">{{ label }}</span>
          </div>
        </div>

        <div v-if="createStep === 1" class="dialog-body">
          <div class="form-field">
            <label for="new-waf-rule-name">Rule name</label>
            <input
              id="new-waf-rule-name"
              v-model="createForm.name"
              type="text"
              required
              placeholder="e.g. OWASP Core"
            />
          </div>
        </div>

        <div v-else-if="createStep === 2" class="dialog-body dialog-body-waf">
          <p class="wizard-step-desc">Configure WAF rules for this rule set.</p>
          <WafPanel v-if="createDraftId" :key="createDraftId" :waf-rule-id="createDraftId" />
        </div>

        <div v-else class="dialog-body">
          <div class="form-field">
            <label for="new-waf-rule-role">Role</label>
            <select id="new-waf-rule-role" v-model="createForm.role">
              <option value="predefined">Predefined</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <p class="wizard-step-desc">
            Predefined rule sets are templates. Custom rule sets are assigned to individual sites.
          </p>
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createWafRule, deleteWafRule, duplicateWafRule, fetchWafRule, fetchWafRules, updateWafRule } from '@/api/wafRules'
import { notifyError, notifySuccess } from '@/utils/notify'
import { fetchWafRuleSummaries } from '@/utils/wafRuleSummary'
import WafPanel from './WafPanel.vue'

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
const activeTab = ref('general')

const pageSize = ref(10)
const currentPage = ref(1)

const filters = reactive({
  name: '',
  role: '',
  ruleCount: '',
  siteCount: '',
})

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'waf', label: 'WAF Rules' },
]

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
  return date.toLocaleString()
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

const openConfigureDialog = async (rule, tab = 'waf') => {
  selectedRuleId.value = String(rule.id)
  activeTab.value = tab
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

onMounted(async () => {
  await loadRules()
  if (route.query.wafRuleId) {
    selectedRuleId.value = String(route.query.wafRuleId)
    isRuleDialogOpen.value = true
    await loadSelectedRule()
  }
})
</script>

<style scoped>
.waf-rules-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-gap-lg, 14px);
}

.content-card {
  background: var(--app-surface);
  border-radius: 16px;
  padding: var(--space-card, 14px 16px);
  box-shadow: 0 4px 20px var(--app-shadow);
  border: 1px solid var(--app-border);
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

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
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

.table-wrap {
  overflow-x: auto;
  overflow-y: visible;
  border-radius: 12px;
  border: 1px solid var(--app-border);
}

.rules-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
}

.rules-table thead {
  background: var(--app-surface-elevated);
}

.rules-table th,
.rules-table td {
  text-align: left;
  padding: 14px 16px;
  font-size: 0.92rem;
  color: var(--app-text);
  border-bottom: 1px solid var(--app-border);
}

.rules-table th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
  font-weight: 600;
}

.rules-table tbody tr:hover {
  background: var(--app-surface-hover);
}

.name-cell {
  font-weight: 600;
}

.name-link {
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: var(--app-accent);
  cursor: pointer;
  text-align: left;
  transition: color 0.2s ease;
}

.name-link:hover {
  color: var(--app-accent-hover);
  text-decoration: underline;
}

.muted-text {
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
}

.role-pill--predefined {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.role-pill--custom {
  color: #6d28d9;
  background: rgba(124, 58, 237, 0.14);
  border: 1px solid rgba(124, 58, 237, 0.35);
}

:global([data-theme='dark']) .role-pill.role-pill--predefined {
  color: #93c5fd !important;
  background: rgba(59, 130, 246, 0.22) !important;
  border-color: rgba(59, 130, 246, 0.45) !important;
}

:global([data-theme='dark']) .role-pill.role-pill--custom {
  color: #e879f9 !important;
  background: rgba(217, 70, 239, 0.18) !important;
  border-color: rgba(217, 70, 239, 0.42) !important;
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
  font-size: 0.85rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  color: var(--app-text);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.85rem;
  cursor: pointer;
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

.rules-table th:last-child,
.rules-table td:last-child {
  width: 1%;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-action-btn {
  width: auto !important;
  min-width: 0 !important;
  flex: 0 0 auto;
  min-height: var(--btn-height-sm) !important;
  height: var(--btn-height-sm) !important;
  padding: 0 12px !important;
  font-size: var(--btn-font-size-sm) !important;
  white-space: nowrap;
}

.table-action-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.dialog-section {
  margin-bottom: 20px;
}

.dialog-section-title {
  margin: 0 0 12px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
}

.overview-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-elevated);
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.overview-item dt {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-muted);
}

.overview-item dd {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-text);
}

.rules-summary-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-elevated);
  max-height: 320px;
  overflow: auto;
}

.rule-summary-item {
  padding: 12px 14px;
  border-bottom: 1px solid var(--app-border);
}

.rule-summary-item:last-child {
  border-bottom: none;
}

.rule-summary-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.rule-part {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.rule-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.rule-badge--type {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.rule-badge--field {
  color: var(--app-accent);
  background: var(--app-accent-soft);
  border: 1px solid rgba(124, 58, 237, 0.28);
}

.rule-badge--disabled {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.rule-part-value {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--app-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}

:global([data-theme='dark']) .rule-badge--type {
  color: #93c5fd !important;
  background: rgba(59, 130, 246, 0.22) !important;
  border-color: rgba(59, 130, 246, 0.45) !important;
}

:global([data-theme='dark']) .rule-badge--field {
  color: #c084fc !important;
  background: rgba(168, 85, 247, 0.22) !important;
  border-color: rgba(168, 85, 247, 0.45) !important;
}

:global([data-theme='dark']) .rule-badge--disabled {
  color: #fca5a5 !important;
  background: rgba(239, 68, 68, 0.2) !important;
  border-color: rgba(239, 68, 68, 0.45) !important;
}

.rules-summary {
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-elevated);
}


.rule-dialog-tabs {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.tabs-header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--app-border-strong);
}

.tab-btn {
  border: none;
  background: transparent;
  color: var(--app-text-muted);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--app-accent);
  border-bottom-color: var(--app-accent);
}

.tabs-body {
  padding-top: 20px;
}

.tabs-body.no-outline {
  padding-top: 0;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 520px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field label {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  font-weight: 500;
}

.form-field input {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--app-input-bg);
  color: var(--app-text);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: var(--app-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.dialog-backdrop--configure {
  z-index: 1100;
}

.dialog-card {
  background: var(--app-surface-solid);
  border-radius: 16px;
  padding: 24px;
  width: min(420px, 92vw);
  border: 1px solid var(--app-border);
  box-shadow: 0 24px 48px var(--app-shadow);
}

.dialog-card--detail {
  width: min(720px, 92vw);
}

.dialog-card--wide {
  width: min(1180px, 96vw);
}

.rule-dialog-tabs .tabs-body.no-outline :deep(.waf-panel) {
  min-height: 380px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--app-heading);
}

.dialog-close {
  border: 1px solid var(--app-border);
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
  flex-shrink: 0;
}

.dialog-close svg {
  width: 16px;
  height: 16px;
}

.dialog-close:hover {
  background: var(--app-surface-hover);
  color: var(--app-text);
}

.wizard-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 24px;
}

.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  color: var(--app-text-muted);
}

.wizard-step-circle {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  border: 2px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  transition: all 0.2s ease;
}

.wizard-step-label {
  font-size: 0.8125rem;
  font-weight: 600;
}

.wizard-step.active .wizard-step-circle,
.wizard-step.done .wizard-step-circle {
  border-color: var(--app-accent);
  background: var(--app-accent);
  color: #fff;
}

.wizard-step.active .wizard-step-label,
.wizard-step.done .wizard-step-label {
  color: var(--app-accent);
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-body-waf {
  min-height: 420px;
}

.dialog-body-waf :deep(.waf-panel) {
  min-height: 380px;
}

.wizard-step-desc {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.form-field select {
  border: 1px solid var(--app-input-border);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--app-input-bg);
  color: var(--app-text);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.dialog-actions--split {
  justify-content: space-between;
  align-items: center;
}

.dialog-actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.dialog-card h3 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--app-heading);
}

.secondary-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  color: var(--app-text);
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

@media (max-width: 768px) {
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .primary-btn {
    width: 100%;
    text-align: center;
  }

  .overview-list {
    grid-template-columns: 1fr;
  }

  .table-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .dialog-actions--split {
    flex-direction: column;
    align-items: stretch;
  }

  .dialog-actions-right {
    width: 100%;
    margin-left: 0;
    justify-content: flex-end;
  }

  .wizard-step-label {
    font-size: 0.75rem;
  }
}
</style>
