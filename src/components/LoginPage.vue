<template>
  <div class="login-container">
    <ThemeToggleButton variant="on-login" />
    <div class="login-card">
      <p class="login-title">Welcome to Dorian</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">User</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="Enter your email"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            v-model="password"
            placeholder="Enter your password"
            required
            class="form-input"
          />
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="rememberMe" />
            <span>Remember me</span>
          </label>
          <a href="#" class="forgot-link">Forgot password?</a>
        </div>

        <button type="submit" class="login-button" :disabled="isLoading">
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="signup-link">
        Don't have an account? <a href="#">Sign up</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/api/auth'
import { useAuth } from '@/stores/auth'
import ThemeToggleButton from './ThemeToggleButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    if (!email.value || !password.value) {
      throw new Error('Please fill in all fields')
    }

    const result = await login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value
    })

    const user = result?.user || {
      name: email.value.split('@')[0],
      email: result?.email || email.value
    }

    auth.setSession({ user, token: result?.token || null })

    const redirectTo = route.query.redirect
      ? String(route.query.redirect)
      : '/app'
    await router.replace(redirectTo)

    email.value = ''
    password.value = ''
    rememberMe.value = false
  } catch (error) {
    errorMessage.value = error?.message || 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Mobile First - Base Styles */
.login-container {
  /* For full viewport coverage */
  position: fixed; /* or absolute */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  
  /* Alternative using viewport units */
  width: 100%;
  min-height: 100vh;
  
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-login-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  padding: 16px;
  box-sizing: border-box;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.login-card {
  background: var(--app-login-card, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  text-align: center;
  letter-spacing: -0.5px;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
  
  @media (max-width: 480px) {
    font-size: 20px;
  }
}

.login-subtitle {
  color: #718096;
  text-align: center;
  margin: 0 0 32px 0;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  padding: 14px 18px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  width: 100%;
  background: #f9fafb;
  color: #1a202c;
}

.form-input:hover {
  border-color: #cbd5e0;
  background: #ffffff;
}

.form-input:focus {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.form-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 0.875rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  text-align: center;
}

.forgot-link:hover {
  color: #764ba2;
}

.login-button {
  margin-top: 12px;
  width: 100%;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.875rem;
  text-align: center;
}

.signup-link {
  margin-top: 24px;
  text-align: center;
  font-size: 0.875rem;
  color: #718096;
}

.signup-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.signup-link a:hover {
  color: #764ba2;
}

/* High DPI / Retina Display Optimization */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .login-card {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  }
}
</style>

