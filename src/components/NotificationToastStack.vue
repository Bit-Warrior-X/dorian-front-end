<template>
  <div class="toast-stack">
    <article
      v-for="note in notifications.state.queue"
      :key="note.id"
      class="toast"
      :class="note.type"
      role="status"
      aria-live="polite"
    >
      <div class="toast-header">
        <h4 class="toast-title">{{ note.title }}</h4>
        <button
          type="button"
          class="toast-close"
          aria-label="Dismiss notification"
          @click="notifications.dismiss(note.id)"
        >
          ×
        </button>
      </div>
      <p class="toast-message">{{ note.message }}</p>
    </article>
  </div>
</template>

<script setup>
import { useNotifications } from '@/stores/notifications'

const notifications = useNotifications()
</script>

<style scoped>
.toast-stack {
  position: fixed;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1300;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  min-width: 280px;
  max-width: 420px;
  padding: 14px 16px 12px;
  border-radius: 14px;
  background: var(--app-surface-solid);
  box-shadow: 0 16px 32px var(--app-shadow);
  border: 1px solid var(--app-border);
}

.toast-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.toast-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
  color: inherit;
}

.toast-message {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 500;
  line-height: 1.45;
  color: inherit;
  opacity: 0.92;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin: -2px -4px 0 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 1.2rem;
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

.toast.error {
  border-color: rgba(239, 68, 68, 0.42);
  background: rgba(254, 242, 242, 0.98);
  color: #b91c1c;
}

.toast.warning {
  border-color: rgba(245, 158, 11, 0.42);
  background: rgba(255, 251, 235, 0.98);
  color: #b45309;
}

.toast.info {
  border-color: rgba(59, 130, 246, 0.42);
  background: rgba(239, 246, 255, 0.98);
  color: #1d4ed8;
}
</style>
