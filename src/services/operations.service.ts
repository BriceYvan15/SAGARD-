import { api } from '../lib/api'

// Pointages
export const getTodayPointages  = (p?: any) => api.get('/pointages/today', { params: p }).then(r => r.data)
export const getPointagesByDate = (date: string, p?: any) => api.get('/pointages/by-date', { params: { date, ...p } }).then(r => r.data)
export const getPointagesRange  = (start: string, end: string, p?: any) => api.get('/pointages/range', { params: { start, end, ...p } }).then(r => r.data)
export const getDailyReport     = (date: string, siteId?: string) => api.get('/pointages/report', { params: { date, siteId } }).then(r => r.data)
export const getAgentPointages  = (agentId: string, start: string, end: string) => api.get(`/pointages/agent/${agentId}`, { params: { start, end } }).then(r => r.data)

// Déploiements
export const getDeployments     = (p?: any) => api.get('/deployments', { params: p }).then(r => r.data)
export const createDeployment   = (d: any) => api.post('/deployments', d).then(r => r.data)
export const activateDeployment = (id: string) => api.post(`/deployments/${id}/activate`).then(r => r.data)
export const endDeployment      = (id: string) => api.post(`/deployments/${id}/end`).then(r => r.data)
export const replaceDeployment  = (id: string, d: any) => api.post(`/deployments/${id}/replace`, d).then(r => r.data)
export const transferDeployment = (id: string, d: any) => api.post(`/deployments/${id}/transfer`, d).then(r => r.data)

// Mutations / Transferts
export const getTransfers       = (p?: any) => api.get('/transfers', { params: p }).then(r => r.data)
export const getAgentTransfers  = (agentId: string) => api.get(`/transfers/agent/${agentId}`).then(r => r.data)

// Incidents
export const getIncidents       = (p?: any) => api.get('/incidents', { params: p }).then(r => r.data)
export const createIncident     = (d: any) => api.post('/incidents', d).then(r => r.data)
export const resolveIncident    = (id: string, resolution?: string) => api.post(`/incidents/${id}/resolve`, { resolution }).then(r => r.data)
export const closeIncident      = (id: string) => api.post(`/incidents/${id}/close`).then(r => r.data)

// Rapports journaliers
export const getDailyReports    = (p?: any) => api.get('/daily-reports', { params: p }).then(r => r.data)
export const createDailyReport  = (d: any) => api.post('/daily-reports', d).then(r => r.data)
export const submitDailyReport  = (id: string) => api.post(`/daily-reports/${id}/submit`).then(r => r.data)
export const validateDailyReport = (id: string) => api.post(`/daily-reports/${id}/validate`).then(r => r.data)
