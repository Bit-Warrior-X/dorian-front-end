<template>
  <div class="users-view">
    <div class="users-card">
      <div class="card-header">
        <h2>User Management</h2>
        <button class="add-button">+ Add User</button>
      </div>
      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Super Admin</td>
              <td>superadmin@gmail.com</td>
              <td><span class="badge admin">Admin</span></td>
              <td><span class="badge active">Active</span></td>
              <td>
                <button class="action-btn">Edit</button>
              </td>
            </tr>
            <tr>
              <td>John Doe</td>
              <td>john@example.com</td>
              <td><span class="badge user">User</span></td>
              <td><span class="badge active">Active</span></td>
              <td>
                <button class="action-btn">Edit</button>
              </td>
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
.users-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.users-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.add-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.add-button:hover {
  transform: translateY(-2px);
}

.users-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f7fafc;
}

th {
  padding: 12px;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #1a202c;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.admin {
  background: #dbeafe;
  color: #1e40af;
}

.badge.user {
  background: #f3f4f6;
  color: #374151;
}

.badge.active {
  background: #d1fae5;
  color: #065f46;
}

.action-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #e5e7eb;
}
</style>

