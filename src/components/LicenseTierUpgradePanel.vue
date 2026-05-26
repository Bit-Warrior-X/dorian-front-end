<template>
  <div class="license-tier-panel">
    <p v-if="intro" class="intro">{{ intro }}</p>
    <p v-if="errorMessage" class="error-banner" role="alert">{{ errorMessage }}</p>
    <LicenseTierSelector
      v-model="selectedTier"
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
import { normalizeLicenseTier } from '@/data/licensePlans'
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
const isSubmitting = ref(false)
const errorMessage = ref('')

watch(
  () => [props.server?.id, props.server?.license],
  () => {
    selectedTier.value = normalizeLicenseTier(props.server?.license)
    errorMessage.value = ''
  }
)

watch(isSubmitting, (v) => {
  emit('pending', v)
})

const initialTier = computed(() => normalizeLicenseTier(props.server?.license))

const canSubmit = computed(() => selectedTier.value !== initialTier.value)

const submit = async () => {
  if (!props.server?.id || !canSubmit.value) return
  errorMessage.value = ''
  isSubmitting.value = true
  let updated = null
  try {
    updated = await upgradeServerLicense(props.server.id, {
      licenseType: selectedTier.value,
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
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
}

.error-banner {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(254, 242, 242, 0.95);
  border: 1px solid rgba(239, 68, 68, 0.45);
  color: #991b1b;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-line {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #475569;
}

.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(148, 163, 184, 0.5);
  border-top-color: rgba(79, 70, 229, 0.9);
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
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

.btn-primary {
  border: none;
  color: #fff;
  background: var(--app-btn-primary-bg, linear-gradient(135deg, #a855f7 0%, #7c3aed 100%));
  box-shadow: 0 4px 14px var(--app-btn-primary-shadow, rgba(168, 85, 247, 0.35));
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-secondary {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-elevated);
  color: var(--app-text);
}

.btn-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
