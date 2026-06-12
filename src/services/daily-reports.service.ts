import { api } from '../lib/api'

export const getDailyReports  = (p?: any) => api.get('/daily-reports', { params: p }).then(r => r.data)
export const getDailyReport   = (id: string) => api.get(`/daily-reports/${id}`).then(r => r.data)
export const createDailyReport = (d: any) => api.post('/daily-reports', d).then(r => r.data)
export const updateDailyReport = (id: string, d: any) => api.patch(`/daily-reports/${id}`, d).then(r => r.data)

export const addReportAgent    = (id: string, agentId: string) => api.post(`/daily-reports/${id}/agents`, { agentId }).then(r => r.data)
export const removeReportAgent = (id: string, agentId: string) => api.post(`/daily-reports/${id}/agents/${agentId}/remove`).then(r => r.data)

export const submitReport   = (id: string) => api.post(`/daily-reports/${id}/submit`).then(r => r.data)
export const validateReport = (id: string) => api.post(`/daily-reports/${id}/validate`).then(r => r.data)
export const rejectReport   = (id: string) => api.post(`/daily-reports/${id}/reject`).then(r => r.data)
export const resetReport    = (id: string) => api.post(`/daily-reports/${id}/reset`).then(r => r.data)

export const REPORT_SHIFTS = [
  { value: 'JOUR', label: 'Jour' },
  { value: 'NUIT', label: 'Nuit' },
  { value: 'FULL', label: '24h' },
] as const

export const REPORT_STATES = [
  { value: 'BROUILLON', label: 'Brouillon', color: 'gray'   },
  { value: 'SOUMIS',    label: 'Soumis',    color: 'blue'   },
  { value: 'VALIDE',    label: 'Validé',    color: 'green'  },
  { value: 'REJETE',    label: 'Rejeté',    color: 'red'    },
] as const

export const WEATHER_OPTIONS = [
  { value: 'DEGAGE',     label: 'Dégagé ☀️' },
  { value: 'NUAGEUX',    label: 'Nuageux ☁️' },
  { value: 'PLUVIEUX',   label: 'Pluvieux 🌧️' },
  { value: 'ORAGEUX',    label: 'Orageux ⛈️' },
  { value: 'BROUILLARD', label: 'Brouillard 🌫️' },
] as const
