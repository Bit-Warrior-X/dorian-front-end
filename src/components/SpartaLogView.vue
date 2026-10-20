<template>
  <div ref="logEl" class="sparta-log">
    <p v-if="error" class="sparta-log__error">{{ error }}</p>
    <p v-else-if="!parsed.length" class="sparta-wait">Waiting for Sparta log…</p>
    <div
      v-for="(line, index) in parsed"
      :key="index"
      class="sparta-line"
      :class="{ event: line.event }"
    >
      <span v-if="line.time" class="sparta-time">[{{ line.time }}]</span><span class="sparta-body">{{ line.body }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  lines: { type: Array, default: () => [] },
  error: { type: String, default: '' },
})

const logEl = ref(null)

const parseSpartaLine = (raw) => {
  const text = String(raw || '')
    .replace(/\x1b\[[0-9;]*m/g, '')
    .trim()
  if (!text || text.startsWith('-- ')) return null
  const stamped = text.match(/\[(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2})\]\s*(.*)$/)
  if (!stamped) return { time: '', body: text, event: true }
  return {
    time: stamped[1].replace('T', ' '),
    body: stamped[2],
    event: !/\bSYN\s*:/.test(stamped[2]),
  }
}

const parsed = computed(() => props.lines.map(parseSpartaLine).filter(Boolean))

watch(parsed, async () => {
  await nextTick()
  if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
})
</script>

<style scoped>
.sparta-log {
  max-height: 320px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 9px;
  border: 0.5px solid var(--app-border);
  background: color-mix(in srgb, var(--app-bg, #070b09) 85%, #000);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
}

.sparta-line {
  white-space: nowrap;
  color: #e7f0ea;
}

.sparta-time {
  margin-right: 8px;
  color: #3fbd85;
}

.sparta-line.event .sparta-body,
.sparta-wait,
.sparta-log__error {
  color: #3fbd85;
}

.sparta-wait,
.sparta-log__error {
  margin: 0;
}
</style>
