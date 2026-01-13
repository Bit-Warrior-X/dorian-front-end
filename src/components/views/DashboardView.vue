<template>
  <div class="dashboard-view">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <h3>Total Requests</h3>
          <p class="stat-value">12,345</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-info">
          <h3>Active Proxies</h3>
          <p class="stat-value">8</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🌐</div>
        <div class="stat-info">
          <h3>Bandwidth</h3>
          <p class="stat-value">2.4 TB</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>Success Rate</h3>
          <p class="stat-value">99.8%</p>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="content-card">
        <h2>Recent Activity</h2>
        <div class="activity-list">
          <div class="activity-item">
            <span class="activity-time">2 min ago</span>
            <span class="activity-text">New proxy server added</span>
          </div>
          <div class="activity-item">
            <span class="activity-time">15 min ago</span>
            <span class="activity-text">Configuration updated</span>
          </div>
          <div class="activity-item">
            <span class="activity-time">1 hour ago</span>
            <span class="activity-text">User authentication successful</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.dashboard-view {
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
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
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

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 20px 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7fafc;
  border-radius: 8px;
}

.activity-time {
  font-size: 0.875rem;
  color: #718096;
}

.activity-text {
  font-size: 0.95rem;
  color: #1a202c;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

