import { api } from '../lib/api'

export const getSites    = (p?: any) => api.get('/sites', { params: p }).then(r => r.data)
export const getSite     = (id: string) => api.get(`/sites/${id}`).then(r => r.data)
export const createSite  = (d: any) => api.post('/sites', d).then(r => r.data)
export const updateSite  = (id: string, d: any) => api.patch(`/sites/${id}`, d).then(r => r.data)
export const deleteSite  = (id: string) => api.delete(`/sites/${id}`).then(r => r.data)

// Affectations d'agents (raccourcis depuis la fiche site)
export const assignAgentToSite = (siteId: string, body: any) =>
  api.post(`/sites/${siteId}/agents`, body).then(r => r.data)
export const removeAgentFromSite = (siteId: string, agentId: string) =>
  api.post(`/sites/${siteId}/agents/${agentId}/remove`).then(r => r.data)

// Points de contrôle (QR) — sagard.patrol.point
export const listPatrolPoints = (siteId: string) =>
  api.get(`/sites/${siteId}/patrol-points`).then(r => r.data)
export const addPatrolPoint = (siteId: string, body: any) =>
  api.post(`/sites/${siteId}/patrol-points`, body).then(r => r.data)
export const disablePatrolPoint = (pointId: string) =>
  api.patch(`/sites/patrol-points/${pointId}/disable`).then(r => r.data)

// Pointages du jour pour un site
export const getSiteTodayPointages = (siteId: string) =>
  api.get(`/sites/${siteId}/pointages/today`).then(r => r.data)

