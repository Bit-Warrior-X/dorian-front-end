<script setup>
import { ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import MainPage from './components/MainPage.vue'

const isLoggedIn = ref(false)
const userRole = ref('user')

const handleLoginSuccess = (payload) => {
  isLoggedIn.value = true
  userRole.value = payload?.role || 'user'
}

const handleLogout = () => {
  isLoggedIn.value = false
  userRole.value = 'user'
}
</script>

<template>
  <LoginPage v-if="!isLoggedIn" @login-success="handleLoginSuccess" />
  <MainPage v-else :user-role="userRole" @logout="handleLogout" />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}
</style>
