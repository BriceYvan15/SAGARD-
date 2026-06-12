import axios from 'axios'

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  const host = window.location.hostname
  return `http://${host}:3001/api/v1`
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sagard_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    const isLoginRequest = err.config?.url?.includes('/auth/login')
    const isAlreadyOnLogin = window.location.pathname === '/login'
    if (err.response?.status === 401 && !isLoginRequest && !isAlreadyOnLogin) {
      localStorage.removeItem('sagard_token')
      localStorage.removeItem('sagard_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)
