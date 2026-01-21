import { apiRequest } from './client'
import { serverList } from '@/data/servers'

const hasApiBaseUrl = Boolean(import.meta.env.VITE_API_BASE_URL)
const USE_MOCKS =
  !hasApiBaseUrl ||
  ['true', '1', 'yes'].includes(
    String(import.meta.env.VITE_USE_MOCKS || '').toLowerCase()
  )

export const fetchServers = async () => {
  if (USE_MOCKS) {
    return serverList.map((server) => ({ ...server }))
  }

  return apiRequest('/servers')
}
