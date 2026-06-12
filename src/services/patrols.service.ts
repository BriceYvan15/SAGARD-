import { api } from '../lib/api'

// Rondes (PatrolRound) — équivalent Odoo sagard.patrol.round / .check
export const getPatrols   = (p?: any) => api.get('/patrols', { params: p }).then(r => r.data)
export const getPatrol    = (id: string) => api.get(`/patrols/${id}`).then(r => r.data)
export const startPatrol  = (body: { siteId: string; agentId: string; notes?: string }) =>
  api.post('/patrols/start', body).then(r => r.data)
export const scanPatrol   = (id: string, body: any) => api.post(`/patrols/${id}/scan`, body).then(r => r.data)
export const completePatrol = (id: string) => api.post(`/patrols/${id}/complete`).then(r => r.data)
export const abortPatrol  = (id: string) => api.post(`/patrols/${id}/abort`).then(r => r.data)

export const PATROL_STATES = [
  { value: 'EN_COURS',    label: 'En cours',    color: 'blue'  },
  { value: 'TERMINEE',    label: 'Terminée',    color: 'green' },
  { value: 'INCOMPLETE',  label: 'Incomplète',  color: 'amber' },
  { value: 'INTERROMPUE', label: 'Interrompue', color: 'red'   },
] as const
