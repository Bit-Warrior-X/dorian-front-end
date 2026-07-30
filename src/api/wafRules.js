import { apiRequest } from './client'

export const fetchWafRules = async (role = 'predefined') => {
  const query = role ? `?role=${encodeURIComponent(role)}` : ''
  return apiRequest(`/waf-rules${query}`)
}

export const fetchWafRule = async (wafRuleId) =>
  apiRequest(`/waf-rules/${wafRuleId}`)

export const createWafRule = async (payload) =>
  apiRequest('/waf-rules', {
    method: 'POST',
    body: JSON.stringify({ ...payload, role: 'predefined' }),
  })

export const updateWafRule = async (wafRuleId, payload) =>
  apiRequest(`/waf-rules/${wafRuleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const duplicateWafRule = async (wafRuleId, payload = {}) =>
  apiRequest(`/waf-rules/${wafRuleId}/duplicate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const deleteWafRule = async (wafRuleId) =>
  apiRequest(`/waf-rules/${wafRuleId}`, {
    method: 'DELETE',
  })
