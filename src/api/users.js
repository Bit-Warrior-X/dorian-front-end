import { apiRequest } from './client'

export const fetchUsers = async () => apiRequest('/users')

export const createUser = async (payload) =>
  apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateUser = async (id, payload) =>
  apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteUser = async (id) =>
  apiRequest(`/users/${id}`, {
    method: 'DELETE',
  })
