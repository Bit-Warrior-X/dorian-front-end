<template>
  <div ref="rootRef" class="alarm-bell">
    <button
      type="button"
      class="alarm-bell__btn"
      :class="{ unread: unreadCount > 0, live: liveCount > 0, open: isOpen }"
      :aria-label="ariaLabel"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </svg>
      <span v-if="unreadCount > 0" class="alarm-bell__badge num" aria-hidden="true">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div v-if="isOpen" class="alarm-bell__panel" role="dialog" aria-label="Alarms">
      <div class="alarm-bell__head">
        <div>
          <h3>Alarms</h3>
          <p>
            <template v-if="liveCount">{{ liveCount }} live · </template>
            {{ unreadCount }} unread
          </p>
        </div>
        <div class="alarm-bell__head-actions">
          <button
            v-if="unreadCount"
            type="button"
            class="alarm-bell__text-btn"
            @click="alarms.markAllRead()"
          >
            Mark all read
          </button>
          <button
            v-if="items.length"
            type="button"
            class="alarm-bell__text-btn"
            @click="alarms.clear()"
          >
            Clear
          </button>
        </div>
      </div>

      <p v-if="!items.length" class="alarm-bell__empty">No alarms yet. New attack alerts will queue here.</p>

      <ul v-else class="alarm-bell__list">
        <li
          v-for="item in items"
          :key="item.id"
          class="alarm-bell__item"
          :class="[item.severity, { unread: !item.read, live: item.status === 'ongoing' }]"
        >
          <span class="alarm-bell__accent" aria-hidden="true"></span>
          <button type="button" class="alarm-bell__item-main" @click="openItem(item)">
            <span class="alarm-bell__item-kicker">
              <span
                v-if="item.kind === 'attack'"
                class="alarm-bell__layer"
                :class="layerTone(item)"
              >{{ layerLabel(item) }}</span>
              {{ kindLabel(item) }}
              <span v-if="item.status === 'ongoing'" class="alarm-bell__live-tag">Live</span>
              <span v-else-if="item.status === 'ended'" class="alarm-bell__ended-tag">Ended</span>
            </span>
            <strong>{{ item.title }}</strong>
            <span v-if="item.body" class="alarm-bell__item-body">{{ item.body }}</span>
            <span class="alarm-bell__item-meta">
              <span v-if="item.serverName">{{ item.serverName }}</span>
              <span>{{ formatWhen(item.at) }}</span>
            </span>
          </button>
          <button
            type="button"
            class="alarm-bell__dismiss"
            :aria-label="`Dismiss ${item.title}`"
            @click.stop="dismissItem(item)"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { openAttackConsole } from '@/stores/attackAlert'
import { useAlarms } from '@/stores/alarms'

const alarms = useAlarms()
const rootRef = ref(null)
const isOpen = ref(false)

const items = computed(() => alarms.state.items)
const unreadCount = computed(() => alarms.unreadCount.value)
const liveCount = computed(() => alarms.liveCount.value)

const ariaLabel = computed(() => {
  if (unreadCount.value) return `Alarms, ${unreadCount.value} unread`
  if (liveCount.value) return `Alarms, ${liveCount.value} live attacks`
  return 'Alarms'
})

const layerLabel = (item) => {
  const raw = String(item?.layer || '').toUpperCase()
  if (raw === 'L7' || raw === 'L4') return raw
  return /\bL7\b/i.test(`${item?.title || ''} ${item?.body || ''}`) ? 'L7' : 'L4'
}
const layerTone = (item) => (layerLabel(item) === 'L7' ? 'l7' : 'l4')
const kindLabel = (item) => {
  if (item.kind === 'attack') return `${layerLabel(item)} attack`
  return item.kind || 'Alarm'
}

const formatWhen = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const openItem = (item) => {
  void alarms.markRead(item.id)
  if (item.kind === 'attack' && item.reqId) {
    openAttackConsole(item.reqId)
  }
  close()
}

const dismissItem = (item) => {
  void alarms.dismiss(item.id)
}

const onDocumentClick = (event) => {
  if (!rootRef.value?.contains(event.target)) close()
}

const onKey = (event) => {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  void alarms.load()
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKey)
})
</script>
