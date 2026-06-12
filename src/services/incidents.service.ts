import { api } from '../lib/api'

export const getIncidents  = (p?: any) => api.get('/incidents', { params: p }).then(r => r.data)
export const getIncident   = (id: string) => api.get(`/incidents/${id}`).then(r => r.data)
export const createIncident = (d: any) => api.post('/incidents', d).then(r => r.data)
export const updateIncident = (id: string, d: any) => api.patch(`/incidents/${id}`, d).then(r => r.data)

export const investigateIncident = (id: string) => api.post(`/incidents/${id}/investigate`).then(r => r.data)
export const resolveIncident     = (id: string, resolution?: string) => api.post(`/incidents/${id}/resolve`, { resolution }).then(r => r.data)
export const closeIncident       = (id: string) => api.post(`/incidents/${id}/close`).then(r => r.data)

export const addIncidentAgent    = (id: string, agentId: string, role?: string) => api.post(`/incidents/${id}/agents`, { agentId, role }).then(r => r.data)
export const removeIncidentAgent = (id: string, agentId: string) => api.post(`/incidents/${id}/agents/${agentId}/remove`).then(r => r.data)

export const INCIDENT_TYPES = [
  { value: 'INTRUSION',     label: "Tentative d'intrusion" },
  { value: 'VOL',           label: 'Vol' },
  { value: 'AGRESSION',     label: 'Agression' },
  { value: 'INCENDIE',      label: 'Incendie' },
  { value: 'VANDALISME',    label: 'Vandalisme' },
  { value: 'MEDICAL',       label: 'Urgence médicale' },
  { value: 'TECHNIQUE',     label: 'Incident technique' },
  { value: 'FAUTE_AGENT',   label: "Faute d'agent" },
  { value: 'FAUSSE_ALERTE', label: 'Fausse alerte' },
  { value: 'AUTRE',         label: 'Autre' },
] as const

export const INCIDENT_SEVERITIES = [
  { value: 'FAIBLE',   label: 'Faible',   color: 'green' },
  { value: 'MOYEN',    label: 'Moyen',    color: 'amber' },
  { value: 'ELEVE',    label: 'Élevé',    color: 'orange' },
  { value: 'CRITIQUE', label: 'Critique', color: 'red'   },
] as const

export const INCIDENT_STATES = [
  { value: 'OUVERT',        label: 'Ouvert',          color: 'red'    },
  { value: 'INVESTIGATION', label: 'En investigation', color: 'amber' },
  { value: 'RESOLU',        label: 'Résolu',          color: 'green'  },
  { value: 'CLOS',          label: 'Clos',            color: 'slate'  },
] as const
