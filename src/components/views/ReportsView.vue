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
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reports-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 24px 0;
}

.reports-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.report-section {
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.report-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.report-section p {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}
</style>

