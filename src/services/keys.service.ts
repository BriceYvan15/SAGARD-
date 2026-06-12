import { api } from '../lib/api'

export const getKeys      = (p?: any) => api.get('/keys', { params: p }).then(r => r.data)
export const getKey       = (id: string) => api.get(`/keys/${id}`).then(r => r.data)
export const createKey    = (d: any) => api.post('/keys', d).then(r => r.data)
export const updateKey    = (id: string, d: any) => api.patch(`/keys/${id}`, d).then(r => r.data)
export const issueKey     = (id: string, d: any) => api.post(`/keys/${id}/issue`, d).then(r => r.data)
export const returnKey    = (id: string, d?: any) => api.post(`/keys/${id}/return`, d).then(r => r.data)
export const declareKeyLost = (id: string, d?: any) => api.post(`/keys/${id}/lost`, d).then(r => r.data)
export const getKeyMovements = (id: string) => api.get(`/keys/${id}/movements`).then(r => r.data)

export const KEY_TYPES = [
  { value: 'PRINCIPALE', label: 'Clé principale' },
  { value: 'MASTER',     label: 'Pass / Master' },
  { value: 'ARMOIRE',    label: 'Armoire / Coffre' },
  { value: 'VEHICULE',   label: 'Véhicule' },
  { value: 'PORTE',      label: 'Porte' },
  { value: 'PORTAIL',    label: 'Portail' },
  { value: 'AUTRE',      label: 'Autre' },
] as const

export const KEY_STATES = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'green' },
  { value: 'SORTIE',     label: 'Sortie',     color: 'amber' },
  { value: 'PERDUE',     label: 'Perdue',     color: 'red'   },
] as const
