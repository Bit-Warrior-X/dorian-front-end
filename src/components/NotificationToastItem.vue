<template>
  <article
    class="toast"
    :class="`toast--${note.type}`"
    role="status"
    aria-live="polite"
  >
    <div class="toast__accent" aria-hidden="true"></div>
    <div class="toast__body">
      <div class="toast__icon" aria-hidden="true">
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

      <div class="toast__content">
        <div class="toast__meta">
          <span class="toast__kind">{{ typeLabel }}</span>
          <button
            type="button"
            class="toast__close"
            aria-label="Dismiss notification"
            @click="emit('dismiss')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <h4 class="toast__title">{{ note.title }}</h4>
        <p class="toast__message">{{ note.message }}</p>
      </div>
    </div>
    <div
      class="toast__progress"
      aria-hidden="true"
      :style="{ animationDuration: `${note.duration || 4000}ms` }"
    ></div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  note: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['dismiss'])

const typeLabel = computed(() => {
  const map = {
    success: 'OK',
    error: 'ERROR',
    warning: 'WARN',
    info: 'INFO',
  }
  return map[props.note.type] || 'NOTE'
})
</script>

<style scoped>
.toast {
  --toast-accent: var(--dorian-viper-500, #2e9e6c);
  --toast-accent-soft: var(--dorian-viper-dim, rgba(46, 158, 108, 0.16));
  --toast-accent-fg: var(--dorian-viper-400, #3fbd85);

  pointer-events: auto;
  position: relative;
  overflow: hidden;
  width: min(360px, calc(100vw - 32px));
  border-radius: 8px;
  background: var(--app-surface-elevated, var(--app-surface-solid));
  border: 0.5px solid var(--app-border);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  color: var(--app-text);
}

.toast__accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--toast-accent);
}

.toast__body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 12px 14px 14px;
}

.toast__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 0.5px solid color-mix(in srgb, var(--toast-accent) 35%, transparent);
  background: var(--toast-accent-soft);
  color: var(--toast-accent-fg);
}

.toast__icon svg {
  width: 14px;
  height: 14px;
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.toast__kind {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--toast-accent-fg);
}

.toast__title {
  margin: 0 0 4px;
  font-size: var(--type-base, 0.8125rem);
  font-weight: 650;
  line-height: 1.3;
  color: var(--app-heading);
}

.toast__message {
  margin: 0;
  font-size: var(--type-caption, 0.72rem);
  font-weight: 500;
  line-height: 1.45;
  color: var(--app-text-muted);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 12rem;
  overflow-y: auto;
}

.toast__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0.5px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.toast__close svg {
  width: 12px;
  height: 12px;
}

.toast__close:hover {
  background: var(--app-surface-hover, rgba(255, 255, 255, 0.06));
  border-color: var(--app-border);
  color: var(--app-text);
}

.toast__progress {
  height: 2px;
  width: 100%;
  transform-origin: left center;
  background: var(--toast-accent);
  opacity: 0.7;
  animation-name: toast-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.toast--success {
  --toast-accent: var(--dorian-viper-500, #2e9e6c);
  --toast-accent-soft: var(--dorian-viper-dim, rgba(46, 158, 108, 0.18));
  --toast-accent-fg: var(--dorian-viper-400, #3fbd85);
}

.toast--error {
  --toast-accent: var(--dorian-danger, #e15241);
  --toast-accent-soft: rgba(225, 82, 65, 0.14);
  --toast-accent-fg: #e8796d;
}

.toast--warning {
  --toast-accent: var(--dorian-gold-500, #c9a24a);
  --toast-accent-soft: var(--dorian-gold-dim, rgba(201, 162, 74, 0.16));
  --toast-accent-fg: var(--dorian-warn, #e0a83f);
}

.toast--info {
  --toast-accent: #6b9fd4;
  --toast-accent-soft: rgba(107, 159, 212, 0.14);
  --toast-accent-fg: #8bb4df;
}

@keyframes toast-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .toast__progress {
    animation: none;
  }
}
</style>
