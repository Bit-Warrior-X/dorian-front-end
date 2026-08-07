<template>
  <div class="login-page">
    <div class="login-page__grid" aria-hidden="true" />
    <main class="login-panel">
      <div class="login-panel__inner">
        <div class="login-panel__brand-mobile">
          <DorianBrandMark size="sm" wordmark wordmark-class="login-brand__name--mono" />
        </div>

        <header class="login-panel__header">
          <h1>Sign in to your console</h1>
          <p>Manage domains, edge fleet, and security rules.</p>
        </header>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-field">
            <label for="email">Email address</label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 6h18v12H3z" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="username"
                placeholder="you@company.com"
                required
                class="form-input"
              />
            </div>
          </div>

          <div class="form-field">
            <div class="form-field__row">
              <label for="password">Password</label>
              <a href="#" class="forgot-link" tabindex="-1" @click.prevent>Forgot password?</a>
            </div>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                required
                class="form-input form-input--password"
              />
              <button
                type="button"
                class="toggle-visibility"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M1 1l22 22" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                </svg>
                <svg v-else viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <label class="remember-row">
            <input v-model="rememberMe" type="checkbox" />
            <span>Remember me for 30 days</span>
          </label>

          <button
            type="submit"
            class="login-button"
            :class="{ 'login-button--loading': isLoading }"
            :disabled="isLoading"
          >
            <span class="login-button__spinner" aria-hidden="true" />
            <span class="login-button__label">{{ isLoading ? 'Signing in…' : 'Sign in' }}</span>
          </button>
        </form>

        <p v-if="idleMessage" class="login-alert login-alert--info" role="status">
          {{ idleMessage }}
        </p>

        <p v-if="errorMessage" class="login-alert login-alert--error" role="alert">
          {{ errorMessage }}
        </p>

        <div class="login-divider" aria-hidden="true">OR CONTINUE WITH</div>

        <div class="login-sso">
          <button type="button" class="login-sso__btn" @click.prevent>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.4c-.24 1.4-1.7 4.1-5.4 4.1-3.25 0-5.9-2.7-5.9-6s2.65-6 5.9-6c1.85 0 3.1.79 3.8 1.47l2.6-2.5C16.94 3.6 14.7 2.6 12 2.6 6.9 2.6 2.7 6.8 2.7 12s4.2 9.4 9.3 9.4c5.37 0 8.93-3.77 8.93-9.08 0-.61-.07-1.08-.15-1.55H12z" /></svg>
            Google
          </button>
          <button type="button" class="login-sso__btn" @click.prevent>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.68-.22.68-.48v-1.7c-2.8.6-3.4-1.35-3.4-1.35-.46-1.18-1.12-1.5-1.12-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.1 2.93.84.09-.65.35-1.1.63-1.35-2.23-.25-4.56-1.12-4.56-4.96 0-1.1.39-2 1.03-2.7-.1-.26-.45-1.3.1-2.7 0 0 .85-.27 2.77 1.03a9.6 9.6 0 0 1 5.04 0c1.92-1.3 2.77-1.03 2.77-1.03.55 1.4.2 2.44.1 2.7.64.7 1.03 1.6 1.03 2.7 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.75c0 .26.18.58.69.48A10 10 0 0 0 12 2z" /></svg>
            GitHub
          </button>
          <button type="button" class="login-sso__btn" @click.prevent>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            SSO
          </button>
        </div>

        <p class="login-help">
          New to Dorian?
          <a href="#" class="forgot-link" @click.prevent>Request access →</a>
        </p>
      </div>

      <footer class="login-legal">
        <span>© {{ currentYear }} Dorian</span>
        <a href="#" @click.prevent>Status</a>
        <a href="#" @click.prevent>Terms</a>
        <a href="#" @click.prevent>Privacy</a>
      </footer>
    </main>

    <aside class="login-showcase" aria-hidden="false">
      <canvas ref="scopeCanvas" class="login-showcase__scope" aria-hidden="true" />
      <div class="login-showcase__glow" aria-hidden="true" />

      <div class="showcase-layout">
        <div class="showcase-copy">
          <div class="showcase-brand">
            <DorianBrandMark wordmark wordmark-class="showcase-brand__name" />
          </div>

          <h2 class="showcase-copy__headline">
            Your PC powers the edge<br />Your sites stay protected
          </h2>
          <p class="showcase-copy__text">
            Community CDN with L4+L7 protection, automatic traffic analysis, AI WAF rules, and OWASP Top 10 coverage.
          </p>

          <div class="showcase-pills">
            <span v-for="tag in capabilityTags" :key="tag">{{ tag }}</span>
          </div>

          <ul class="showcase-features">
            <li v-for="feature in showcaseFeatures" :key="feature.label">
              <div class="showcase-features__icon" :class="feature.tone" aria-hidden="true">
                <svg
                  v-if="feature.tone === 'tone-edge'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="2" y="4" width="20" height="14" rx="2" />
                  <path d="M8 20h8M12 18v2" />
                </svg>
                <svg
                  v-else-if="feature.tone === 'tone-shield'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <svg
                  v-else-if="feature.tone === 'tone-analytics'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="M7 16v-5M12 16V8M17 16v-8" />
                </svg>
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M12 3 14.5 8.5 20 9l-4 4.5L17 20l-5-2.5L7 20l1-6.5L4 9l5.5-.5L12 3z" />
                </svg>
              </div>
              <div class="showcase-features__body">
                <strong>{{ feature.label }}</strong>
                <span class="showcase-features__desc">{{ feature.desc }}</span>
              </div>
            </li>
          </ul>

          <div class="showcase-stats">
            <div v-for="stat in showcaseStats" :key="stat.label" class="showcase-stat">
              <span class="showcase-stat__label">{{ stat.label }}</span>
              <span class="showcase-stat__value num">{{ stat.key ? liveMetrics[stat.key] : stat.value }}</span>
            </div>
          </div>
        </div>

        <div class="showcase-hero" aria-hidden="true">
          <div class="showcase-console">
            <aside class="showcase-console__sidebar">
              <div class="showcase-console__brand">
                <DorianBrandMark size="sm" />
                <div>
                  <strong>DORIAN</strong>
                  <span>Operator console</span>
                </div>
              </div>
              <nav class="showcase-console__nav">
                <span v-for="item in consoleNav" :key="item.label" class="showcase-console__nav-item" :class="{ active: item.active }">
                  <span class="showcase-console__nav-icon" v-html="item.icon" />
                  {{ item.label }}
                </span>
              </nav>
              <div class="showcase-console__status">
                <span class="showcase-console__status-dot" />
                {{ liveMetrics.nodes }} edges online
              </div>
            </aside>

            <div class="showcase-console__main">
              <div class="showcase-console__topbar">
                <div>
                  <strong>Fleet overview</strong>
                  <span>Live traffic · {{ liveMetrics.nodes }} edge nodes</span>
                </div>
                <span class="showcase-console__live">LIVE</span>
              </div>

              <div class="showcase-console__kpis">
                <div v-for="kpi in consoleKpis" :key="kpi.label" class="showcase-console__kpi">
                  <span>{{ kpi.label }}</span>
                  <strong class="num">{{ kpi.key ? liveMetrics[kpi.key] : kpi.value }}</strong>
                  <em v-if="kpi.delta" :class="kpi.deltaClass">{{ kpi.delta }}</em>
                </div>
              </div>

              <div class="showcase-console__scope-wrap">
                <canvas ref="dashCanvas" class="showcase-console__scope" aria-hidden="true" />
                <div class="showcase-console__scope-label">
                  <span>Traffic waveform</span>
                  <em class="num">{{ liveMetrics.rps }} req/s</em>
                </div>
              </div>

              <div class="showcase-console__traffic">
                <div class="showcase-console__bars">
                  <span
                    v-for="(bar, i) in trafficBars"
                    :key="i"
                    class="showcase-console__bar"
                    :style="{ '--h': `${bar}%`, '--d': `${i * 0.07}s` }"
                  />
                </div>
                <div class="showcase-console__traffic-foot">
                  <span>Live throughput</span>
                  <em class="num">{{ liveMetrics.threats }} blocked</em>
                </div>
              </div>

              <div class="showcase-console__mesh">
                <svg viewBox="0 0 400 140" class="showcase-console__mesh-svg" aria-hidden="true">
                  <defs>
                    <linearGradient id="mesh-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="rgba(63,189,133,0.15)" />
                      <stop offset="50%" stop-color="rgba(63,189,133,0.6)" />
                      <stop offset="100%" stop-color="rgba(91,157,240,0.15)" />
                    </linearGradient>
                  </defs>
                  <path class="showcase-mesh-line" d="M200 70 L80 28 M200 70 L320 28 M200 70 L60 112 M200 70 L340 112 M200 70 L200 12" stroke="url(#mesh-grad)" stroke-width="1.5" stroke-dasharray="4 4" />
                  <g class="showcase-node showcase-node--hub">
                    <circle cx="200" cy="70" r="14" fill="rgba(63,189,133,0.15)" stroke="#3FBD85" stroke-width="1.5">
                      <animate attributeName="r" values="14;19;14" dur="2.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.55;1" dur="2.8s" repeatCount="indefinite" />
                    </circle>
                  </g>
                  <g v-for="(node, i) in meshNodes" :key="i" class="showcase-node" :class="`showcase-node--${i + 1}`">
                    <rect :x="node.x" :y="node.y - 20" width="32" height="22" rx="4" :fill="node.fill" :stroke="node.stroke" stroke-width="1" />
                  </g>
                  <circle v-for="(path, i) in meshPaths" :key="`pkt-${i}`" r="3" fill="#3FBD85" opacity="0.9">
                    <animateMotion :dur="`${path.dur}s`" repeatCount="indefinite" :path="path.d" />
                  </circle>
                </svg>
              </div>

              <div class="showcase-console__log">
                <div class="showcase-console__log-head">
                  <strong>Threat feed</strong>
                  <span class="showcase-console__live showcase-console__live--sm">AI WAF</span>
                </div>
                <div class="showcase-console__log-scroll">
                  <TransitionGroup name="showcase-log" tag="div" class="showcase-console__log-list">
                    <div v-for="entry in liveThreatFeed" :key="entry.id" class="showcase-console__log-line">
                      <span class="num">{{ entry.time }}</span>
                      <span class="showcase-console__log-tag" :class="entry.tagClass">{{ entry.tag }}</span>
                      <span>{{ entry.msg }}</span>
                    </div>
                  </TransitionGroup>
                </div>
              </div>
            </div>
          </div>

          <div class="showcase-float-card showcase-float-card--waf">
            <div class="showcase-float-card__head">
              <span class="showcase-dash__pulse" />
              <strong>AI WAF rule</strong>
              <em>LIVE</em>
            </div>
            <Transition name="showcase-rule" mode="out-in">
              <div :key="activeWafRule.code" class="showcase-float-card__body">
                <code>{{ activeWafRule.code }}</code>
                <span>{{ activeWafRule.conf }} confidence · Deploy</span>
              </div>
            </Transition>
          </div>

          <div class="showcase-float showcase-float--owasp">
            <strong>OWASP</strong>
            <span>Top 10</span>
          </div>
          <div class="showcase-float showcase-float--l4">
            <strong>L4</strong>
            <span>DDoS active</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/api/auth'
