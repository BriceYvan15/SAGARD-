import { api } from '../lib/api'

// AgentDeployment — équivalent Odoo sagard.deployment
export const getDeployments   = (p?: any) => api.get('/deployments', { params: p }).then(r => r.data)
export const getDeployment    = (id: string) => api.get(`/deployments/${id}`).then(r => r.data)
export const createDeployment = (d: any) => api.post('/deployments', d).then(r => r.data)
export const updateDeployment = (id: string, d: any) => api.patch(`/deployments/${id}`, d).then(r => r.data)

// Transitions workflow
export const activateDeployment = (id: string) => api.post(`/deployments/${id}/activate`).then(r => r.data)
export const endDeployment      = (id: string) => api.post(`/deployments/${id}/end`).then(r => r.data)
export const replaceDeployment  = (id: string, body: { replacementAgentId: string; startDate?: string }) =>
  api.post(`/deployments/${id}/replace`, body).then(r => r.data)

export const transferDeployment = (id: string, body: { toSiteId: string; motif: string; transferDate?: string }) =>
  api.post(`/deployments/${id}/transfer`, body).then(r => r.data)

// Helpers UI
export const DEPLOYMENT_ROLES = [
  { value: 'AGENT',                  label: 'Agent de sécurité' },
  { value: 'CHEF_POSTE',             label: 'Chef de poste' },
  { value: 'SUPERVISEUR',            label: 'Superviseur' },
  { value: 'CONTROLEUR',             label: 'Contrôleur' },
  { value: 'MAITRE_CHIEN',           label: 'Maître-chien' },
  { value: 'PROTECTION_RAPPROCHEE',  label: 'Protection rapprochée' },
] as const

export const DEPLOYMENT_SHIFTS = [
  { value: 'JOUR', label: 'Jour (06h-18h)' },
  { value: 'NUIT', label: 'Nuit (18h-06h)' },
  { value: 'FULL', label: '24h / 24h' },
] as const

export const DEPLOYMENT_STATES = [
  { value: 'BROUILLON', label: 'Brouillon',  color: 'gray'   },
  { value: 'ACTIF',     label: 'Actif',      color: 'green'  },
  { value: 'REMPLACE',  label: 'Remplacé',   color: 'amber'  },
  { value: 'TERMINE',   label: 'Terminé',    color: 'slate'  },
] as const
