import { api } from '../lib/api'

export const getControls  = (p?: any) => api.get('/controls', { params: p }).then(r => r.data)
export const getControl   = (id: string) => api.get(`/controls/${id}`).then(r => r.data)
export const createControl = (d: any) => api.post('/controls', d).then(r => r.data)
export const updateControl = (id: string, d: any) => api.patch(`/controls/${id}`, d).then(r => r.data)
export const markControlDone     = (id: string) => api.post(`/controls/${id}/done`).then(r => r.data)
export const markControlReported = (id: string) => api.post(`/controls/${id}/reported`).then(r => r.data)
export const cancelControl       = (id: string) => api.post(`/controls/${id}/cancel`).then(r => r.data)

export const CONTROL_VISIT_TYPES = [
  { value: 'ROUTINE',  label: 'Tournée de routine' },
  { value: 'INOPINEE', label: 'Visite inopinée' },
  { value: 'ALERTE',   label: 'Suite à alerte' },
  { value: 'RELEVE',   label: 'Relève de poste' },
  { value: 'ESCORTE',  label: 'Escorte' },
] as const

export const CONTROL_VISIT_STATES = [
  { value: 'BROUILLON',  label: 'Brouillon',  color: 'gray'  },
  { value: 'EFFECTUEE',  label: 'Effectuée',  color: 'green' },
  { value: 'REPORTEE',   label: 'Reportée',   color: 'amber' },
  { value: 'ANNULEE',    label: 'Annulée',    color: 'red'   },
] as const
