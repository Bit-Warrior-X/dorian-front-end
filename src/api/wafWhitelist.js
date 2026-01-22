import { apiRequest } from './client'

export const fetchWhitelistRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/waf/whitelist`)

export const createWhitelistRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/waf/whitelist`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateWhitelistRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/waf/whitelist/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteWhitelistRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/waf/whitelist/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteWhitelistRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/waf/whitelist/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
