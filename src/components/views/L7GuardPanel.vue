<template>
  <div class="l7g-panel edge-subpanel">
    <header class="cfg-head">
      <div class="cfg-head__copy">
        <span class="cfg-head__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l7.5 3v5.5c0 4.4-3.2 8.3-7.5 9.5-4.3-1.2-7.5-5.1-7.5-9.5V6L12 3z" />
            <path d="M9.5 12.2l1.8 1.8 3.4-3.6" />
          </svg>
        </span>
        <div>
          <p class="cfg-head__kicker">L7 defense</p>
          <h4 class="info-hint-heading">
            <span>L7 Guard</span>
            <InfoHint
              text="Per-IP abuse detector in OpenResty (resty.l7_guard). Counts Rapid Reset streams, 444 rejects, malformed requests, and total requests over a short window, then blocks offenders in nginx and optionally escalates them to the XDP blocklist."
              aria-label="L7 Guard help"
            />
          </h4>
          <p class="cfg-head__desc">
            Tune thresholds and block TTL for this edge. Changes apply within about 10 seconds — no nginx reload.
          </p>
        </div>
      </div>
    </header>

    <div v-if="loading" class="l7g-empty">Loading L7 Guard settings…</div>
    <div v-else-if="loadError" class="l7g-empty l7g-empty--error">{{ loadError }}</div>
    <template v-else>
      <div class="l7g-body">
        <section class="l7g-section">
          <div class="l7g-section__title">
            <h5>Detector</h5>
          </div>
          <div class="l7g-toggles">
            <div class="l7g-inline">
              <h5 class="info-hint-heading">
                <span>Enabled</span>
                <InfoHint text="Turn the per-IP L7 abuse detector on or off for this edge." aria-label="Enabled help" />
              </h5>
              <div class="l7g-yn" role="group" aria-label="Enabled">
                <button type="button" class="l7g-yn__opt" :class="{ active: form.enabled }" :aria-pressed="form.enabled" @click="form.enabled = true">Yes</button>
                <button type="button" class="l7g-yn__opt l7g-yn__opt--no" :class="{ active: !form.enabled }" :aria-pressed="!form.enabled" @click="form.enabled = false">No</button>
              </div>
            </div>
            <div class="l7g-inline">
              <h5 class="info-hint-heading">
                <span>Block at NIC (XDP)</span>
                <InfoHint
                  text="When yes, blocked IPs are added to the XDP blocklist for block_ttl (escalating up to block_max_ttl). When no, nginx drops them only."
                  aria-label="XDP escalation help"
                />
              </h5>
              <div class="l7g-yn" role="group" aria-label="XDP escalation">
                <button type="button" class="l7g-yn__opt" :class="{ active: form.xdp }" :aria-pressed="form.xdp" :disabled="!form.enabled" @click="form.xdp = true">Yes</button>
                <button type="button" class="l7g-yn__opt l7g-yn__opt--no" :class="{ active: !form.xdp }" :aria-pressed="!form.xdp" :disabled="!form.enabled" @click="form.xdp = false">No</button>
              </div>
            </div>
            <div class="l7g-inline l7g-inline--field">
              <label for="l7g-window" class="info-hint-heading">
                Window (s)
                <InfoHint text="Counting window in seconds (1–300). All thresholds are measured inside this window." aria-label="Window help" />
              </label>
              <input id="l7g-window" v-model.number="form.window" type="number" min="1" max="300" class="l7g-input" :disabled="!form.enabled" />
            </div>
          </div>
        </section>

        <section class="l7g-section">
          <div class="l7g-section__title">
            <h5>Thresholds (per IP / window)</h5>
          </div>
          <div class="l7g-grid">
            <div class="l7g-field">
              <label for="l7g-rst" class="info-hint-heading">
                Rapid Reset
                <InfoHint text="HTTP/2 streams reset by the client before a response (logged as 499 with ~0 request time)." aria-label="Rapid Reset help" />
              </label>
              <input id="l7g-rst" v-model.number="form.rst_threshold" type="number" min="1" max="1000000" class="l7g-input" :disabled="!form.enabled" />
            </div>
            <div class="l7g-field">
              <label for="l7g-rej" class="info-hint-heading">
                Rejected (444)
                <InfoHint text="Requests already rejected with 444 (rate / concurrency limit or an existing temporary block)." aria-label="Rejected help" />
              </label>
              <input id="l7g-rej" v-model.number="form.rej_threshold" type="number" min="1" max="1000000" class="l7g-input" :disabled="!form.enabled" />
            </div>
            <div class="l7g-field">
              <label for="l7g-bad" class="info-hint-heading">
                Malformed
                <InfoHint text="Malformed / empty connections (400/408 with no request line)." aria-label="Malformed help" />
              </label>
              <input id="l7g-bad" v-model.number="form.bad_threshold" type="number" min="1" max="1000000" class="l7g-input" :disabled="!form.enabled" />
            </div>
            <div class="l7g-field">
              <label for="l7g-req" class="info-hint-heading">
                Total requests
                <InfoHint text="All requests in the window. Halved when most requests from the IP are HTTP/2 without Accept / Accept-Language." aria-label="Total requests help" />
              </label>
              <input id="l7g-req" v-model.number="form.req_threshold" type="number" min="1" max="1000000" class="l7g-input" :disabled="!form.enabled" />
            </div>
          </div>
        </section>

        <section class="l7g-section">
          <div class="l7g-section__title">
            <h5>Attack detection</h5>
          </div>
          <div class="l7g-toggles l7g-toggles--attack">
            <div class="l7g-inline">
              <h5 class="info-hint-heading">
                <span>Detect incidents</span>
                <InfoHint text="Report L7 attack start / update / stop to the panel (report_l7_attack), like L4 attack alerts." aria-label="Attack detect help" />
              </h5>
              <div class="l7g-yn" role="group" aria-label="Attack detect">
                <button type="button" class="l7g-yn__opt" :class="{ active: form.attack_detect }" :aria-pressed="form.attack_detect" :disabled="!form.enabled" @click="form.attack_detect = true">Yes</button>
                <button type="button" class="l7g-yn__opt l7g-yn__opt--no" :class="{ active: !form.attack_detect }" :aria-pressed="!form.attack_detect" :disabled="!form.enabled" @click="form.attack_detect = false">No</button>
              </div>
            </div>
          </div>
          <div class="l7g-grid">
            <div class="l7g-field">
              <label for="l7g-floor-flood" class="info-hint-heading">
                Flood floor (rps)
                <InfoHint text="Minimum requests/s for the flood vector (raised automatically by the learned baseline)." aria-label="Flood floor help" />
              </label>
              <input id="l7g-floor-flood" v-model.number="form.attack_floor_flood" type="number" min="10" class="l7g-input" :disabled="!form.enabled || !form.attack_detect" />
            </div>
            <div class="l7g-field">
              <label for="l7g-floor-reset" class="info-hint-heading">
                Rapid Reset floor
                <InfoHint text="Minimum client-reset HTTP/2 streams/s for rapid_reset." aria-label="Rapid Reset floor help" />
              </label>
              <input id="l7g-floor-reset" v-model.number="form.attack_floor_reset" type="number" min="10" class="l7g-input" :disabled="!form.enabled || !form.attack_detect" />
            </div>
            <div class="l7g-field">
              <label for="l7g-floor-malformed" class="info-hint-heading">
                Malformed floor
                <InfoHint text="Minimum malformed requests/s for malformed." aria-label="Malformed floor help" />
              </label>
              <input id="l7g-floor-malformed" v-model.number="form.attack_floor_malformed" type="number" min="10" class="l7g-input" :disabled="!form.enabled || !form.attack_detect" />
            </div>
            <div class="l7g-field">
              <label for="l7g-floor-blocked" class="info-hint-heading">
                Blocked floor
                <InfoHint text="Minimum 444 responses/s for blocked." aria-label="Blocked floor help" />
              </label>
              <input id="l7g-floor-blocked" v-model.number="form.attack_floor_blocked" type="number" min="10" class="l7g-input" :disabled="!form.enabled || !form.attack_detect" />
            </div>
            <div class="l7g-field">
              <label for="l7g-confirm" class="info-hint-heading">
                Confirm (s)
                <InfoHint text="Consecutive seconds above threshold before a vector is under attack (1–60)." aria-label="Confirm seconds help" />
              </label>
              <input id="l7g-confirm" v-model.number="form.attack_confirm_seconds" type="number" min="1" max="60" class="l7g-input" :disabled="!form.enabled || !form.attack_detect" />
            </div>
            <div class="l7g-field">
              <label for="l7g-exit" class="info-hint-heading">
                Exit (s)
                <InfoHint text="Consecutive seconds below exit threshold before a vector is normal again (5–3600)." aria-label="Exit seconds help" />
              </label>
              <input id="l7g-exit" v-model.number="form.attack_exit_seconds" type="number" min="5" max="3600" class="l7g-input" :disabled="!form.enabled || !form.attack_detect" />
            </div>
            <div class="l7g-field">
              <label for="l7g-cooldown" class="info-hint-heading">
                Cooldown (s)
                <InfoHint text="All vectors normal this long closes the incident (0–3600). Re-entry within it continues the same incident." aria-label="Cooldown seconds help" />
              </label>
              <input id="l7g-cooldown" v-model.number="form.attack_cooldown_seconds" type="number" min="0" max="3600" class="l7g-input" :disabled="!form.enabled || !form.attack_detect" />
            </div>
          </div>
        </section>

        <div class="l7g-row">
          <section class="l7g-section">
            <div class="l7g-section__title">
              <h5>Block duration</h5>
            </div>
            <div class="l7g-grid">
              <div class="l7g-field">
                <label for="l7g-ttl" class="info-hint-heading">
                  Block TTL (s)
                  <InfoHint text="First block duration in seconds (10–86,400). Repeat offenses double (within 24h) up to Block Max TTL." aria-label="Block TTL help" />
                </label>
                <input id="l7g-ttl" v-model.number="form.block_ttl" type="number" min="10" max="86400" class="l7g-input" :disabled="!form.enabled" />
              </div>
              <div class="l7g-field">
                <label for="l7g-max-ttl" class="info-hint-heading">
                  Block Max TTL (s)
                  <InfoHint text="Maximum block duration for repeat offenders (10–604,800). Must be ≥ Block TTL." aria-label="Block Max TTL help" />
                </label>
                <input id="l7g-max-ttl" v-model.number="form.block_max_ttl" type="number" min="10" max="604800" class="l7g-input" :disabled="!form.enabled" />
              </div>
            </div>
          </section>

          <section class="l7g-section">
            <div class="l7g-section__title">
              <h5>Allow IPs</h5>
              <span class="l7g-count">{{ allowIpCount }} / 1000</span>
            </div>
            <p class="l7g-section__desc">
              Client IPv4 addresses never blocked by L7 Guard. One address per line — no CIDR ranges.
            </p>
            <textarea
              id="l7g-allow-ips"
              v-model="allowIpsText"
              class="l7g-textarea"
              rows="5"
              placeholder="198.51.100.20"
              :disabled="!form.enabled"
              spellcheck="false"
            />
          </section>
        </div>
      </div>

      <footer class="l7g-applybar">
        <span class="l7g-applybar__copy">
          <i aria-hidden="true" />
          Settings are pushed to Athens on this edge when applied.
        </span>
        <div class="l7g-applybar__actions">
          <button type="button" class="ghost-btn" :disabled="saving" @click="openResetConfirm">Restore defaults</button>
          <button type="button" class="primary-btn confirm-btn" :disabled="saving" @click="openApplyConfirm">
            {{ saving ? 'Applying…' : 'Apply settings' }}
          </button>
        </div>
      </footer>
    </template>

    <ConfirmDialog
      v-model="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmText"
      cancel-text="Cancel"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { fetchL7Guard, updateL7Guard, resetL7Guard } from '@/api/l7Guard'
