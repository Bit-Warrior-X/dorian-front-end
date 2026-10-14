import { apiRequest } from './client'

export const fetchMFAStatus = async () => apiRequest('/auth/mfa')

export const startMFASetup = async () =>
  apiRequest('/auth/mfa/setup', {
    method: 'POST',
  })

export const enableMFA = async (code) =>
  apiRequest('/auth/mfa/enable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })

export const disableMFA = async (code) =>
  apiRequest('/auth/mfa/disable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })

export const regenerateRecoveryCodes = async (code) =>
  apiRequest('/auth/mfa/recovery-codes', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
