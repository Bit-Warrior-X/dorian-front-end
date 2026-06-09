import { apiRequest } from './client'
import { serverList } from '@/data/servers'
import { getApiConfig } from './config'

export const fetchServers = async () => {
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    return serverList.map((server) => ({ ...server }))
  }

  return apiRequest('/servers')
}

/** Product versions from deploy_license (proxied by Go GET /api/v1/deploy-versions). */
export const fetchDeployVersions = async () => {
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    return {
      versions: [
        {
          uuid: 'mock-uuid-1',
          version: '0.1.7',
          os: 'ubuntu-24.04',
          full_name: 'dorian-ddos-firewall-0.1.7-ubuntu-24.04-payload-mock.tar.gz',
          path: '/opt/dorian/0.1.7-ubuntu-24.04',
          updated: '2025-04-15T10:30:00Z',
        },
        {
          uuid: 'mock-uuid-2',
          version: '0.1.7',
          os: 'ubuntu-22.04',
          full_name: 'dorian-ddos-firewall-0.1.7-ubuntu-22.04-payload-mock.tar.gz',
          path: '/opt/dorian/0.1.7-ubuntu-22.04',
          updated: '2025-04-10T10:30:00Z',
        },
        {
          uuid: 'mock-uuid-3',
          version: '0.1.2',
          os: null,
          full_name: 'dorian-ddos-firewall-0.1.2-payload-mock.tar.gz',
          path: '/opt/dorian/0.1.2',
          updated: '2024-11-20T14:15:00Z',
        },
      ],
    }
  }
  return apiRequest('/api/v1/deploy-versions')
}

const mockDeployVersions = () => [
  {
    uuid: 'mock-uuid-1',
    version: '0.1.7',
    os: 'ubuntu-24.04',
    full_name: 'dorian-ddos-firewall-0.1.7-ubuntu-24.04-payload-mock.tar.gz',
    path: '/opt/dorian/0.1.7-ubuntu-24.04',
    updated: '2025-04-15T10:30:00Z',
  },
  {
    uuid: 'mock-uuid-2',
    version: '0.1.7',
    os: 'ubuntu-22.04',
    full_name: 'dorian-ddos-firewall-0.1.7-ubuntu-22.04-payload-mock.tar.gz',
    path: '/opt/dorian/0.1.7-ubuntu-22.04',
    updated: '2025-04-10T10:30:00Z',
  },
]

/** SSH to target host, detect OS, return matching deploy versions (POST /api/v1/servers/probe-host-versions). */
export const probeHostVersions = async (payload) => {
  const opts = {
    method: 'POST',
    body: JSON.stringify(payload),
  }
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    opts.signal = AbortSignal.timeout(60_000)
  }
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const os = 'ubuntu-22.04'
    const versions = mockDeployVersions().filter((item) => item.os === os)
    return { os, versions }
  }
  return apiRequest('/api/v1/servers/probe-host-versions', opts)
}

export const updateServerUsers = async (serverId, userIds) =>
  apiRequest(`/servers/${serverId}/users`, {
    method: 'PUT',
    body: JSON.stringify({ userIds }),
  })

export const createServer = async (payload, extraHeaders = {}) => {
  const opts = {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { ...extraHeaders },
  }
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    opts.signal = AbortSignal.timeout(960_000)
  }
  return apiRequest('/servers', opts)
}

export const upgradeServer = async (serverId, body, extraHeaders = {}) => {
  const opts = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { ...extraHeaders },
  }
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    opts.signal = AbortSignal.timeout(960_000)
  }
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    return {
      id: Number(serverId),
      name: 'Mock server',
      ip: '127.0.0.1',
      version: '0.99.0-mock',
      serviceStatus: 'running',
      statusLabel: 'Running',
      statusClass: 'running',
    }
  }
  return apiRequest(`/servers/${serverId}/upgrade`, opts)
}

/** Re-probe angelos/sparta/athens on the remote host and update stored runtime statuses. */
export const refreshServerRuntimeStatus = async (serverId) => {
  const opts = { method: 'POST' }
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    opts.signal = AbortSignal.timeout(180_000)
  }
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return {
      id: Number(serverId),
      serviceStatus: 'running',
      l4Status: 'running',
      l7Status: 'running',
    }
  }
  return apiRequest(`/servers/${serverId}/refresh-runtime-status`, opts)
}

/** Regenerate license tier via deploy_license POST /upgrade_license (proxied by Go POST /servers/:id/upgrade-license). */
export const upgradeServerLicense = async (serverId, body, extraHeaders = {}) => {
  const opts = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { ...extraHeaders },
  }
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    opts.signal = AbortSignal.timeout(960_000)
  }
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    return {
      id: Number(serverId),
      name: 'Mock server',
      license: body?.licenseType || 'Trial',
      version: '0.99.0-mock',
      serviceStatus: 'deployed',
      statusLabel: 'Deployed',
      statusClass: 'deployed',
      expiredDate: new Date(Date.now() + 86400000).toISOString(),
    }
  }
  return apiRequest(`/servers/${serverId}/upgrade-license`, opts)
}

export const updateServer = async (serverId, payload) =>
  apiRequest(`/servers/${serverId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteServer = async (serverId) =>
  apiRequest(`/servers/${serverId}`, {
    method: 'DELETE',
  })
