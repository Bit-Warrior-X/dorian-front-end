import { apiRequest } from './client'

export const fetchIntervalRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/waf/interval-freq-limit`)

export const createIntervalRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/waf/interval-freq-limit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateIntervalRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/waf/interval-freq-limit/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteIntervalRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/waf/interval-freq-limit/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteIntervalRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/waf/interval-freq-limit/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
