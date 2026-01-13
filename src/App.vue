<script setup>
import { ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import MainPage from './components/MainPage.vue'

const isLoggedIn = ref(false)

const handleLoginSuccess = () => {
  isLoggedIn.value = true
}

const handleLogout = () => {
  isLoggedIn.value = false
}
</script>

<template>
  <LoginPage v-if="!isLoggedIn" @login-success="handleLoginSuccess" />
  <MainPage v-else @logout="handleLogout" />
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
