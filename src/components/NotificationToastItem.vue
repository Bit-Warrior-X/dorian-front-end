<template>
  <article class="toast" :class="note.type" role="status" aria-live="polite">
    <div class="toast-body">
      <div class="toast-icon" aria-hidden="true">
        <svg
          v-if="note.type === 'success'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <svg
          v-else-if="note.type === 'error'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <svg
          v-else-if="note.type === 'warning'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>

      <div class="toast-content">
        <div class="toast-header">
          <h4 class="toast-title">{{ note.title }}</h4>
          <button
            type="button"
            class="toast-close"
            aria-label="Dismiss notification"
            @click="emit('dismiss')"
          >
            ×
          </button>
        </div>
        <p class="toast-message">{{ note.message }}</p>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  note: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['dismiss'])
</script>

<style scoped>
.toast {
  pointer-events: auto;
  min-width: 340px;
  max-width: 460px;
  min-height: 96px;
  border-radius: 16px;
  background: var(--app-surface-solid);
  box-shadow: 0 16px 32px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.toast-body {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.06);
}

.toast-icon svg {
  width: 22px;
  height: 22px;
}

.toast-content {
  flex: 1;
  min-width: 0;
  padding-top: 2px;
}

.toast-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.toast-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.35;
  color: inherit;
}

.toast-message {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 500;
  line-height: 1.55;
  color: inherit;
  opacity: 0.9;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin: -4px -6px 0 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.65;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(15, 23, 42, 0.08);
}

.toast.success {
  border-color: rgba(16, 185, 129, 0.42);
  background: rgba(236, 253, 245, 0.98);
  color: #065f46;
}

.toast.success .toast-icon {
  background: rgba(16, 185, 129, 0.14);
  color: #059669;
}

.toast.error {
  border-color: rgba(239, 68, 68, 0.42);
  background: rgba(254, 242, 242, 0.98);
  color: #b91c1c;
}

.toast.error .toast-icon {
  background: rgba(239, 68, 68, 0.14);
  color: #dc2626;
}

.toast.warning {
  border-color: rgba(245, 158, 11, 0.42);
  background: rgba(255, 251, 235, 0.98);
  color: #b45309;
}

.toast.warning .toast-icon {
  background: rgba(245, 158, 11, 0.16);
  color: #d97706;
}

.toast.info {
  border-color: rgba(59, 130, 246, 0.42);
  background: rgba(239, 246, 255, 0.98);
  color: #1d4ed8;
}

.toast.info .toast-icon {
  background: rgba(59, 130, 246, 0.14);
  color: #2563eb;
}
</style>
