import { api } from '../lib/api'

export const getSiteEquipments  = (p?: any) => api.get('/site-equipment', { params: p }).then(r => r.data)
export const getSiteEquipment   = (id: string) => api.get(`/site-equipment/${id}`).then(r => r.data)
export const createSiteEquipment = (d: any) => api.post('/site-equipment', d).then(r => r.data)
export const updateSiteEquipment = (id: string, d: any) => api.patch(`/site-equipment/${id}`, d).then(r => r.data)
export const assignEquipment    = (id: string, d: any) => api.post(`/site-equipment/${id}/assign`, d).then(r => r.data)
export const returnEquipment    = (id: string, d?: any) => api.post(`/site-equipment/${id}/return`, d).then(r => r.data)
export const maintenanceEquipment = (id: string, d?: any) => api.post(`/site-equipment/${id}/maintenance`, d).then(r => r.data)
export const declareEquipmentLost = (id: string, d?: any) => api.post(`/site-equipment/${id}/lost`, d).then(r => r.data)
export const getEquipmentMovements = (id: string) => api.get(`/site-equipment/${id}/movements`).then(r => r.data)

export const EQUIPMENT_CATEGORIES = [
  { value: 'TENUE',              label: 'Tenue / Uniforme' },
  { value: 'ARME_FEU',          label: 'Arme à feu' },
  { value: 'ARME_NON_LETALE',   label: 'Arme non létale' },
  { value: 'RADIO',             label: 'Radio / Talkie' },
  { value: 'DETECTEUR',         label: 'Détecteur métaux' },
  { value: 'LAMPE',             label: 'Lampe torche' },
  { value: 'PROTECTION',        label: 'Protection (gilet, casque)' },
  { value: 'TELEPHONE',         label: 'Téléphone' },
  { value: 'CANIN',             label: 'Matériel canin' },
  { value: 'CLE',               label: 'Clé / Trousseau' },
  { value: 'ACCESSOIRE_VEHICULE', label: 'Accessoire véhicule' },
  { value: 'AUTRE',             label: 'Autre' },
] as const

export const EQUIPMENT_STATES = [
  { value: 'EN_STOCK',       label: 'En stock',       color: 'green' },
  { value: 'ATTRIBUE',       label: 'Attribué',       color: 'blue'  },
  { value: 'EN_MAINTENANCE', label: 'En maintenance', color: 'amber' },
  { value: 'PERDU',          label: 'Perdu',          color: 'red'   },
  { value: 'ENDOMMAGE',      label: 'Endommagé',      color: 'orange' },
  { value: 'REFORME',        label: 'Réformé',        color: 'slate' },
] as const
