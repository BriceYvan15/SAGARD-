import { api } from '../lib/api'

export const getAgents          = (p?: any) => api.get('/agents', { params: p }).then(r => r.data)
export const getAgent           = (id: string) => api.get(`/agents/${id}`).then(r => r.data)
export const createAgent        = (d: any) => api.post('/agents', d).then(r => r.data)
export const createAgentWithUser = (d: any) => api.post('/agents/with-user', d).then(r => r.data)
export const updateAgent        = (id: string, d: any) => api.patch(`/agents/${id}`, d).then(r => r.data)
export const deleteAgent        = (id: string) => api.delete(`/agents/${id}`).then(r => r.data)
export const assignEquipment    = (id: string, equipmentId: string) => api.post(`/agents/${id}/equipments`, { equipmentId }).then(r => r.data)