import { useAuth } from '@/stores/auth'
import DorianBrandMark from '@/components/DorianBrandMark.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const currentYear = new Date().getFullYear()

const scopeCanvas = ref(null)
const dashCanvas = ref(null)

const capabilityTags = ['Community CDN', 'L4 + L7', 'AI WAF', 'OWASP Top 10']

const showcaseFeatures = [
  {
    label: 'Community CDN edges',
    desc: 'Contribute your PC as an edge node.',
    tone: 'tone-edge',
  },
  {
    label: 'L4 + L7 protection',
    desc: 'Fast, reliable mitigation at every layer.',
    tone: 'tone-shield',
  },
  {
    label: 'Auto traffic analysis',
    desc: 'Real-time inspection of every request.',
    tone: 'tone-analytics',
  },
  {
    label: 'AI WAF rules',
    desc: 'Rules generated from live traffic.',
    tone: 'tone-ai',
  },
]

const showcaseStats = [
  { label: 'Edge nodes', key: 'nodes' },
  { label: 'Uptime (30d)', value: '99.98%' },
  { label: 'Mitigation', value: '<50ms' },
]

const meshNodes = [
  { x: 68, y: 28, fill: 'rgba(91,157,240,0.14)', stroke: 'rgba(91,157,240,0.45)' },
  { x: 300, y: 28, fill: 'rgba(63,189,133,0.12)', stroke: 'rgba(63,189,133,0.4)' },
  { x: 48, y: 112, fill: 'rgba(63,189,133,0.1)', stroke: 'rgba(63,189,133,0.35)' },
  { x: 320, y: 112, fill: 'rgba(240,172,63,0.1)', stroke: 'rgba(240,172,63,0.4)' },
  { x: 184, y: 12, fill: 'rgba(176,140,240,0.1)', stroke: 'rgba(176,140,240,0.4)' },
]

