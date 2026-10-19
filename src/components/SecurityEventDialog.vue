<template>
  <Teleport to="body">
  <div v-if="event" class="event-drawer-backdrop" @click="emit('close')">
    <div
      class="event-drawer"
      role="dialog"
      aria-modal="true"
      :aria-label="event.title || 'Security event'"
      @click.stop
    >
      <div class="event-drawer__head">
        <div>
          <p class="event-detail-kicker">{{ tag }}</p>
          <h3>{{ event.title || 'Security event' }}</h3>
        </div>
        <button class="event-drawer__close" type="button" aria-label="Close" @click="emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div class="event-drawer__body">
        <p v-if="event.description" class="event-detail-summary">{{ event.description }}</p>
        <dl class="event-detail-facts">
          <div v-for="row in rows" :key="row.label" class="event-detail-fact">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
        <section v-if="blockedIps.length" class="event-detail-block">
          <h4>Blocked sources</h4>
          <ul class="event-ip-list">
            <li v-for="ip in blockedIps" :key="ip">{{ ip }}</li>
          </ul>
          <p v-if="moreIPs > 0" class="event-detail-more">and {{ moreIPs }} more</p>
        </section>
        <section v-if="timeline.length" class="event-detail-block">
          <h4>What happened</h4>
          <ul class="event-timeline">
            <li v-for="item in timeline" :key="item.id">
              <span>{{ formatWhen(item.createdAt) }}</span>
              <span>{{ item.description || item.title }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  event: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const commandLabel = {
  report_block_ip: 'Blocked IP',
  report_attack: 'Attack report',
  report_license: 'License report',
  report_protection: 'Protection mode',
}

const tag = computed(() => {
  const title = String(props.event?.title || '').toLowerCase()
  if (title.includes('l4') || title.includes('ddos')) return 'L4'
  if (title.includes('waf') || title.includes('l7')) return 'L7'
  return 'Security'
})

const described = computed(() => {
  const text = String(props.event?.description || '')
  const ip = String(props.event?.sourceIp || '').trim() || (text.match(/\bIP\s+([^\s,]+)/i)?.[1] || '')
  const ttl = String(props.event?.ttl || '').trim() || (text.match(/\bfor\s+(\d+)\s+seconds/i)?.[1] || '')
  const attack = String(props.event?.attackType || '').trim() || (text.match(/\bdue to\s+(.+?)\s+attack/i)?.[1] || '')
  return { ip, ttl, attack }
})

const formatWhen = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const blockedIps = computed(() => (Array.isArray(props.event?.blockedIps) ? props.event.blockedIps : []))

const moreIPs = computed(() => Math.max(0, Number(props.event?.ipCount || 0) - blockedIps.value.length))

const timeline = computed(() => {
  const items = Array.isArray(props.event?.events) ? props.event.events : []
  if (!props.event?.reqId) return []
  return items.filter((item) => item?.command !== 'report_block_ip')
})

const statusLabel = (value) => {
  if (value === 'ongoing') return 'Ongoing'
  if (value === 'ended') return 'Ended'
  if (value === 'reported') return 'Reported'
  return ''
}

const rows = computed(() => {
  const event = props.event || {}
  const facts = described.value
  const items = []
  const started = formatWhen(event.startedAt || event.createdAt)
  const ended = formatWhen(event.endedAt)
  if (started) items.push({ label: event.reqId ? 'Started' : 'Happened', value: started })
  if (event.reqId && ended && ended !== started) items.push({ label: event.status === 'ongoing' ? 'Last report' : 'Ended', value: ended })
  if (event.serverName) items.push({ label: 'Edge', value: event.serverName })
  const status = statusLabel(event.status)
  if (status && event.reqId) items.push({ label: 'Status', value: status })
  if (Number(event.ipCount) > 0) items.push({ label: 'Blocked sources', value: String(event.ipCount) })
  else if (facts.ip) items.push({ label: 'Source IP', value: facts.ip })
  if (facts.attack && !String(event.title || '').toLowerCase().includes(String(facts.attack).toLowerCase())) {
    items.push({ label: 'Attack', value: facts.attack })
  }
  if (facts.ttl && !event.reqId) {
    items.push({ label: 'Blocked for', value: /^\d+$/.test(facts.ttl) ? `${facts.ttl} seconds` : facts.ttl })
  }
  if (event.reqId) items.push({ label: 'Attack ID', value: event.reqId })
  const command = String(event.command || '').trim()
  if (command && !event.reqId) items.push({ label: 'Report', value: commandLabel[command] || command })
  const data = String(event.data || '').trim()
  if (data && !event.reqId && data !== String(event.description || '').trim()) {
    items.push({ label: 'Signal', value: data })
  }
  return items
})

const onKeydown = (event) => {
  if (event.key === 'Escape' && props.event) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.event-drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  background: var(--app-overlay, rgba(0, 0, 0, 0.55));
}

.event-drawer {
  width: min(420px, 100vw);
  height: 100%;
  overflow: auto;
  padding: 22px 22px 28px;
  background: var(--app-surface-solid, #121816);
  border-left: 1px solid var(--app-border);
  box-shadow: -24px 0 48px var(--app-shadow, rgba(0, 0, 0, 0.35));
}

.event-drawer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.event-drawer__head h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
  color: var(--app-heading);
}

.event-drawer__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: none;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
}

.event-drawer__close:hover {
  background: color-mix(in srgb, #ffffff 10%, transparent);
  color: var(--app-heading);
}

.event-drawer__close svg {
  width: 16px;
  height: 16px;
}

.event-drawer__body {
  display: flex;
  flex-direction: column;
}

.event-detail-kicker {
  margin: 0 0 4px;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dorian-viper-400, var(--app-accent));
}

.event-detail-summary {
  margin: 0 0 14px;
  color: var(--app-text);
  line-height: 1.45;
}

.event-detail-facts {
  display: grid;
  gap: 8px;
  margin: 0;
}

.event-detail-fact {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 12px;
  align-items: baseline;
}

.event-detail-fact dt {
  margin: 0;
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.event-detail-fact dd {
  margin: 0;
  color: var(--app-heading);
  word-break: break-word;
}

.event-detail-block {
  margin-top: 18px;
}

.event-detail-block h4 {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-text-muted);
}

.event-ip-list,
.event-timeline {
  margin: 0;
  padding: 0;
  list-style: none;
}

.event-ip-list li,
.event-timeline li {
  padding: 6px 0;
  border-top: 1px solid var(--app-border);
  color: var(--app-heading);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 12px;
}

.event-timeline li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: inherit;
}

.event-timeline li span:first-child {
  color: var(--app-text-muted);
  font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 11px;
}

.event-detail-more {
  margin: 8px 0 0;
  color: var(--app-text-muted);
  font-size: 12px;
}
</style>
