import { apiRequest } from './client'

export const fetchResponseRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/waf/response-freq`)

export const createResponseRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/waf/response-freq`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateResponseRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/waf/response-freq/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteResponseRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/waf/response-freq/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteResponseRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/waf/response-freq/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
