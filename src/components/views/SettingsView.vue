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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.settings-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1a202c 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 28px 0;
  letter-spacing: -0.5px;
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
  padding: 14px 18px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  background: #f9fafb;
}

.form-group input:hover {
  border-color: #cbd5e0;
  background: #ffffff;
}

.form-group input:focus {
  border-color: #667eea;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.save-button {
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  align-self: flex-start;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.save-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.save-button:active {
  transform: translateY(-1px);
}
</style>

