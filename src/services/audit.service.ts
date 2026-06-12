import { api } from '../lib/api'

export const getAuditHistory = (params?: { entity?: string; entityId?: string; page?: number; limit?: number }) =>
  api.get('/audit', { params }).then(r => r.data)

export const getEntityHistory = (entity: string, entityId: string) =>
  api.get(`/audit/${entity}/${entityId}`).then(r => r.data)
