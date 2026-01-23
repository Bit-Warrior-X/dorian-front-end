import { apiRequest } from './client'

export const fetchAntiCcRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/waf/anti-cc`)

export const createAntiCcRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/waf/anti-cc`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateAntiCcRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/waf/anti-cc/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteAntiCcRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/waf/anti-cc/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteAntiCcRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/waf/anti-cc/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
