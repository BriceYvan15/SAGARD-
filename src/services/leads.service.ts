import { api } from '../lib/api'

export const getLeads    = (p?: any) => api.get('/leads', { params: p }).then(r => r.data)
export const getLead     = (id: string) => api.get(`/leads/${id}`).then(r => r.data)
export const createLead  = (d: any) => api.post('/leads', d).then(r => r.data)
export const updateLead  = (id: string, d: any) => api.patch(`/leads/${id}`, d).then(r => r.data)

export const qualifyLead   = (id: string) => api.post(`/leads/${id}/qualify`).then(r => r.data)
export const proposeLead   = (id: string) => api.post(`/leads/${id}/propose`).then(r => r.data)
export const negotiateLead = (id: string) => api.post(`/leads/${id}/negotiate`).then(r => r.data)
export const winLead       = (id: string) => api.post(`/leads/${id}/win`).then(r => r.data)
export const loseLead      = (id: string, reason?: string) => api.post(`/leads/${id}/lose`, { reason }).then(r => r.data)

export const convertLeadToClient = (id: string, d: any) => api.post(`/leads/${id}/convert`, d).then(r => r.data)

export const addLeadActivity   = (id: string, d: any) => api.post(`/leads/${id}/activities`, d).then(r => r.data)
export const getLeadActivities = (id: string) => api.get(`/leads/${id}/activities`).then(r => r.data)
export const getLeadStats      = () => api.get('/leads/stats').then(r => r.data)
export const getCommercialStats = () => api.get('/leads/commercial-stats').then(r => r.data)

export const LEAD_SERVICE_TYPES = [
  { value: 'GARDIENNAGE_STATIQUE',     label: 'Gardiennage statique' },
  { value: 'PATROUILLE_MOBILE',        label: 'Patrouille mobile' },
  { value: 'PROTECTION_RAPPROCHEE',    label: 'Protection rapprochée' },
  { value: 'SECURITE_EVENEMENTIELLE',  label: 'Sécurité événementielle' },
  { value: 'TRANSPORT_FONDS',          label: 'Transport de fonds' },
  { value: 'TELESURVEILLANCE',         label: 'Télésurveillance' },
  { value: 'INSTALLATION_CAMERAS',     label: 'Installation caméras de surveillance' },
  { value: 'CANINE',                   label: 'Sécurité canine' },
  { value: 'MIXTE',                    label: 'Prestation mixte' },
] as const

export const LEAD_STAGES = [
  { value: 'NOUVEAU',     label: 'Nouveau',      color: 'blue'  },
  { value: 'QUALIFIE',    label: 'Qualifié',     color: 'indigo' },
  { value: 'PROPOSITION', label: 'Proposition',  color: 'purple' },
  { value: 'NEGOCIATION', label: 'Négociation',  color: 'amber' },
  { value: 'GAGNE',       label: 'Gagné',        color: 'green' },
  { value: 'PERDU',       label: 'Perdu',        color: 'red'   },
] as const

export const LEAD_SOURCES = [
  { value: 'SITE_WEB',        label: 'Site web' },
  { value: 'APPEL_ENTRANT',   label: 'Appel entrant' },
  { value: 'RECOMMANDATION',  label: 'Recommandation' },
  { value: 'SALON',           label: 'Salon / Événement' },
  { value: 'DEMARCHAGE',      label: 'Démarchage' },
  { value: 'RESEAU_SOCIAL',   label: 'Réseau social' },
  { value: 'PARTENAIRE',      label: 'Partenaire' },
  { value: 'AUTRE',           label: 'Autre' },
] as const

export const LEAD_PRIORITIES = [
  { value: 'BASSE',   label: 'Basse',   color: 'slate' },
  { value: 'NORMALE', label: 'Normale', color: 'blue'  },
  { value: 'HAUTE',   label: 'Haute',   color: 'orange' },
  { value: 'URGENTE', label: 'Urgente', color: 'red'   },
] as const
