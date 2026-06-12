import { api } from '../lib/api'

export const getVisitors   = (p?: any) => api.get('/visitors', { params: p }).then(r => r.data)
export const getVisitor    = (id: string) => api.get(`/visitors/${id}`).then(r => r.data)
export const createVisitor = (d: any) => api.post('/visitors', d).then(r => r.data)
export const checkOutVisitor = (id: string) => api.post(`/visitors/${id}/checkout`).then(r => r.data)
export const updateVisitor = (id: string, d: any) => api.patch(`/visitors/${id}`, d).then(r => r.data)

export const getBlacklist      = (p?: any) => api.get('/visitors/blacklist', { params: p }).then(r => r.data)
export const addToBlacklist    = (d: any) => api.post('/visitors/blacklist', d).then(r => r.data)
export const removeFromBlacklist = (id: string) => api.post(`/visitors/blacklist/${id}/remove`).then(r => r.data)

export const VISIT_PURPOSES = [
  { value: 'REUNION',      label: 'Réunion / RDV' },
  { value: 'LIVRAISON',    label: 'Livraison' },
  { value: 'MAINTENANCE',  label: 'Maintenance / Travaux' },
  { value: 'CLIENT',       label: 'Client' },
  { value: 'FAMILLE',      label: 'Famille / Personnel' },
  { value: 'CANDIDATURE',  label: 'Candidature / Postulant' },
  { value: 'ENTRETIEN',    label: 'Entretien d\'embauche' },
  { value: 'AUTRE',        label: 'Autre' },
] as const

export const ID_DOC_TYPES = [
  { value: 'CNI',      label: 'CNI' },
  { value: 'PASSEPORT', label: 'Passeport' },
  { value: 'PERMIS',   label: 'Permis de conduire' },
  { value: 'BADGE',    label: 'Badge entreprise' },
  { value: 'AUTRE',    label: 'Autre' },
] as const