import ConfirmDialog from '../ConfirmDialog.vue'
import InfoHint from '../InfoHint.vue'
import { notifyError, notifySuccess } from '@/utils/notify'

const TITLE = 'L7 Guard'

const DEFAULTS = {
  enabled: true,
  xdp: true,
  window: 10,
  rst_threshold: 100,
  rej_threshold: 200,
  bad_threshold: 100,
  req_threshold: 1000,
  block_ttl: 600,
  block_max_ttl: 3600,
  allow_ips: [],
  attack_detect: true,
  attack_floor_flood: 500,
  attack_floor_reset: 100,
  attack_floor_malformed: 200,
  attack_floor_blocked: 200,
  attack_confirm_seconds: 3,
  attack_exit_seconds: 30,
  attack_cooldown_seconds: 60,
}

const props = defineProps({
  serverId: {
    type: [Number, String],
    default: null,
  },
})

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const form = reactive({ ...DEFAULTS })
const allowIpsText = ref('')

const confirmOpen = ref(false)
const confirmMode = ref('apply')
const confirmTitle = computed(() => (confirmMode.value === 'reset' ? 'Restore L7 Guard defaults' : 'Apply L7 Guard settings'))
const confirmMessage = computed(() =>
  confirmMode.value === 'reset'
    ? 'Restore all L7 Guard settings on this edge to built-in defaults?'
    : 'Apply L7 Guard settings to this edge?',
)
const confirmText = computed(() => (confirmMode.value === 'reset' ? 'Restore' : 'Apply'))

