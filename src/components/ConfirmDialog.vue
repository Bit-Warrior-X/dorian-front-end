<template>
  <div v-if="modelValue" class="confirm-backdrop" @click="handleCancel">
    <div class="confirm-card" @click.stop>
      <div class="confirm-header">
        <h3>{{ title }}</h3>
      </div>
      <p class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <button class="secondary-btn" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button class="primary-btn" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
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
  background: white;
  border-radius: 18px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  border: 1px solid rgba(226, 232, 240, 0.9);
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
  font-size: 0.9rem;
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
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f2937;
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
  color: #475569;
  font-size: 0.95rem;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.primary-btn {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 20px rgba(22, 163, 74, 0.25);
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 22px rgba(22, 163, 74, 0.32);
}

.secondary-btn {
  background: rgba(254, 242, 242, 0.9);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.6);
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  border-color: rgba(220, 38, 38, 0.8);
  color: #991b1b;
  background: rgba(239, 68, 68, 0.16);
}
</style>

