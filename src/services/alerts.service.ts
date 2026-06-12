import { api } from '../lib/api'

export const getAlerts  = (p?: any) => api.get('/alerts', { params: p }).then(r => r.data)
export const getAlert   = (id: string) => api.get(`/alerts/${id}`).then(r => r.data)
export const createAlert = (d: any) => api.post('/alerts', d).then(r => r.data)

export const acknowledgeAlert  = (id: string) => api.post(`/alerts/${id}/acknowledge`).then(r => r.data)
export const interventionAlert = (id: string) => api.post(`/alerts/${id}/intervention`).then(r => r.data)
export const resolveAlert      = (id: string) => api.post(`/alerts/${id}/resolve`).then(r => r.data)
export const markFalseAlert    = (id: string) => api.post(`/alerts/${id}/false`).then(r => r.data)
export const convertToIncident = (id: string) => api.post(`/alerts/${id}/convert`).then(r => r.data)

export const ALERT_TYPES = [
  { value: 'SOS',        label: 'SOS — Agression' },
  { value: 'INTRUSION',  label: 'Intrusion' },
  { value: 'INCENDIE',   label: 'Incendie' },
  { value: 'MEDICAL',    label: 'Urgence médicale' },
  { value: 'RENFORT',    label: 'Demande de renfort' },
  { value: 'TECHNIQUE',  label: 'Problème technique' },
  { value: 'TEST',       label: 'Test' },
] as const

export const ALERT_SEVERITIES = [
  { value: 'INFO',     label: 'Information',   color: 'blue'  },
  { value: 'WARNING',  label: 'Avertissement', color: 'amber' },
  { value: 'CRITIQUE', label: 'Critique',      color: 'red'   },
] as const

export const ALERT_STATES = [
  { value: 'NOUVELLE',        label: 'Nouvelle',          color: 'red'   },
  { value: 'PRISE_EN_COMPTE', label: 'Prise en compte',  color: 'amber' },
  { value: 'INTERVENTION',    label: 'Intervention',      color: 'blue'  },
  { value: 'RESOLUE',         label: 'Résolue',           color: 'green' },
  { value: 'FAUSSE',          label: 'Fausse alerte',     color: 'slate' },
] as const
