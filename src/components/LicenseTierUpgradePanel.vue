<template>
  <div class="license-tier-panel">
    <p v-if="intro" class="intro">{{ intro }}</p>
    <p v-if="errorMessage" class="error-banner" role="alert">{{ errorMessage }}</p>
    <LicenseTierSelector
      v-model="selectedTier"
      v-model:billing-period="billingPeriod"
      :current-tier="initialTier"
      :disabled="isSubmitting"
      :aria-label="'License type for ' + (server?.name || 'server')"
    />
    <p v-if="isSubmitting" class="status-line" role="status">
      <span class="spinner" aria-hidden="true"></span>
      Regenerating license and deploying to the host… This may take several minutes.
    </p>
    <div class="actions">
      <div class="actions__copy">
        <strong>{{ selectedTier }}</strong>
        <span>{{ actionHint }}</span>
      </div>
      <div class="actions__buttons">
        <button
          v-if="showCancel"
          type="button"
          class="btn-secondary"
          :disabled="isSubmitting"
          @click="$emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="isSubmitting || !canSubmit"
          @click="submit"
        >
          {{ okLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { upgradeServerLicense } from '@/api/servers'
import { normalizeLicenseTier, BILLING_PERIODS } from '@/data/licensePlans'
import LicenseTierSelector from './LicenseTierSelector.vue'

const props = defineProps({
  server: {
    type: Object,
    required: true,
  },
  intro: {
    type: String,
    default: '',
  },
  showCancel: {
    type: Boolean,
    default: true,
  },
  okLabel: {
    type: String,
    default: 'OK',
  },
})

const emit = defineEmits(['close', 'success', 'pending'])

const selectedTier = ref(normalizeLicenseTier(props.server?.license))
const billingPeriod = ref(BILLING_PERIODS.ANNUAL)
const isSubmitting = ref(false)
const errorMessage = ref('')

watch(
  () => [props.server?.id, props.server?.license],
  () => {
    selectedTier.value = normalizeLicenseTier(props.server?.license)
    billingPeriod.value = BILLING_PERIODS.ANNUAL
    errorMessage.value = ''
  }
)

watch(isSubmitting, (v) => {
  emit('pending', v)
})

const initialTier = computed(() => normalizeLicenseTier(props.server?.license))

const canSubmit = computed(() => {
  if (selectedTier.value !== initialTier.value) return true
  // Same tier is still valid when changing billing period (duration / pricing).
  return selectedTier.value !== 'Trial'
})

const actionHint = computed(() => {
  if (selectedTier.value === initialTier.value && selectedTier.value === 'Trial') {
    return 'Select a paid plan to continue'
  }
  if (selectedTier.value === initialTier.value) {
    return `Renew ${selectedTier.value} · ${billingPeriod.value} billing`
  }
  return `Switch from ${initialTier.value} to ${selectedTier.value}`
})

const submit = async () => {
  if (!props.server?.id || !canSubmit.value) return
  errorMessage.value = ''
  isSubmitting.value = true
  let updated = null
  try {
    updated = await upgradeServerLicense(props.server.id, {
      licenseType: selectedTier.value,
      billingPeriod: billingPeriod.value,
    })
  } catch (e) {
    errorMessage.value = e?.message || 'License upgrade failed.'
  } finally {
    isSubmitting.value = false
  }
  if (updated) {
    emit('success', updated)
  }
}
</script>

<style scoped>
.license-tier-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.intro {
  margin: 0;
  font-size: var(--type-base);
  color: var(--app-text-secondary);
  line-height: 1.5;
}

.error-banner {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--btn-radius, 8px);
  background: rgba(225, 82, 65, 0.1);
  border: 0.5px solid rgba(225, 82, 65, 0.4);
  color: var(--dorian-danger, #e15241);
  font-size: var(--type-base);
  font-weight: 600;
}

.status-line {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--type-base);
  color: var(--app-text-secondary);
}

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(139, 151, 143, 0.35);
  border-top-color: var(--app-accent);
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: 10px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface-muted);
}

.actions__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.actions__copy strong {
  font-size: 13px;
  font-weight: 650;
  color: var(--app-heading);
}

.actions__copy span {
  font-size: 12px;
  color: var(--app-text-muted);
}

.actions__buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-left: auto;
}

.btn-primary,
.btn-secondary {
  border-radius: 8px;
  padding: 10px 18px;
  font-size: var(--type-base);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, background 0.15s ease, border-color 0.15s ease;
}

.btn-primary {
  border: none;
  color: var(--app-btn-primary-fg, #08120e);
  background: var(--app-btn-primary-bg, var(--dorian-viper-500, #2e9e6c));
}

.btn-primary:hover:not(:disabled) {
  background: var(--app-btn-primary-hover, var(--dorian-viper-700, #1f6e4a));
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-secondary {
  border: 0.5px solid var(--app-border-strong);
  background: transparent;
  color: var(--app-text);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--app-surface-hover, var(--app-accent-soft));
  border-color: var(--app-border-strong);
}

.btn-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
