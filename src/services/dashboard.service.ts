import { api } from '../lib/api'

export const getDashboardStats = () => api.get('/dashboard/stats').then(r => r.data)
