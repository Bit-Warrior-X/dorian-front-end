<template>
  <div class="license-tier-panel">
    <p v-if="intro" class="intro">{{ intro }}</p>
    <p v-if="errorMessage" class="error-banner" role="alert">{{ errorMessage }}</p>
    <LicenseTierSelector
      v-model="selectedTier"
      v-model:billing-period="billingPeriod"
      :disabled="isSubmitting"
      :aria-label="'License type for ' + (server?.name || 'server')"
    />
    <p v-if="isSubmitting" class="status-line" role="status">
      <span class="spinner" aria-hidden="true"></span>
      Regenerating license and deploying to the host… This may take several minutes.
    </p>
    <div class="actions">
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
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  border-radius: var(--btn-radius, 8px);
  padding: 10px 18px;
  font-size: var(--type-base);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, background 0.15s ease;
}

.btn-primary {
  border: none;
  color: var(--app-btn-primary-fg, #fff);
  background: var(--app-btn-primary-bg);
}

.btn-primary:hover:not(:disabled) {
  background: var(--app-btn-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-secondary {
  border: 0.5px solid var(--dorian-gold-500, #c9a24a);
  background: transparent;
  color: var(--dorian-gold-500, #c9a24a);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--dorian-gold-dim, rgba(58, 46, 20, 0.12));
}

.btn-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
