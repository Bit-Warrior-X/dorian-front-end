<template>
  <div class="settings-view">
    <div class="settings-card">
      <h2>General Settings</h2>
      <div class="settings-form">
        <div class="form-group">
          <label>Proxy Server URL</label>
          <input type="text" placeholder="https://proxy.example.com" />
        </div>
        <div class="form-group">
          <label>API Key</label>
          <input type="password" placeholder="Enter API key" />
        </div>
        <div class="form-group">
          <label>Timeout (seconds)</label>
          <input type="number" placeholder="30" />
        </div>
        <button class="save-button">Save Settings</button>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 24px 0;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  outline: none;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.save-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  align-self: flex-start;
}

.save-button:hover {
  transform: translateY(-2px);
}
</style>

