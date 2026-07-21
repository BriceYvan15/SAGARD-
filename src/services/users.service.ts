import { api } from '../lib/api'

export const getUsers      = (p?: any) => api.get('/users', { params: p }).then(r => r.data)
export const getUserById   = (id: string) => api.get(`/users/${id}`).then(r => r.data)
export const createUser    = (d: any) => api.post('/users', d).then(r => r.data)
export const suspendUser   = (id: string) => api.patch(`/users/${id}/suspend`).then(r => r.data)
export const activateUser  = (id: string) => api.patch(`/users/${id}/activate`).then(r => r.data)
export const updateUser    = (id: string, d: any) => api.patch(`/users/${id}`, d).then(r => r.data)