const allowIpCount = computed(() =>
  allowIpsText.value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean).length,
)

const applyState = (state) => {
  const src = state?.l7guard || state?.L7Guard || DEFAULTS
  form.enabled = src.enabled !== false
  form.xdp = src.xdp !== false
  form.window = Number(src.window) || DEFAULTS.window
  form.rst_threshold = Number(src.rst_threshold ?? src.rstThreshold) || DEFAULTS.rst_threshold
  form.rej_threshold = Number(src.rej_threshold ?? src.rejThreshold) || DEFAULTS.rej_threshold
  form.bad_threshold = Number(src.bad_threshold ?? src.badThreshold) || DEFAULTS.bad_threshold
  form.req_threshold = Number(src.req_threshold ?? src.reqThreshold) || DEFAULTS.req_threshold
  form.block_ttl = Number(src.block_ttl ?? src.blockTtl) || DEFAULTS.block_ttl
  form.block_max_ttl = Number(src.block_max_ttl ?? src.blockMaxTtl) || DEFAULTS.block_max_ttl
  form.attack_detect = src.attack_detect !== false && src.attackDetect !== false
  form.attack_floor_flood = Number(src.attack_floor_flood ?? src.attackFloorFlood) || DEFAULTS.attack_floor_flood
  form.attack_floor_reset = Number(src.attack_floor_reset ?? src.attackFloorReset) || DEFAULTS.attack_floor_reset
  form.attack_floor_malformed = Number(src.attack_floor_malformed ?? src.attackFloorMalformed) || DEFAULTS.attack_floor_malformed
  form.attack_floor_blocked = Number(src.attack_floor_blocked ?? src.attackFloorBlocked) || DEFAULTS.attack_floor_blocked
  form.attack_confirm_seconds = Number(src.attack_confirm_seconds ?? src.attackConfirmSeconds) || DEFAULTS.attack_confirm_seconds
  form.attack_exit_seconds = Number(src.attack_exit_seconds ?? src.attackExitSeconds) || DEFAULTS.attack_exit_seconds
  form.attack_cooldown_seconds = Number(src.attack_cooldown_seconds ?? src.attackCooldownSeconds)
  if (!Number.isFinite(form.attack_cooldown_seconds)) form.attack_cooldown_seconds = DEFAULTS.attack_cooldown_seconds
  const ips = Array.isArray(src.allow_ips) ? src.allow_ips : Array.isArray(src.allowIps) ? src.allowIps : []
  form.allow_ips = ips.map(String)
  allowIpsText.value = form.allow_ips.join('\n')
}

