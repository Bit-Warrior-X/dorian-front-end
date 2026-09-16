<template>
  <div
    class="version-selector"
    :class="{ 'version-selector--compact': compact }"
    role="radiogroup"
    :aria-label="ariaLabel"
  >
    <div class="version-list">
      <button
        v-for="(item, index) in versions"
        :key="item.uuid"
        type="button"
        class="version-row"
        :class="{
          'is-selected': modelValue === item.uuid && !isInstalled(item),
          'is-installed': isInstalled(item),
          'is-latest': isLatest(index) && !isInstalled(item),
          'is-disabled': disabled || isInstalled(item),
        }"
        :disabled="disabled || isInstalled(item)"
        :aria-pressed="modelValue === item.uuid"
        @click="select(item.uuid)"
      >
        <span class="version-row__accent" aria-hidden="true"></span>

        <div class="version-row__body">
          <div class="version-row__top">
            <div class="version-row__identity">
              <span class="version-row__version num">v{{ displayVersion(item) }}</span>
              <span
                v-if="badgeFor(item, index)"
                class="version-row__badge"
                :class="badgeClass(item, index)"
              >
                {{ badgeFor(item, index) }}
              </span>
            </div>
            <div class="version-row__end">
              <span
                v-if="compact"
                class="version-row__updated num"
              >
                {{ formatVersionUpdated(item.updated) }}
              </span>
              <span class="version-row__check" aria-hidden="true">
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
            </div>
          </div>

          <template v-if="!compact">
            <p class="version-row__package" :title="versionPackageLabel(item)">
              {{ versionPackageLabel(item) }}
            </p>

            <div class="version-row__meta">
              <span v-if="formatVersionOs(item.os)" class="version-row__meta-item">
                <span class="version-row__meta-label">OS</span>
                <span class="version-row__meta-value">{{ formatVersionOs(item.os) }}</span>
              </span>
              <span class="version-row__meta-item">
                <span class="version-row__meta-label">Updated</span>
                <span class="version-row__meta-value num">{{ formatVersionUpdated(item.updated) }}</span>
              </span>
            </div>
          </template>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import {
  formatVersionOs,
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
  /** Single-line rows: version + badge + date (for upgrade / filtered lists). */
  compact: {
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

const badgeClass = (item, index) => {
  if (isInstalled(item)) return 'version-row__badge--installed'
  if (isLatest(index)) return 'version-row__badge--latest'
  return ''
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

.version-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-row {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  font: inherit;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.version-row__accent {
  width: 3px;
  flex-shrink: 0;
  background: var(--app-border-strong, var(--app-border));
  transition: background 0.15s ease;
}

.version-row__body {
  flex: 1;
  min-width: 0;
  padding: 11px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.version-row__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.version-row__identity {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.version-row__version {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
  line-height: 1.2;
}

.version-row__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid var(--app-border);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
  background: color-mix(in srgb, var(--app-surface-elevated) 80%, transparent);
}

.version-row__badge--latest {
  color: var(--dorian-viper-400, var(--app-accent));
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 35%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 12%, transparent);
}

.version-row__badge--installed {
  color: var(--dorian-viper-400, var(--app-accent));
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 40%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 14%, transparent);
}

.version-row__end {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.version-row__updated {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-muted);
  white-space: nowrap;
}

.version-row__check {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid var(--app-border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: transparent;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.version-row__check svg {
  width: 11px;
  height: 11px;
}

.version-selector--compact .version-list {
  gap: 6px;
}

.version-selector--compact .version-row__body {
  padding: 14px 14px;
  gap: 0;
}

.version-selector--compact .version-row__top {
  align-items: center;
}

.version-selector--compact .version-row__version {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.version-selector--compact .version-row__badge {
  font-size: 10.5px;
  padding: 3px 8px;
}

.version-selector--compact .version-row__check {
  width: 22px;
  height: 22px;
}

.version-row__package {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--app-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 2px;
}

.version-row__meta-item {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.version-row__meta-label {
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.version-row__meta-value {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--app-heading);
}

.version-row:hover:not(.is-disabled):not(.is-selected) {
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 40%, var(--app-border));
}

.version-row:hover:not(.is-disabled):not(.is-selected) .version-row__accent {
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 55%, var(--app-border));
}

.version-row.is-latest:not(.is-selected):not(.is-installed) .version-row__accent {
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 45%, var(--app-border));
}

.version-row.is-selected {
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 55%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 8%, var(--app-surface));
}

.version-row.is-selected .version-row__accent {
  background: var(--dorian-viper-500, var(--app-accent));
}

.version-row.is-selected .version-row__check {
  border-color: var(--dorian-viper-500, var(--app-accent));
  background: var(--dorian-viper-500, var(--app-accent));
  color: #08120e;
}

.version-row.is-installed {
  cursor: not-allowed;
  border-color: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 30%, var(--app-border));
  background: color-mix(in srgb, var(--dorian-viper-500, var(--app-accent)) 6%, var(--app-surface));
}

.version-row.is-installed .version-row__accent {
  background: var(--dorian-viper-500, var(--app-accent));
}

.version-row.is-installed .version-row__check {
  border-color: var(--dorian-viper-500, var(--app-accent));
  background: var(--dorian-viper-500, var(--app-accent));
  color: #08120e;
}

.version-row.is-disabled:not(.is-installed) {
  opacity: 0.58;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .version-row__package {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
