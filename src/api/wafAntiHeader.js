import { apiRequest } from './client'

export const fetchAntiHeaderRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/waf/anti-header`)

export const createAntiHeaderRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/waf/anti-header`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateAntiHeaderRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/waf/anti-header/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteAntiHeaderRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/waf/anti-header/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteAntiHeaderRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/waf/anti-header/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
