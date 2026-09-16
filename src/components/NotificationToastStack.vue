<template>
  <div class="toast-stack" aria-live="polite" aria-relevant="additions">
    <TransitionGroup name="toast-stack">
      <NotificationToastItem
        v-for="note in notifications.state.queue"
        :key="note.id"
        :note="note"
        @dismiss="notifications.dismiss(note.id)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useNotifications } from '@/stores/notifications'
import NotificationToastItem from './NotificationToastItem.vue'

const notifications = useNotifications()
</script>

<style scoped>
.toast-stack {
  position: fixed;
  top: 18px;
  right: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1300;
  pointer-events: none;
  max-height: calc(100vh - 36px);
  overflow: hidden;
}

.toast-stack-enter-active,
.toast-stack-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.toast-stack-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.toast-stack-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

@media (max-width: 640px) {
  .toast-stack {
    top: 12px;
    right: 12px;
    left: 12px;
    align-items: stretch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast-stack-enter-active,
  .toast-stack-leave-active {
    transition: none;
  }
}
</style>
