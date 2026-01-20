<template>
  <div class="servers-view">
    <div class="content-card">
      <h2>Blacklist</h2>
      <p>Review and manage blocked servers and IP addresses.</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.servers-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.content-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 12px 0;
}

.content-card p {
  margin: 0;
  color: #4a5568;
  font-size: 0.98rem;
}
</style>

