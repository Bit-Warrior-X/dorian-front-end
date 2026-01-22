import { apiRequest } from './client'

export const fetchGeoRules = async (serverId) =>
  apiRequest(`/servers/${serverId}/waf/geolocation`)

export const createGeoRule = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/waf/geolocation`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateGeoRule = async (serverId, ruleId, payload) =>
  apiRequest(`/servers/${serverId}/waf/geolocation/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteGeoRule = async (serverId, ruleId) =>
  apiRequest(`/servers/${serverId}/waf/geolocation/${ruleId}`, {
    method: 'DELETE',
  })

export const deleteGeoRules = async (serverId, ids) =>
  apiRequest(`/servers/${serverId}/waf/geolocation/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
