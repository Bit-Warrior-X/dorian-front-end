import { apiRequest } from './client'

const hasApiBaseUrl = Boolean(import.meta.env.VITE_API_BASE_URL)
const USE_MOCKS =
  !hasApiBaseUrl ||
  ['true', '1', 'yes'].includes(
    String(import.meta.env.VITE_USE_MOCKS || '').toLowerCase()
  )

const mockUsers = [
  { email: 'superadmin@gmail.com', password: '123456' },
  { email: 'user@gmail.com', password: '123456' }
]

const mockLogin = async ({ email, password }) => {
  await new Promise((resolve) => setTimeout(resolve, 150))
  const matchedUser = mockUsers.find(
    (user) =>
      user.email.toLowerCase().trim() === email.toLowerCase().trim() &&
      user.password === password
  )

  if (!matchedUser) {
    throw new Error('Invalid email or password. Please try again.')
  }

  return {
    token: 'mock-token',
    user: {
      email: matchedUser.email
    }
  }
}

export const login = async ({ email, password }) => {
  if (USE_MOCKS) {
    return mockLogin({ email, password })
  }

  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}
