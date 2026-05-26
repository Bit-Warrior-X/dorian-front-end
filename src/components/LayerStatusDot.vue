<template>
  <span
    ref="anchorRef"
    class="layer-dot-wrap"
    :class="{ 'layer-dot-wrap--legend': legend }"
    tabindex="0"
    :aria-label="ariaLabel"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focus="showTooltip"
    @blur="hideTooltip"
  >
    <span class="layer-dot" :class="dotClasses" aria-hidden="true"></span>
    <Teleport to="body">
      <span
        v-if="visible"
        class="layer-dot-tooltip layer-dot-tooltip--portal"
        :style="tooltipStyle"
        role="tooltip"
      >{{ description }}</span>
    </Teleport>
  </span>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  description: {
    type: String,
    required: true,
  },
  ariaLabel: {
    type: String,
    required: true,
  },
  /** running | stopped | deployed | unknown | na */
  status: {
    type: String,
    default: 'unknown',
  },
  layer: {
    type: String,
    required: true,
    validator: (v) => v === 'l4' || v === 'l7',
  },
  legend: {
    type: Boolean,
    default: false,
  },
})

const anchorRef = ref(null)
const visible = ref(false)
const tooltipStyle = ref({})

const dotClasses = computed(() => [
  'layer-dot',
  `layer-dot--${props.layer}`,
  props.legend ? 'layer-dot--legend' : '',
  `layer-dot--${props.status}`,
])

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
