import { api } from '../lib/api'

export const getBillingRuns       = () => api.get('/billing-runs').then(r => r.data)
export const getBillingRun        = (id: string) => api.get(`/billing-runs/${id}`).then(r => r.data)
export const createBillingRun     = (d: any) => api.post('/billing-runs', d).then(r => r.data)
export const previewBillingRun    = (id: string) => api.get(`/billing-runs/${id}/preview`).then(r => r.data)
export const generateBillingRun   = (id: string) => api.post(`/billing-runs/${id}/generate`).then(r => r.data)
export const cancelBillingRun     = (id: string) => api.post(`/billing-runs/${id}/cancel`).then(r => r.data)
