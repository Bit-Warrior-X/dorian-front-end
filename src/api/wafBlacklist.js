import { apiRequest } from './client'

export const fetchBlacklistRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/waf/blacklist`)

export const createBlacklistRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/waf/blacklist`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateBlacklistRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/waf/blacklist/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteBlacklistRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/waf/blacklist/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteBlacklistRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/waf/blacklist/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
