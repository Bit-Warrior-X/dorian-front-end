<template>
  <div class="compress-panel">
    <div class="waf-section-header">
      <div>
        <h4>Compress</h4>
        <p class="waf-section-desc">
          Gzip compress settings. Compress the resource based on its MIME Type using Gzip
          before responding to the user, saving client-side bandwidth.
        </p>
      </div>
      <div class="header-actions">
        <button
          class="primary-btn"
          type="button"
          :disabled="!serverId || saving || loading"
          @click="saveSettings"
        >
          {{ saving ? "Saving..." : "Save" }}
        </button>
      </div>
    </div>

    <div class="content-card">
      <h5 class="card-title">MIME Types</h5>
      <p class="helper-text">
        Select which response MIME type categories should be Gzip-compressed.
      </p>
      <div class="mime-checkbox-grid" :class="{ disabled: loading || !serverId }">
        <div
          v-for="option in mimeOptions"
          :key="option.key"
          class="checkbox-option"
        >
          <label class="checkbox-option-label" :for="`compress-${option.key}`">
            <input
              :id="`compress-${option.key}`"
              v-model="form[option.key]"
              type="checkbox"
              :disabled="loading || saving || !serverId"
            />
            <span>{{ option.label }}</span>
          </label>
          <div class="help-wrap">
            <button
              type="button"
              class="help-icon"
              :aria-label="`${option.label} MIME types`"
            >
              ?
            </button>
            <div class="help-tooltip" role="tooltip">
              <div class="help-tooltip-title">{{ option.label }}</div>
              <ul class="help-tooltip-list">
                <li v-for="mime in option.mimeTypes" :key="mime">{{ mime }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <p v-if="!serverId" class="helper-text load-hint">Select a server to configure compress settings.</p>
      <p v-else-if="loading" class="helper-text load-hint">Loading compress settings...</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from "vue";
import { fetchCompressSettings, updateCompressSettings } from "@/api/compress";
import { notifyError, notifySuccess } from "@/utils/notify";

const COMPRESS_TITLE = "Compress";

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null
  }
});

const mimeOptions = [
  {
    key: "css",
    label: "CSS",
    mimeTypes: ["text/css", "application/css"]
  },
  {
    key: "html",
    label: "HTML",
    mimeTypes: ["text/html", "application/xhtml+xml", "application/xml"]
  },
  {
    key: "js",
    label: "JS",
    mimeTypes: [
      "application/javascript",
      "application/ecmascript",
      "text/javascript"
    ]
  },
  {
    key: "audio",
    label: "AUDIO",
    mimeTypes: [
      "audio/wav",
      "audio/midi",
      "audio/vnd.wave",
      "audio/wave",
      "audio/3gpp"
    ]
  },
  {
    key: "font",
    label: "FONT",
    mimeTypes: [
      "application/x-font-ttf",
      "application/x-font-otf",
      "font/otf",
      "font/woff",
      "font/woff2"
    ]
  },
  {
    key: "applications",
    label: "APPLICATIONS",
    mimeTypes: [
      "application/pdf",
      "application/java-archive",
      "application/octet-stream",
      "application/x-msdownload",
      "application/vnd.debian.binary-package",
      "application/mac-binhex40",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/postscript",
      "application/rtf",
      "application/vnd.ms-fontobject",
      "application/x-rpm",
      "text/plain",
      "application/json",
      "application/json; charset=utf-8"
    ]
  }
];

const defaultForm = () => ({
  css: true,
  html: true,
  js: true,
  audio: false,
  font: false,
  applications: false
});

const form = reactive(defaultForm());
const loading = ref(false);
const saving = ref(false);

const applySettings = (data) => {
  const next = defaultForm();
  if (data && typeof data === "object") {
    for (const option of mimeOptions) {
      if (typeof data[option.key] === "boolean") {
        next[option.key] = data[option.key];
      }
    }
  }
  Object.assign(form, next);
};

const loadSettings = async () => {
  if (!props.serverId) {
    applySettings(defaultForm());
    return;
  }
  loading.value = true;
  try {
    const data = await fetchCompressSettings(props.serverId);
    applySettings(data);
  } catch {
    applySettings(defaultForm());
  } finally {
    loading.value = false;
  }
};

const saveSettings = async () => {
  if (!props.serverId || saving.value) {
    return;
  }
  saving.value = true;
  try {
    const payload = {
      css: Boolean(form.css),
      html: Boolean(form.html),
      js: Boolean(form.js),
      audio: Boolean(form.audio),
      font: Boolean(form.font),
      applications: Boolean(form.applications)
    };
    const data = await updateCompressSettings(props.serverId, payload);
    applySettings(data);
    notifySuccess(COMPRESS_TITLE, "Compress settings were saved successfully.");
  } catch (error) {
    notifyError(COMPRESS_TITLE, error?.message || "Compress settings could not be saved.");
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  void loadSettings();
});

watch(
  () => props.serverId,
  () => {
    void loadSettings();
  }
);
</script>

<style scoped>
.compress-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-card {
  background: var(--app-surface-muted);
  border-radius: 14px;
  padding: 18px;
  border: 1px solid var(--app-border-strong);
  overflow: visible;
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-heading);
}

.waf-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 0;
}

.waf-section-header h4 {
  margin: 0 0 6px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-heading);
}

.waf-section-desc {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 0.92rem;
  max-width: 720px;
  line-height: 1.45;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.helper-text {
  margin: 0 0 14px 0;
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

.load-hint {
  margin: 14px 0 0 0;
}

.mime-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px 18px;
  overflow: visible;
}

.mime-checkbox-grid.disabled {
  opacity: 0.7;
}

.checkbox-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.95rem;
  color: var(--app-text);
  min-height: auto;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  transition: border-color 0.2s ease, background 0.2s ease;
  overflow: visible;
}

.checkbox-option:hover {
  border-color: rgba(124, 58, 237, 0.35);
  background: var(--app-surface-hover);
}

.checkbox-option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  min-width: 0;
  flex: 1;
}

.checkbox-option input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--app-accent);
  cursor: pointer;
}

.checkbox-option input:disabled {
  cursor: not-allowed;
}

.checkbox-option:has(input:disabled) .checkbox-option-label {
  cursor: not-allowed;
}

.help-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid var(--app-border-strong);
  background: transparent;
  color: var(--app-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: help;
  padding: 0;
  line-height: 1;
}

.help-tooltip {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  z-index: 20;
  min-width: 220px;
  max-width: min(420px, 70vw);
  max-height: 280px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(4px);
  transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
}

.help-wrap:hover .help-tooltip,
.help-wrap:focus-within .help-tooltip {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
}

.help-tooltip-title {
  margin: 0 0 8px 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--app-heading);
  letter-spacing: 0.02em;
}

.help-tooltip-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.help-tooltip-list li {
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--app-text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  word-break: break-all;
}
</style>
