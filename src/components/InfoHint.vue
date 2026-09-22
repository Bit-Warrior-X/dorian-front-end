<template>
  <span
    ref="anchorRef"
    class="info-hint"
    tabindex="0"
    role="img"
    :aria-label="ariaLabel || text"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focus="showTooltip"
    @blur="hideTooltip"
  >
    <span class="info-hint__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10.5v6" />
        <circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    </span>
    <Teleport to="body">
      <span
        v-if="visible"
        class="info-hint-tooltip"
        :style="tooltipStyle"
        role="tooltip"
      >{{ text }}</span>
    </Teleport>
  </span>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'

defineProps({
  text: {
    type: String,
    required: true,
  },
  ariaLabel: {
    type: String,
    default: '',
  },
})

const anchorRef = ref(null)
const visible = ref(false)
const tooltipStyle = ref({})

let repositionHandler = null

const updatePosition = () => {
  const el = anchorRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  tooltipStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top}px`,
  }
}

const bindReposition = () => {
  repositionHandler = () => {
    if (visible.value) updatePosition()
  }
  window.addEventListener('scroll', repositionHandler, true)
  window.addEventListener('resize', repositionHandler)
}

const unbindReposition = () => {
  if (!repositionHandler) return
  window.removeEventListener('scroll', repositionHandler, true)
  window.removeEventListener('resize', repositionHandler)
  repositionHandler = null
}

const showTooltip = () => {
  updatePosition()
  visible.value = true
  bindReposition()
}

const hideTooltip = () => {
  visible.value = false
  unbindReposition()
}

onBeforeUnmount(() => {
  hideTooltip()
})
</script>
