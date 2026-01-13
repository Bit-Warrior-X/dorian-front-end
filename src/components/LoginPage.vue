<template>
  <div class="login-container">
    <div class="login-card">
      <p class="login-title">Welcome to CDNProxy</p>

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

const emit = defineEmits(['login-success'])

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  // Simulate API call
  setTimeout(() => {
    // Validate credentials
    const validEmail = 'superadmin@gmail.com'
    const validPassword = '123456'

    if (!email.value || !password.value) {
      errorMessage.value = 'Please fill in all fields'
      isLoading.value = false
      return
    }

    // Check if credentials match
    if (email.value.toLowerCase().trim() === validEmail && password.value === validPassword) {
      console.log('Login successful:', {
        email: email.value,
        rememberMe: rememberMe.value
      })
      // Emit login success event
      emit('login-success')
      // Reset form
      email.value = ''
      password.value = ''
      rememberMe.value = false
    } else {
      errorMessage.value = 'Invalid email or password. Please try again.'
    }
    
    isLoading.value = false
  }, 1000)
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
  box-sizing: border-box;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 24px;
  width: 100%;
  max-width: 400px;
}

.login-title {
  /* Base size for desktop */
  font-size: 30px;
  font-weight: 500;
  color: #1a202c;
  margin: 0 0 8px 0;
  text-align: center;
  
  /* Responsive for tablet */
  @media (max-width: 768px) {
    font-size: 20px;
  }
  
  /* Responsive for mobile */
  @media (max-width: 480px) {
    font-size: 18px;
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
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  outline: none;
  width: 100%;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 8px;
  width: 100%;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
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

