import { api } from '../lib/api'
import { setAuth, clearAuth, AuthUser } from '../lib/auth'

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/login', { email, password })
  setAuth(data.token, data.user)
  return data.user
}

export function logout() {
  clearAuth()
  window.location.href = '/login'
}