const load = async () => {
  if (props.serverId == null || props.serverId === '') {
    loading.value = false
    loadError.value = 'No edge selected'
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchL7Guard(props.serverId)
    applyState(data)
  } catch (err) {
    loadError.value = err?.message || 'Failed to load L7 Guard settings'
  } finally {
    loading.value = false
  }
}

const parseAllowIps = () =>
  allowIpsText.value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)

const validate = () => {
  const window = Number(form.window)
  if (!Number.isFinite(window) || window < 1 || window > 300) return 'Window must be between 1 and 300 seconds'
  const thresholds = [
    ['Rapid Reset', form.rst_threshold],
    ['Rejected (444)', form.rej_threshold],
    ['Malformed', form.bad_threshold],
    ['Total requests', form.req_threshold],
  ]
  for (const [label, raw] of thresholds) {
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 1 || n > 1_000_000) return `${label} must be between 1 and 1,000,000`
  }
  const ttl = Number(form.block_ttl)
  const maxTtl = Number(form.block_max_ttl)
  if (!Number.isFinite(ttl) || ttl < 10 || ttl > 86400) return 'Block TTL must be between 10 and 86,400 seconds'
  if (!Number.isFinite(maxTtl) || maxTtl < 10 || maxTtl > 604800) return 'Block Max TTL must be between 10 and 604,800 seconds'
  if (maxTtl < ttl) return 'Block Max TTL must be greater than or equal to Block TTL'
  const floors = [
    ['Flood floor', form.attack_floor_flood],
    ['Rapid Reset floor', form.attack_floor_reset],
    ['Malformed floor', form.attack_floor_malformed],
    ['Blocked floor', form.attack_floor_blocked],
  ]
  for (const [label, raw] of floors) {
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 10) return `${label} must be at least 10`
  }
  const confirm = Number(form.attack_confirm_seconds)
  if (!Number.isFinite(confirm) || confirm < 1 || confirm > 60) return 'Confirm seconds must be between 1 and 60'
  const exit = Number(form.attack_exit_seconds)
  if (!Number.isFinite(exit) || exit < 5 || exit > 3600) return 'Exit seconds must be between 5 and 3600'
  const cooldown = Number(form.attack_cooldown_seconds)
  if (!Number.isFinite(cooldown) || cooldown < 0 || cooldown > 3600) return 'Cooldown seconds must be between 0 and 3600'
  const ips = parseAllowIps()
  if (ips.length > 1000) return 'Allow IPs supports at most 1,000 addresses'
  for (const ip of ips) {
    if (ip.includes('/')) return `Allow IPs must be single IPv4 addresses (no CIDR): ${ip}`
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return `Invalid IPv4 address: ${ip}`
  }
  return ''
}