const meshPaths = [
  { d: 'M200 70 L80 28', dur: 2.2 },
  { d: 'M200 70 L320 28', dur: 1.8 },
  { d: 'M200 70 L60 112', dur: 2.6 },
  { d: 'M200 70 L340 112', dur: 2.0 },
  { d: 'M200 70 L200 12', dur: 1.5 },
]

const consoleNav = [
  { label: 'Dashboard', active: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
  { label: 'WAF rules', active: false, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  { label: 'Edge fleet', active: false, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/></svg>' },
]

const consoleKpis = ref([
  { label: 'Requests/s', key: 'rps', delta: '+12%', deltaClass: 'up' },
  { label: 'Threats blocked', key: 'threats', delta: '-4%', deltaClass: 'down' },
  { label: 'Edge health', value: 'Healthy', delta: '99.98%', deltaClass: 'up' },
])

const threatPool = [
  { tag: 'L7', tagClass: 'l7', msg: 'Blocked XSS on /api/user' },
  { tag: 'L4', tagClass: 'l4', msg: 'SYN flood mitigated · 14.2 Gbps' },
  { tag: 'AI', tagClass: 'ai', msg: 'New rule: block sql_injection OWASP A03' },
  { tag: 'L7', tagClass: 'l7', msg: 'Rate limit /wp-admin/* triggered' },
  { tag: 'SYS', tagClass: 'sys', msg: 'edge-eu-01 cache hit 94.2%' },
  { tag: 'L4', tagClass: 'l4', msg: 'UDP reflection attack dropped' },
  { tag: 'L7', tagClass: 'l7', msg: 'Path traversal blocked · OWASP A01' },
  { tag: 'AI', tagClass: 'ai', msg: 'Anomaly score 0.94 · auto-mitigate' },
]

let threatFeedId = 0

const formatThreatTime = () => {
  const now = new Date()
  return now.toTimeString().slice(0, 8)
}

const liveThreatFeed = ref(
  threatPool.slice(0, 5).map((entry) => ({
    id: ++threatFeedId,
    time: formatThreatTime(),
    ...entry,
  })),
)

const trafficBars = ref([38, 55, 72, 48, 88, 62, 94, 71, 58, 83, 66, 79, 52, 90, 67, 74])

const wafRules = [
  { code: 'block sql_injection — OWASP A03', conf: '97%' },
  { code: 'rate_limit /wp-admin/* — OWASP A05', conf: '89%' },
  { code: 'deny xss payload — OWASP A03', conf: '94%' },
]

const liveMetrics = ref({
  rps: '84,214',
  threats: '18.2K',
  nodes: '312',
})

const wafRuleIndex = ref(0)
const activeWafRule = computed(() => wafRules[wafRuleIndex.value % wafRules.length])

let liveInterval = null
let wafInterval = null
let threatInterval = null

const startCanvasAnimation = (canvasRef, options = {}) => {
  const canvas = canvasRef.value
  if (!canvas) return null

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const { midRatio = 0.62, opacity = 0.28, amplitude = 22, dual = false } = options
  let tick = 0

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  resize()
  window.addEventListener('resize', resize)

  const drawWave = (phase, waveOpacity, waveAmplitude, color) => {
    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mid = height * midRatio

    ctx.strokeStyle = color.replace('OPACITY', String(waveOpacity))
    ctx.lineWidth = dual ? 1.2 : 1.4
    ctx.beginPath()

    for (let x = 0; x <= width; x += 4) {
      const y = mid - (Math.sin(x * 0.012 + phase) * waveAmplitude + Math.sin(x * 0.03 + phase * 1.6) * (waveAmplitude * 0.45))
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.stroke()
  }

  const draw = () => {
    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    drawWave(tick, opacity, amplitude, `rgba(63,189,133,OPACITY)`)
    if (dual) {
      drawWave(tick * 1.35 + 1.2, opacity * 0.55, amplitude * 0.72, `rgba(91,157,240,OPACITY)`)
    }
    if (!reduceMotion) tick += 0.03
  }

  if (reduceMotion) {
    draw()
    return () => window.removeEventListener('resize', resize)
  }

  let frame = null
  const loop = () => {
    draw()
    frame = requestAnimationFrame(loop)
  }

  loop()
  return () => {
    window.removeEventListener('resize', resize)
    if (frame) cancelAnimationFrame(frame)
  }
}

const startScopeAnimation = () =>
  startCanvasAnimation(scopeCanvas, { midRatio: 0.52, opacity: 0.4, amplitude: 42, dual: true })

const startDashAnimation = () =>
  startCanvasAnimation(dashCanvas, { midRatio: 0.52, opacity: 0.65, amplitude: 22, dual: true })

let stopScopeAnimation = null
let stopDashAnimation = null

onMounted(async () => {
  stopScopeAnimation = startScopeAnimation()
  await nextTick()
  stopDashAnimation = startDashAnimation()

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduceMotion) {
    liveInterval = setInterval(() => {
      const base = 84214 + Math.round((Math.random() - 0.5) * 1800)
      liveMetrics.value.rps = base.toLocaleString()
      liveMetrics.value.threats = `${(18.1 + Math.random() * 0.4).toFixed(1)}K`

      trafficBars.value = trafficBars.value.map(() => 30 + Math.round(Math.random() * 65))

      const rpsDelta = (8 + Math.random() * 10).toFixed(0)
      const threatDelta = (2 + Math.random() * 6).toFixed(0)
      consoleKpis.value[0].delta = `+${rpsDelta}%`
      consoleKpis.value[1].delta = `-${threatDelta}%`
    }, 2000)

    wafInterval = setInterval(() => {
      wafRuleIndex.value = (wafRuleIndex.value + 1) % wafRules.length
    }, 3500)

    threatInterval = setInterval(() => {
      const entry = threatPool[Math.floor(Math.random() * threatPool.length)]
      liveThreatFeed.value.unshift({
        id: ++threatFeedId,
        time: formatThreatTime(),
        ...entry,
      })
      if (liveThreatFeed.value.length > 6) {
        liveThreatFeed.value.pop()
      }
    }, 2800)
  }
})

onUnmounted(() => {
  if (stopScopeAnimation) stopScopeAnimation()
  if (stopDashAnimation) stopDashAnimation()
  if (liveInterval) clearInterval(liveInterval)
  if (wafInterval) clearInterval(wafInterval)
  if (threatInterval) clearInterval(threatInterval)
})

const idleMessage = computed(() =>
  String(route.query.reason || '').toLowerCase() === 'idle'
    ? 'Your session expired after 15 minutes of inactivity. Please sign in again.'
    : '',
)

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    if (!email.value || !password.value) {
      throw new Error('Please enter your email and password.')
    }

    const result = await login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    })

    const user = result?.user || {
      name: email.value.split('@')[0],
      email: result?.email || email.value,
    }

    auth.setSession({ user, token: result?.token || null, rememberMe: rememberMe.value })

    const redirectTo = route.query.redirect ? String(route.query.redirect) : '/app'
    await router.replace(redirectTo)

    email.value = ''
    password.value = ''
    rememberMe.value = false
  } catch (error) {
    errorMessage.value = error?.message || 'Sign in failed. Check your credentials and try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

