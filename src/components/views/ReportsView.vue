<template>
  <div class="reports-view">
    <div class="reports-card">
      <h2>System Reports</h2>
      <div class="reports-content">
        <div class="report-section">
          <h3>Performance Metrics</h3>
          <p>View detailed performance reports and analytics.</p>
        </div>
        <div class="report-section">
          <h3>Usage Statistics</h3>
          <p>Monitor bandwidth usage and request patterns.</p>
        </div>
        <div class="report-section">
          <h3>Error Logs</h3>
          <p>Review system errors and warnings.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.reports-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.reports-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.reports-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1a202c 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 28px 0;
  letter-spacing: -0.5px;
}

.reports-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.report-section {
  padding: 24px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  border-left: 4px solid;
  border-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%) 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.report-section:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #ffffff 0%, #f7fafc 100%);
}

.report-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 12px 0;
}

.report-section p {
  font-size: 0.9rem;
  color: #718096;
  margin: 0;
  line-height: 1.6;
}
</style>

