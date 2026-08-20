<template>
  <Teleport to="body">
    <div v-if="modelValue" class="confirm-backdrop" @click.self="handleCancel">
      <div class="confirm-card" role="dialog" aria-modal="true" @click.stop>
        <div class="confirm-header">
          <h3>{{ title }}</h3>
        </div>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-actions">
          <button class="secondary-btn" type="button" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button
            class="primary-btn"
            :class="{ 'primary-btn--danger': danger }"
            type="button"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to continue?'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  danger: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const handleCancel = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('update:modelValue', false)
  emit('confirm')
}
</script>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1100;
}

.confirm-card {
  width: 100%;
  max-width: 420px;
  background: var(--app-surface-solid);
  border-radius: 18px;
  box-shadow: 0 24px 48px var(--app-shadow);
  border: 1px solid var(--app-border);
  padding: 22px;
}

.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.confirm-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.confirm-cancel {
  border: none;
  background: transparent;
  color: #b91c1c;
  font-weight: 600;
  font-size: var(--type-base);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.confirm-cancel:hover {
  color: #991b1b;
  background: rgba(239, 68, 68, 0.15);
}

.confirm-header h3 {
  margin: 0;
  font-size: var(--type-metric-value);
  font-weight: 600;
  color: var(--app-heading);
}

.confirm-close {
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

.confirm-close:hover {
  background: rgba(148, 163, 184, 0.25);
  color: #1f2937;
}

.confirm-message {
  margin: 0 0 20px 0;
  color: var(--app-text-secondary);
  font-size: var(--type-base);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.primary-btn,
.secondary-btn {
  cursor: pointer;
}

.secondary-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.primary-btn--danger {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}

.primary-btn--danger:hover {
  background: #b91c1c;
  border-color: #b91c1c;
}
</style>

