<template>
  <button
    type="button"
    class="theme-toggle"
    :class="[variant, { 'with-label': showLabel }]"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="theme.toggleTheme()"
  >
    <svg
      v-if="isDark"
      class="theme-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
    </svg>
    <svg
      v-else
      class="theme-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
    <span v-if="showLabel" class="theme-label">{{ isDark ? 'Light' : 'Dark' }}</span>
  </button>
</template>

<script setup>
import { useTheme } from '@/stores/theme'

defineProps({
  variant: {
    type: String,
    default: 'default',
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
})

const theme = useTheme()
const isDark = theme.isDark
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid var(--app-border, rgba(226, 232, 240, 0.9));
  background: var(--app-surface-solid, #fff);
  color: var(--app-text, #1f2937);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: var(--app-accent-soft, rgba(99, 102, 241, 0.12));
  border-color: var(--app-accent, #6366f1);
  color: var(--app-accent, #6366f1);
  transform: translateY(-1px);
}

.theme-toggle.on-login {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
  backdrop-filter: blur(8px);
}

.theme-toggle.on-login:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.55);
  color: #fff;
}

[data-theme='dark'] .theme-toggle.on-login {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.theme-toggle.in-sidebar {
  width: 100%;
  height: auto;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  justify-content: flex-start;
}

.theme-toggle.in-sidebar:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.25);
  color: #fff;
  transform: none;
}

.theme-toggle.with-label {
  width: auto;
  padding: 0 14px;
}

.theme-icon {
  width: 20px;
  height: 20px;
}

.theme-label {
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
