import { apiRequest } from './client'

export const fetchUsers = async () => apiRequest('/users')

export const fetchUser = async (id) => apiRequest(`/users/${id}`)

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

export const resetUserMFA = async (id) =>
  apiRequest(`/users/${id}/mfa`, {
    method: 'DELETE',
  })

export const sendUserInvite = async (id) =>
  apiRequest(`/users/${id}/invite`, { method: 'POST' })

export const createUserResetLink = async (id) =>
  apiRequest(`/users/${id}/password-reset`, { method: 'POST' })

export const listUserSessions = async (id) => apiRequest(`/users/${id}/sessions`)

export const revokeUserSessions = async (id) =>
  apiRequest(`/users/${id}/sessions/revoke`, { method: 'POST' })
