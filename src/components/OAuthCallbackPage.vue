<template>
  <div class="oauth-bridge" :class="{ 'oauth-bridge--error': Boolean(errorMessage) }">
    <div class="oauth-bridge__grid" aria-hidden="true" />
    <div class="oauth-bridge__glow" aria-hidden="true" />

    <div class="oauth-bridge__card">
      <DorianBrandMark size="lg" wordmark wordmark-class="oauth-bridge__wordmark" />

      <template v-if="errorMessage">
        <p class="oauth-bridge__error" role="alert">{{ errorMessage }}</p>
        <p class="oauth-bridge__hint">Returning to sign in…</p>
      </template>
      <template v-else>
        <div class="oauth-bridge__pulse" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p class="oauth-bridge__kicker">Connecting to edge</p>
        <div class="oauth-bridge__meter" aria-hidden="true">
          <i />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { completeOAuthSession } from '@/api/oauth'
import DorianBrandMark from '@/components/DorianBrandMark.vue'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const auth = useAuth()
const errorMessage = ref('')

const parseHashParams = () => {
  const hash = String(window.location.hash || '').replace(/^#/, '')
  return new URLSearchParams(hash)
}

onMounted(async () => {
  try {
    const params = parseHashParams()
    const token = params.get('token')
    if (!token) {
      throw new Error('Missing sign-in token. Please try Google sign-in again.')
    }
    const remember = params.get('remember') === '1'
    const redirectTo = params.get('redirect') || '/app'

    const result = await completeOAuthSession(token)
    auth.setSession({
      user: result.user,
      token: result.token,
      rememberMe: remember,
    })

    window.history.replaceState({}, document.title, window.location.pathname)
    await router.replace(redirectTo.startsWith('/') ? redirectTo : '/app')
  } catch (error) {
    errorMessage.value = error?.message || 'Google sign-in failed.'
    setTimeout(() => {
      void router.replace({
        name: 'login',
        query: { oauth_error: errorMessage.value },
      })
    }, 1400)
  }
})
</script>

<style scoped>
.oauth-bridge {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: hidden;
  background: #0b0f0d;
  color: #e8ede9;
  font-family: Inter, system-ui, sans-serif;
}

.oauth-bridge__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(63, 189, 133, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(63, 189, 133, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at center, #000 20%, transparent 72%);
  pointer-events: none;
}

.oauth-bridge__glow {
  position: absolute;
  width: min(520px, 80vw);
  height: min(520px, 80vw);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(63, 189, 133, 0.18), transparent 68%);
  filter: blur(12px);
  pointer-events: none;
  animation: oauth-glow 2.8s ease-in-out infinite;
}

.oauth-bridge__card {
  position: relative;
  z-index: 1;
  width: min(360px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 36px 28px 32px;
  border-radius: 16px;
  border: 0.5px solid #333f38;
  background: rgba(18, 24, 21, 0.88);
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}

.oauth-bridge__wordmark {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  letter-spacing: 0.08em;
}

.oauth-bridge__kicker {
  margin: 0;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8b978f;
}

.oauth-bridge__pulse {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 14px;
}

.oauth-bridge__pulse span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3fbd85;
  opacity: 0.35;
  animation: oauth-dot 1.05s ease-in-out infinite;
}

.oauth-bridge__pulse span:nth-child(2) {
  animation-delay: 0.15s;
}

.oauth-bridge__pulse span:nth-child(3) {
  animation-delay: 0.3s;
}

.oauth-bridge__meter {
  width: 100%;
  height: 2px;
  border-radius: 999px;
  overflow: hidden;
  background: #232d28;
}

.oauth-bridge__meter i {
  display: block;
  width: 42%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, #3fbd85, transparent);
  animation: oauth-meter 1.1s ease-in-out infinite;
}

.oauth-bridge__error {
  margin: 0;
  text-align: center;
  color: #e15241;
  font-size: 14px;
  line-height: 1.45;
}

.oauth-bridge__hint {
  margin: 0;
  font-size: 12px;
  color: #8b978f;
}

@keyframes oauth-dot {
  0%,
  100% {
    opacity: 0.28;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@keyframes oauth-meter {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(280%);
  }
}

@keyframes oauth-glow {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .oauth-bridge__glow,
  .oauth-bridge__pulse span,
  .oauth-bridge__meter i {
    animation: none;
  }
}
</style>
