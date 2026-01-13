<template>
  <div class="layer4-attack-view">
    <div class="view-card">
      <h2>Layer 4 Attack Analytics</h2>
      
      <div class="attack-stats">
        <div class="attack-stat-card">
          <div class="attack-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div class="attack-info">
            <h3>Total Attacks</h3>
            <p class="attack-value">456</p>
            <span class="attack-change positive">+12% from last week</span>
          </div>
        </div>
        
        <div class="attack-stat-card">
          <div class="attack-icon blocked">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div class="attack-info">
            <h3>Blocked</h3>
            <p class="attack-value">432</p>
            <span class="attack-change positive">94.7% success rate</span>
          </div>
        </div>
      </div>
      
      <div class="attack-table-card">
        <h3>Recent Attack Attempts</h3>
        <table class="attack-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source IP</th>
              <th>Attack Type</th>
              <th>Target Port</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>10:23:45</td>
              <td>203.0.113.45</td>
              <td><span class="badge attack-syn">SYN Flood</span></td>
              <td>80</td>
              <td><span class="badge status-blocked">Blocked</span></td>
              <td><button class="action-btn">View</button></td>
            </tr>
            <tr>
              <td>10:20:12</td>
              <td>198.51.100.23</td>
              <td><span class="badge attack-udp">UDP Flood</span></td>
              <td>443</td>
              <td><span class="badge status-blocked">Blocked</span></td>
              <td><button class="action-btn">View</button></td>
            </tr>
            <tr>
              <td>10:15:33</td>
              <td>192.0.2.67</td>
              <td><span class="badge attack-icmp">ICMP Flood</span></td>
              <td>22</td>
              <td><span class="badge status-blocked">Blocked</span></td>
              <td><button class="action-btn">View</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.layer4-attack-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.view-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1a202c 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 28px 0;
  letter-spacing: -0.5px;
}

.attack-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.attack-stat-card {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e5e7eb;
}

.attack-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.attack-icon.blocked {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.attack-icon svg {
  width: 30px;
  height: 30px;
}

.attack-info h3 {
  font-size: 0.875rem;
  color: #718096;
  margin: 0 0 6px 0;
  font-weight: 500;
}

.attack-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 6px 0;
}

.attack-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.attack-change.positive {
  color: #10b981;
}

.attack-table-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 20px 0;
}

.attack-table {
  width: 100%;
  border-collapse: collapse;
}

.attack-table thead {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
}

.attack-table th {
  padding: 16px;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.attack-table td {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #1a202c;
  font-size: 0.9rem;
}

.attack-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.02);
}

.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

.badge.attack-syn {
  background: #fee2e2;
  color: #991b1b;
}

.badge.attack-udp {
  background: #fef3c7;
  color: #92400e;
}

.badge.attack-icmp {
  background: #dbeafe;
  color: #1e40af;
}

.badge.status-blocked {
  background: #d1fae5;
  color: #065f46;
}

.action-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
}

.action-btn:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #cbd5e0 100%);
  transform: translateY(-1px);
}
</style>

