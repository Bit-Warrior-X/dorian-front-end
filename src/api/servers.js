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

export const updateServerUsers = async (serverId, userIds) =>
  apiRequest(`/servers/${serverId}/users`, {
    method: 'PUT',
    body: JSON.stringify({ userIds }),
  })
