import { apiRequest } from './client'
import { getApiConfig } from './config'

const mockUsers = [
  {
    email: 'superadmin@gmail.com',
    password: '123456',
    role: 'Admin',
    name: 'Super Admin',
    status: 'Active',
    id: 1,
  },
  {
    email: 'user@gmail.com',
    password: '123456',
    role: 'User',
    name: 'User',
    status: 'Active',
    id: 2,
  }
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

  if (matchedUser.status === 'Block') {
    throw new Error('Your account is blocked. Please contact an administrator.')
  }

  if (matchedUser.status === 'Waiting') {
    throw new Error('Please wait while admin accept your login.')
  }

  return {
    token: 'mock-token',
    user: {
      id: matchedUser.id,
      email: matchedUser.email,
      role: matchedUser.role,
      name: matchedUser.name
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
