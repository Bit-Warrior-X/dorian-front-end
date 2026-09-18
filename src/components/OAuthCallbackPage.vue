<template>
  <div class="oauth-callback-page">
    <p v-if="errorMessage" class="oauth-callback-page__error" role="alert">{{ errorMessage }}</p>
    <p v-else class="oauth-callback-page__status">{{ statusMessage }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { completeOAuthSession } from '@/api/oauth'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const auth = useAuth()

const statusMessage = ref('Completing Google sign-in…')
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

    // Clear token from the URL bar.
    window.history.replaceState({}, document.title, window.location.pathname)
    statusMessage.value = 'Signed in. Redirecting…'
    await router.replace(redirectTo.startsWith('/') ? redirectTo : '/app')
  } catch (error) {
    errorMessage.value = error?.message || 'Google sign-in failed.'
    setTimeout(() => {
      void router.replace({
        name: 'login',
        query: { oauth_error: errorMessage.value },
      })
    }, 1600)
  }
})
</script>

<style scoped>
.oauth-callback-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--app-bg, #0b1220);
  color: var(--app-text, #e8eef7);
  font-family: var(--font-sans, system-ui, sans-serif);
}

.oauth-callback-page__status,
.oauth-callback-page__error {
  margin: 0;
  max-width: 28rem;
  text-align: center;
  line-height: 1.5;
}

.oauth-callback-page__error {
  color: #f07178;
}
</style>