const buildPayload = () => ({
  l7guard: {
    enabled: !!form.enabled,
    xdp: !!form.xdp,
    window: Number(form.window),
    rst_threshold: Number(form.rst_threshold),
    rej_threshold: Number(form.rej_threshold),
    bad_threshold: Number(form.bad_threshold),
    req_threshold: Number(form.req_threshold),
    block_ttl: Number(form.block_ttl),
    block_max_ttl: Number(form.block_max_ttl),
    allow_ips: parseAllowIps(),
    attack_detect: !!form.attack_detect,
    attack_floor_flood: Number(form.attack_floor_flood),
    attack_floor_reset: Number(form.attack_floor_reset),
    attack_floor_malformed: Number(form.attack_floor_malformed),
    attack_floor_blocked: Number(form.attack_floor_blocked),
    attack_confirm_seconds: Number(form.attack_confirm_seconds),
    attack_exit_seconds: Number(form.attack_exit_seconds),
    attack_cooldown_seconds: Number(form.attack_cooldown_seconds),
  },
})

const openApplyConfirm = () => {
  const err = validate()
  if (err) {
    notifyError(TITLE, err)
    return
  }
  confirmMode.value = 'apply'
  confirmOpen.value = true
}

const openResetConfirm = () => {
  confirmMode.value = 'reset'
  confirmOpen.value = true
}

const save = async () => {
  saving.value = true
  try {
    const data = await updateL7Guard(props.serverId, buildPayload())
    applyState(data)
    notifySuccess(TITLE, 'L7 Guard settings updated.')
  } catch (err) {
    notifyError(TITLE, err?.message || 'Failed to update L7 Guard settings')
  } finally {
    saving.value = false
  }
}

const restoreDefaults = async () => {
  saving.value = true
  try {
    const data = await resetL7Guard(props.serverId)
    applyState(data)
    notifySuccess(TITLE, 'L7 Guard restored to defaults.')
  } catch (err) {
    notifyError(TITLE, err?.message || 'Failed to restore L7 Guard defaults')
  } finally {
    saving.value = false
  }
}

const handleConfirm = async () => {
  if (confirmMode.value === 'reset') await restoreDefaults()
  else await save()
}

watch(
  () => props.serverId,
  () => {
    void load()
  },
)

onMounted(() => {
  void load()
})
</script>

<style scoped>
.l7g-panel.edge-subpanel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cfg-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.cfg-head__copy {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.cfg-head__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  flex-shrink: 0;
}

.cfg-head__icon svg {
  width: 18px;
  height: 18px;
}

.cfg-head__kicker {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.cfg-head h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--app-heading);
}

.cfg-head__desc {
  margin: 3px 0 0;
  max-width: 44rem;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--app-text-muted);
}

.l7g-empty {
  padding: 28px 16px;
  text-align: center;
  color: var(--app-text-muted);
  font-size: 13px;
}

.l7g-empty--error {
  color: #e15241;
}

.l7g-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.l7g-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  gap: 12px;
  align-items: stretch;
}

