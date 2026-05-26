<template>
  <div
    class="version-selector"
    role="radiogroup"
    :aria-label="ariaLabel"
  >
    <div class="version-grid">
      <button
        v-for="(item, index) in versions"
        :key="item.uuid"
        type="button"
        class="version-card"
        :class="[
          cardAccentClass(item, index),
          {
            selected: modelValue === item.uuid,
            disabled: disabled || isInstalled(item),
            'version-card--installed': isInstalled(item),
            'version-card--latest': isLatest(index) && !isInstalled(item),
          },
        ]"
        :disabled="disabled || isInstalled(item)"
        :aria-pressed="modelValue === item.uuid"
        @click="select(item.uuid)"
      >
        <div class="version-card-accent" aria-hidden="true"></div>

        <header class="version-header">
          <div class="version-header-text">
            <span v-if="badgeFor(item, index)" class="version-badge">{{ badgeFor(item, index) }}</span>
            <span class="version-title">v{{ displayVersion(item) }}</span>
            <span class="version-tagline">{{ versionPackageLabel(item) }}</span>
          </div>
          <span
            class="version-radio"
            :class="{
              checked: modelValue === item.uuid && !isInstalled(item),
              'version-radio--installed': isInstalled(item),
            }"
            aria-hidden="true"
          >
            <svg
              v-if="isInstalled(item) || modelValue === item.uuid"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M3.5 8.5L6.5 11.5L12.5 4.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </header>

        <section class="version-section version-section--release">
          <h4 class="version-section-label">Release</h4>
          <div class="release-block">
            <span class="release-label">Updated</span>
            <span class="release-date">{{ formatVersionUpdated(item.updated) }}</span>
          </div>
        </section>
      </button>
    </div>
  </div>
</template>

<script setup>
import {
  formatVersionUpdated,
  isSameProductVersion,
  versionPackageLabel,
} from '@/utils/deployVersions'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  versions: {
    type: Array,
    default: () => [],
  },
  /** Server's installed version — matching panel is marked installed and disabled. */
  currentVersion: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: 'Product version',
  },
})

const emit = defineEmits(['update:modelValue'])

const displayVersion = (item) => {
  const v = String(item?.version || '').trim()
  return v.replace(/^v/i, '') || '—'
}

const isInstalled = (item) => isSameProductVersion(item?.version, props.currentVersion)

const isLatest = (index) => index === 0

const badgeFor = (item, index) => {
  if (isInstalled(item)) return 'Installed'
  if (isLatest(index)) return 'Latest'
  return null
}

const cardAccentClass = (item, index) => {
  if (isInstalled(item)) return 'version-card--green'
  if (isLatest(index)) return 'version-card--indigo'
  return index % 2 === 0 ? 'version-card--blue' : 'version-card--violet'
}

const select = (uuid) => {
  if (props.disabled) return
  const item = props.versions.find((v) => v.uuid === uuid)
  if (item && isInstalled(item)) return
  emit('update:modelValue', uuid)
}
</script>

<style scoped>
.version-selector {
  width: 100%;
}

.version-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.version-card {
  position: relative;
  text-align: left;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  min-width: 0;
  border-radius: 16px;
  border: 2px solid var(--tier-card-border, #e2e8f0);
  background: var(--tier-card-bg, #fff);
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.18s ease;
  font: inherit;
  color: #1e293b;
}

.version-card:hover:not(.disabled):not(.selected) {
  border-color: var(--app-accent, #a855f7);
  box-shadow: 0 8px 24px var(--app-accent-soft, rgba(168, 85, 247, 0.12));
  transform: translateY(-2px);
}

.version-card.selected {
  border-color: var(--app-accent, #a855f7);
  box-shadow:
    0 0 0 1px rgba(168, 85, 247, 0.35),
    0 12px 32px var(--app-shadow, rgba(0, 0, 0, 0.2));
}

.version-card.disabled:not(.version-card--installed) {
  opacity: 0.72;
  cursor: not-allowed;
  transform: none;
}

.version-card--installed {
  border-color: #22c55e;
  background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
  box-shadow:
    0 0 0 1px rgba(34, 197, 94, 0.3),
    0 4px 16px rgba(34, 197, 94, 0.12);
  cursor: not-allowed;
  transform: none;
}

.version-card--installed:hover {
  border-color: #22c55e;
  box-shadow:
    0 0 0 1px rgba(34, 197, 94, 0.35),
    0 4px 16px rgba(34, 197, 94, 0.15);
  transform: none;
}

.version-card-accent {
  height: 4px;
  width: 100%;
  flex-shrink: 0;
}

.version-card--green .version-card-accent {
  background: linear-gradient(90deg, #4ade80, #16a34a);
}

.version-card--blue .version-card-accent {
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
}

.version-card--violet .version-card-accent {
  background: linear-gradient(90deg, #a78bfa, #7c3aed);
}

.version-card--indigo .version-card-accent {
  background: linear-gradient(90deg, #818cf8, #4f46e5);
}

.version-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
}

.version-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.version-badge {
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #4338ca;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border: 1px solid rgba(99, 102, 241, 0.25);
  padding: 3px 8px;
  border-radius: 999px;
  margin-bottom: 4px;
}

.version-card--installed .version-badge {
  color: #166534;
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(34, 197, 94, 0.45);
}

.version-card--installed .version-title {
  color: #15803d;
}

.version-card--installed .release-block {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.28);
}

.version-card--installed .release-label {
  color: #16a34a;
}

.version-title {
  font-weight: 800;
  font-size: 1.28rem;
  color: var(--app-heading, #0f172a);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.version-tagline {
  font-size: 0.76rem;
  color: var(--app-text-muted, #64748b);
  font-weight: 500;
  word-break: break-all;
  line-height: 1.35;
}

.version-radio {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.version-radio.checked {
  border-color: #4f46e5;
  background: #4f46e5;
  color: #fff;
}

.version-radio--installed {
  border-color: #16a34a;
  background: #16a34a;
  color: #fff;
}

.version-radio svg {
  width: 12px;
  height: 12px;
}

.version-section {
  padding: 0 16px 12px;
}

.version-section-label {
  margin: 0 0 8px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.release-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--tier-pricing-bg, linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%));
  border: 1px solid var(--app-border, #e2e8f0);
}

.release-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.release-date {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--app-heading, #0f172a);
  line-height: 1.35;
}

.version-card.selected .release-block {
  background: var(--app-accent-soft, linear-gradient(180deg, #eef2ff 0%, #e0e7ff 100%));
  border-color: rgba(168, 85, 247, 0.35);
}

.version-section--release {
  padding-bottom: 16px;
}

@media (max-width: 720px) {
  .version-grid {
    grid-template-columns: 1fr;
  }
}
</style>
