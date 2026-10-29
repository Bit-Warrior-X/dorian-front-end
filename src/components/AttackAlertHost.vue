<template>
  <Teleport to="body">
    <div v-if="prompt" class="attack-alert-backdrop">
      <section class="attack-alert" role="alertdialog" aria-modal="true" aria-labelledby="attack-alert-title">
        <p class="attack-alert__kicker">{{ layerLabel }} attack</p>
        <h2 id="attack-alert-title">{{ headline }}</h2>
        <p class="attack-alert__body">{{ detail }}</p>
        <div class="attack-alert__actions">
          <button class="attack-alert__primary" type="button" @click="openAttackConsole(prompt.reqId)">See the attack</button>
          <button class="attack-alert__secondary" type="button" @click="dismissAttack(prompt.reqId)">Dismiss</button>
        </div>
      </section>
    </div>
    <AttackConsole v-if="consoleReqId" :req-id="consoleReqId" @close="closeAttackConsole" />
  </Teleport>
</template>

<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted } from 'vue'
import { fetchSecurityEvents } from '@/api/dashboard'
import {
  attackAlertState,
  closeAttackConsole,
  dismissAttack,
  isAttackDismissed,
  offerAttack,
  openAttackConsole,
} from '@/stores/attackAlert'
import { loadAlarms, upsertAlarm } from '@/stores/alarms'

// Keep ApexCharts off the shell critical path until the console is opened.
const AttackConsole = defineAsyncComponent(() => import('@/components/AttackConsole.vue'))

const prompt = computed(() => attackAlertState.prompt)
const consoleReqId = computed(() => attackAlertState.consoleReqId)
const layerLabel = computed(() => (String(prompt.value?.layer || '').toUpperCase() === 'L7' ? 'L7' : 'L4'))

const headline = computed(() => {
  const edge = prompt.value?.serverName || 'this edge'
  const layer = layerLabel.value
  if (prompt.value?.status === 'ended') return `The ${layer} attack on ${edge} has stopped`
  return `An ${layer} attack has started on ${edge}`
})

const detail = computed(() => {
  const isL7 = layerLabel.value === 'L7'
  const title = prompt.value?.title || (isL7 ? 'L7 attack' : 'L4 DDOS')
  const count = Number(prompt.value?.ipCount || 0)
  const sources = isL7
    ? (count > 0 ? `${count} unique IP${count === 1 ? '' : 's'}` : 'unique IPs observed')
    : (count > 0 ? `${count} source${count === 1 ? '' : 's'} blocked` : 'sources are being blocked')
  const hint = isL7
    ? 'Open the attack view for blocked vs passed requests, vectors, and top clients.'
    : 'Open the attack view for NIC traffic, the Sparta log, and the addresses currently blocked.'
  return `${title}. ${sources}. ${hint}`
})

const seen = new Set()
const knownStatus = new Map()
let primed = false

const periodKey = (period) => String(period?.reqId || period?.id || '').trim()

const isAttackPeriod = (period) => {
  if (!periodKey(period)) return false
  const layer = String(period?.layer || '').toUpperCase()
  if (layer && layer !== 'L4' && layer !== 'L7') return false
  return Boolean(period.reqId)
}

const sourceLabel = (period) => {
  const count = Number(period?.activeIpCount ?? period?.ipCount ?? 0)
  if (String(period?.layer || '').toUpperCase() === 'L7') {
    if (count > 0) return `${count} unique IP${count === 1 ? '' : 's'}`
    return 'unique IPs observed'
  }
  if (count > 0) return `${count} source${count === 1 ? '' : 's'} blocked`
  return 'sources are being blocked'
}

const queueAttackAlarm = (period, { read = false } = {}) => {
  const reqId = String(period?.reqId || '').trim()
  if (!reqId) return Promise.resolve(null)
  const ongoing = period.status === 'ongoing'
  const edge = period.serverName || 'edge'
  const layer = String(period?.layer || '').toUpperCase() === 'L7' ? 'L7' : 'L4'
  return upsertAlarm({
    id: `attack:${reqId}`,
    kind: 'attack',
    severity: ongoing ? 'critical' : 'warning',
    title: ongoing ? `${layer} attack on ${edge}` : `${layer} attack ended on ${edge}`,
    body: `${period.title || `${layer} attack`}. ${sourceLabel(period)}.`,
    status: ongoing ? 'ongoing' : 'ended',
    at: period.endedAt || period.createdAt || period.startedAt || new Date().toISOString(),
    reqId,
    serverId: period.serverId ?? null,
    serverName: period.serverName || '',
    layer,
    read,
  })
}

const poll = async () => {
  if (document.visibilityState === 'hidden') return
  try {
    const periods = await fetchSecurityEvents(30)
    const attacks = (Array.isArray(periods) ? periods : []).filter(isAttackPeriod)
    if (!primed) {
      primed = true
      await Promise.all(
        attacks.map((period) => {
          const key = periodKey(period)
          seen.add(key)
          knownStatus.set(key, period.status)
          return queueAttackAlarm(period, { read: period.status !== 'ongoing' })
        }),
      )
      const live = attacks
        .filter((period) => period.status === 'ongoing' && !isAttackDismissed(period.reqId))
        .sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0))
      if (live[0]) offerAttack(live[0])
      return
    }

    const fresh = []
    const writes = []
    attacks.forEach((period) => {
      const key = periodKey(period)
      const prev = knownStatus.get(key)
      const isNew = !seen.has(key)
      seen.add(key)
      knownStatus.set(key, period.status)

      if (isNew) {
        writes.push(queueAttackAlarm(period, { read: false }))
        fresh.push(period)
        return
      }
      if (prev !== period.status) {
        writes.push(queueAttackAlarm(period, { read: false }))
        return
      }
      if (period.status === 'ongoing') {
        writes.push(queueAttackAlarm(period, { read: true }))
      }
    })
    await Promise.all(writes)

    const alertable = fresh.filter((period) => {
      if (isAttackDismissed(period.reqId)) return false
      const started = (period.events || []).some((event) => event.data === 'attack_start')
      return period.status === 'ongoing' || started
    })
    alertable.sort((a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0))
    if (alertable[0]) offerAttack(alertable[0])
  } catch {
    // The next poll retries. A failed check should not open or close a dialog.
  }
}

const onKey = (event) => {
  if (event.key !== 'Escape') return
  if (attackAlertState.prompt?.reqId) {
    dismissAttack(attackAlertState.prompt.reqId)
    return
  }
  if (attackAlertState.consoleReqId) closeAttackConsole()
}

let timer = 0
onMounted(() => {
  void loadAlarms().finally(() => {
    void poll()
  })
  timer = window.setInterval(poll, 8000)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.attack-alert-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(8, 12, 10, 0.62);
}

.attack-alert {
  width: min(460px, 100%);
  padding: 22px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface-solid, var(--app-surface));
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
}

.attack-alert__kicker {
  margin: 0 0 8px;
  color: #e07a5f;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.attack-alert h2 {
  margin: 0 0 8px;
  color: var(--app-heading);
  font-size: 20px;
  line-height: 1.3;
}

.attack-alert__body {
  margin: 0 0 18px;
  color: var(--app-text);
  line-height: 1.5;
}

.attack-alert__actions {
  display: flex;
  gap: 8px;
}

.attack-alert__primary,
.attack-alert__secondary {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
}

.attack-alert__primary {
  border: 0;
  background: var(--dorian-viper-400, #3fbd85);
  color: #0d1612;
}

.attack-alert__secondary {
  border: 1px solid var(--app-border);
  background: transparent;
  color: var(--app-heading);
}
</style>