.l7g-section {
  width: 100%;
  min-width: 0;
  padding: 14px 16px 16px;
  border: 0.5px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-muted, var(--app-surface-elevated));
  transition: border-color 0.15s ease;
}

.l7g-section:hover {
  border-color: var(--app-border-strong);
}

.l7g-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -2px 0 14px;
  padding-bottom: 10px;
  border-bottom: 0.5px solid var(--app-border);
}

.l7g-section__title h5 {
  margin: 0;
  font-size: 13px;
  font-weight: 650;
  color: var(--app-heading);
}

.l7g-section__desc {
  margin: -4px 0 10px;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--app-text-muted);
}

.l7g-count {
  font-size: 11.5px;
  font-weight: 650;
  color: var(--app-text-muted);
  font-variant-numeric: tabular-nums;
}

.l7g-toggles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 12px;
  width: 100%;
}

.l7g-toggles--attack {
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 14px;
  max-width: 420px;
}

.l7g-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 9px;
  border: 0.5px solid var(--app-border);
  background: var(--app-surface);
}

.l7g-inline--field {
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 6px;
}

.l7g-inline h5,
.l7g-inline--field label {
  margin: 0;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--app-heading);
  text-transform: none;
  letter-spacing: 0;
}

.l7g-inline--field label {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.l7g-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px 14px;
  align-items: end;
  width: 100%;
}

.l7g-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  max-width: none;
}

.l7g-field label {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 600;
  color: var(--app-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.l7g-input,
.l7g-textarea {
  border: 1px solid var(--app-input-border, var(--app-border-strong));
  border-radius: 7px;
  padding: 8px 10px;
  font-size: 12.5px;
  color: var(--app-text, var(--app-heading));
  background: var(--app-input-bg, var(--app-surface-solid));
  outline: none;
  width: 100%;
  max-width: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-variant-numeric: tabular-nums;
}

.l7g-textarea {
  min-height: 118px;
  resize: vertical;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  line-height: 1.45;
}

.l7g-input:focus,
.l7g-textarea:focus {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft);
}

.l7g-input:disabled,
.l7g-textarea:disabled {
  opacity: 0.55;
  background: var(--app-input-bg, var(--app-surface-hover));
  color: var(--app-text-muted);
  cursor: not-allowed;
}

.l7g-yn {
  display: inline-flex;
  align-items: stretch;
  flex: 0 0 auto;
  width: fit-content;
  max-width: fit-content;
  padding: 2px;
  border-radius: 999px;
  border: 0.5px solid var(--app-border-strong);
  background: var(--app-surface);
  gap: 2px;
}

.l7g-yn__opt {
  box-sizing: border-box;
  flex: 0 0 auto;
  width: auto;
  min-width: 38px;
  height: auto !important;
  min-height: 0 !important;
  padding: 5px 10px !important;
  border: none !important;
  border-radius: 999px !important;
  background: transparent;
  color: var(--app-text-muted);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10.5px !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em;
  line-height: 1 !important;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.l7g-yn__opt:hover:not(.active):not(:disabled) {
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-accent) 8%, transparent);
}

.l7g-yn__opt.active {
  background: rgba(46, 158, 108, 0.16);
  color: var(--dorian-viper-400, #3fbd85);
  box-shadow: inset 0 0 0 1px rgba(46, 158, 108, 0.35);
}

.l7g-yn__opt--no.active {
  background: rgba(225, 82, 65, 0.14);
  color: #e15241;
  box-shadow: inset 0 0 0 1px rgba(225, 82, 65, 0.34);
}

.l7g-yn__opt:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.l7g-yn__opt:focus-visible {
  outline: 2px solid var(--app-accent);
  outline-offset: 1px;
}

.l7g-applybar {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 2px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 0.5px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 92%, transparent);
  backdrop-filter: blur(6px);
}

.l7g-applybar__copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--app-text-muted);
}

.l7g-applybar__copy i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--app-accent);
  display: inline-block;
}

.l7g-applybar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ghost-btn {
  border: 1px solid var(--app-border-strong);
  background: var(--app-surface-solid);
  color: var(--app-text-secondary);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12.5px;
  font-weight: 650;
  cursor: pointer;
}

.ghost-btn:disabled,
.confirm-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .l7g-row {
    grid-template-columns: 1fr;
  }

  .l7g-toggles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .l7g-inline--field {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .l7g-toggles {
    grid-template-columns: 1fr;
  }
}
</style>
