<template>
  <span
    class="preview-badge"
    :title="title"
    role="note"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" /><path d="M12 8v5M12 16h.01" /></svg>
    {{ label }}
  </span>
</template>

<script setup>
defineProps({
  label: { type: String, default: 'Preview data' },
  title: {
    type: String,
    default: 'Sample data generated in the browser. It is replaced automatically once the edge reports this metric.',
  },
})
</script>

<style scoped>
.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  border: 0.5px solid color-mix(in srgb, var(--dorian-warn, #e0a83f) 40%, transparent);
  background: color-mix(in srgb, var(--dorian-warn, #e0a83f) 10%, transparent);
  color: var(--dorian-warn, #e0a83f);
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.02em;
  white-space: nowrap;
  cursor: help;
}

.preview-badge svg {
  width: 12px;
  height: 12px;
}
</style>
