import { api } from '../lib/api'

export const getContracts        = (p?: any) => api.get('/contracts', { params: p }).then(r => r.data)
export const getContract         = (id: string) => api.get(`/contracts/${id}`).then(r => r.data)
export const createContract      = (d: any) => api.post('/contracts', d).then(r => r.data)
export const updateContract      = (id: string, d: any) => api.patch(`/contracts/${id}`, d).then(r => r.data)
export const renewContract       = (id: string, d: any) => api.post(`/contracts/${id}/renew`, d).then(r => r.data)
export const getExpiringContracts= () => api.get('/contracts/expiring').then(r => r.data)

// Transitions de workflow (Odoo)
export const contractToQuotation = (id: string) => api.post(`/contracts/${id}/quotation`).then(r => r.data)
export const contractToProforma  = (id: string) => api.post(`/contracts/${id}/proforma`).then(r => r.data)
export const contractConfirm     = (id: string) => api.post(`/contracts/${id}/confirm`).then(r => r.data)
export const contractActivate    = (id: string) => api.post(`/contracts/${id}/activate`).then(r => r.data)
export const contractSuspend     = (id: string) => api.post(`/contracts/${id}/suspend`).then(r => r.data)
export const contractTerminate   = (id: string) => api.post(`/contracts/${id}/terminate`).then(r => r.data)

// Génération de documents commerciaux
export const contractCreateQuotation = (id: string) => api.post(`/contracts/${id}/create-quotation`).then(r => r.data)
export const contractCreateInvoice   = (id: string) => api.post(`/contracts/${id}/create-invoice`).then(r => r.data)
