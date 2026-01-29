<template>
  <div class="security-analytics-view">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon security">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Threats Blocked</h3>
          <p class="stat-value">1,234</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Active Alerts</h3>
          <p class="stat-value">23</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <h3>Security Score</h3>
          <p class="stat-value">98.5%</p>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
</script>

<style scoped>
.security-analytics-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(102, 126, 234, 0.2);
}

.stat-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.stat-icon.security {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon svg {
  width: 36px;
  height: 36px;
}

.stat-info h3 {
  font-size: 0.875rem;
  color: #718096;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

</style>

