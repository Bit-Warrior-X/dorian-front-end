<template>
  <div v-if="message" class="deploy-error" role="alert">
    <p class="deploy-error__message">{{ message }}</p>
    <div v-if="hasDetails" class="deploy-error__actions">
      <button type="button" class="deploy-error__toggle" @click="expanded = !expanded">
        {{ expanded ? 'Hide technical details' : 'Show technical details' }}
      </button>
      <button type="button" class="deploy-error__copy" @click="copyDetails">
        {{ copied ? 'Copied' : 'Copy details' }}
      </button>
    </div>
    <pre v-if="expanded && hasDetails" class="deploy-error__details">{{ detailsText }}</pre>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: '',
  },
  details: {
    type: Object,
    default: null,
  },
})

const expanded = ref(false)
const copied = ref(false)

watch(
  () => props.message,
  () => {
    expanded.value = false
    copied.value = false
  }
)

const detailEntries = computed(() => {
  const d = props.details && typeof props.details === 'object' ? props.details : {}
  const keys = [
    'req_id',
    'op',
    'script_error',
    'detail',
    'description',
    'hint',
    'stderr',
    'stdout',
    'status',
  ]
  const out = []
  for (const key of keys) {
    const val = d[key]
    if (val == null || String(val).trim() === '') continue
    out.push([key, String(val)])
  }
  return out
})

const hasDetails = computed(() => detailEntries.value.length > 0)

const detailsText = computed(() =>
  detailEntries.value.map(([k, v]) => `${k}:\n${v}`).join('\n\n')
)

const copyDetails = async () => {
  const text = [props.message, detailsText.value].filter(Boolean).join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    copied.value = false
  }
}
</script>

<style scoped>
.deploy-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #f87171;
  font-size: var(--type-base);
}

.deploy-error__message {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
}

.deploy-error__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.deploy-error__toggle,
.deploy-error__copy {
  appearance: none;
  border: 1px solid rgba(248, 113, 113, 0.45);
  background: rgba(0, 0, 0, 0.18);
  color: #fecaca;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: var(--type-caption, 0.72rem);
  font-weight: 600;
  cursor: pointer;
}

.deploy-error__toggle:hover,
.deploy-error__copy:hover {
  background: rgba(0, 0, 0, 0.28);
}

.deploy-error__details {
  margin: 10px 0 0;
  padding: 10px 12px;
  max-height: 220px;
  overflow: auto;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(248, 113, 113, 0.25);
  color: #fecaca;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
