import { apiRequest } from './client'
import { getApiConfig } from './config'

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
  const { useMocks } = await getApiConfig()
  if (useMocks) {
    return mockLogin({ email, password })
  }

  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}
