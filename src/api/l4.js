import { apiRequest } from './client'

export const fetchL4Config = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4`)

export const updateL4Config = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/l4`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const fetchL4Options = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4/options`)

export const fetchL4BlacklistEntries = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4/blacklist`)

export const createL4BlacklistEntry = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/l4/blacklist`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const deleteL4BlacklistEntry = async (serverId, entryId) =>
  apiRequest(`/servers/${serverId}/l4/blacklist/remove/${entryId}`, {
    method: 'POST',
  })

export const flushL4BlacklistEntries = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4/blacklist/clear`, {
    method: 'POST',
  })

export const fetchL4WhitelistEntries = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4/whitelist`)

export const createL4WhitelistEntry = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/l4/whitelist`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const deleteL4WhitelistEntry = async (serverId, entryId) =>
  apiRequest(`/servers/${serverId}/l4/whitelist/remove/${entryId}`, {
    method: 'POST',
  })

export const clearL4WhitelistEntries = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4/whitelist/clear`, {
    method: 'POST',
  })
