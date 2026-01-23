import { apiRequest } from './client'

export const fetchSecondRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/waf/second-freq-limit`)

export const createSecondRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/waf/second-freq-limit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateSecondRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/waf/second-freq-limit/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteSecondRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/waf/second-freq-limit/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteSecondRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/waf/second-freq-limit/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
