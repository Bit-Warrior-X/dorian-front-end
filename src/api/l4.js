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
  apiRequest(`/servers/${serverId}/l4/blacklist/${entryId}`, {
    method: 'DELETE',
  })

export const flushL4BlacklistEntries = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4/blacklist`, {
    method: 'DELETE',
  })

export const fetchL4WhitelistEntries = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4/whitelist`)

export const createL4WhitelistEntry = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}/l4/whitelist`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const deleteL4WhitelistEntry = async (serverId, entryId) =>
  apiRequest(`/servers/${serverId}/l4/whitelist/${entryId}`, {
    method: 'DELETE',
  })

export const clearL4WhitelistEntries = async (serverId) =>
  apiRequest(`/servers/${serverId}/l4/whitelist`, {
    method: 'DELETE',
  })
