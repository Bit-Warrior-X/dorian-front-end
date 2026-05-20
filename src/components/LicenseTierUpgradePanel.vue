<template>
  <div class="license-tier-panel">
    <p v-if="intro" class="intro">{{ intro }}</p>
    <p v-if="errorMessage" class="error-banner" role="alert">{{ errorMessage }}</p>
    <div class="tier-grid" role="radiogroup" :aria-label="'License type for ' + (server?.name || 'server')">
      <button
        v-for="plan in licensePlans"
        :key="plan.id"
        type="button"
        class="tier-card"
        :class="{ selected: selectedTier === plan.id, disabled: isSubmitting }"
        :disabled="isSubmitting"
        :aria-pressed="selectedTier === plan.id"
        @click="selectedTier = plan.id"
      >
        <span class="tier-title">{{ plan.title }}</span>
        <span class="tier-desc">{{ plan.description }}</span>
      </button>
    </div>
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

const props = defineProps({
  server: {
    type: Object,
    required: true,
  },
  /** Shown above the tier grid (e.g. current server summary). */
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

const licensePlans = [
  {
    id: 'Trial',
    title: 'Trial',
    description:
      'Short evaluation tier. A new 3-day trial license is generated for this host and pushed with deploy (license-only).',
  },
  {
    id: 'L4',
    title: 'L4',
    description:
      'Layer 4 protection focus. A new annual L4 license is generated, bound to the host, and installed remotely.',
  },
  {
    id: 'L7',
    title: 'L7',
    description:
      'Application-layer (L7) feature set. A new annual L7 license replaces the previous file on the server.',
  },
  {
    id: 'Unified',
    title: 'Unified',
    description:
      'Combined L4 and L7 capabilities. A new annual unified license is deployed without reinstalling the full product bundle.',
  },
]

function normalizeTier(raw) {
  const t = String(raw || 'Trial').trim().toLowerCase()
  if (t === 'trial') return 'Trial'
  if (t === 'l4') return 'L4'
  if (t === 'l7') return 'L7'
  if (t === 'unified') return 'Unified'
  const cap = String(raw || 'Trial').trim()
  const known = ['Trial', 'L4', 'L7', 'Unified']
  const hit = known.find((k) => k.toLowerCase() === cap.toLowerCase())
  return hit || 'Trial'
}

const selectedTier = ref(normalizeTier(props.server?.license))
const isSubmitting = ref(false)
const errorMessage = ref('')

watch(
  () => [props.server?.id, props.server?.license],
  () => {
    selectedTier.value = normalizeTier(props.server?.license)
    errorMessage.value = ''
  }
)

watch(isSubmitting, (v) => {
  emit('pending', v)
})

const initialTier = computed(() => normalizeTier(props.server?.license))

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
  gap: 16px;
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

.tier-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.tier-card {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 2px solid rgba(226, 232, 240, 0.95);
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  font: inherit;
  color: #1e293b;
}

.tier-card:hover:not(.disabled) {
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.12);
}

.tier-card.selected {
  border-color: rgba(79, 70, 229, 0.75);
  background: rgba(238, 242, 255, 0.65);
  box-shadow: 0 6px 18px rgba(79, 70, 229, 0.15);
}

.tier-card.disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.tier-title {
  font-weight: 700;
  font-size: 1.05rem;
  color: #0f172a;
}

.tier-desc {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.45;
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
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-secondary {
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #fff;
  color: #475569;
}

.btn-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
