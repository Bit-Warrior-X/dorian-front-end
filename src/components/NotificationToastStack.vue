<template>
  <div class="toast-stack">
    <NotificationToastItem
      v-for="note in notifications.state.queue"
      :key="note.id"
      :note="note"
      @dismiss="notifications.dismiss(note.id)"
    />
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
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 1300;
  pointer-events: none;
}
</style>
