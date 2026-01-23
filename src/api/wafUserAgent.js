import { apiRequest } from './client'

export const fetchUserAgentRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/waf/user-agent`)

export const createUserAgentRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/waf/user-agent`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateUserAgentRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/waf/user-agent/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteUserAgentRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/waf/user-agent/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteUserAgentRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/waf/user-agent/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
