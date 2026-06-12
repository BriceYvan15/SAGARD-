import { api } from '../lib/api'

export const getInvoices     = (p?: any) => api.get('/invoices', { params: p }).then(r => r.data)
export const getInvoice      = (id: string) => api.get(`/invoices/${id}`).then(r => r.data)
export const createInvoice   = (d: any) => api.post('/invoices', d).then(r => r.data)
export const payInvoice      = (id: string, d: any) => api.post(`/invoices/${id}/pay`, d).then(r => r.data)
export const updateInvoiceStatus = (id: string, status: string) => api.patch(`/invoices/${id}/status`, { status }).then(r => r.data)
export const markOverdue     = () => api.post('/invoices/mark-overdue').then(r => r.data)
export const genMonthly      = () => api.post('/invoices/generate-monthly').then(r => r.data)
export const getServiceCatalog = () => api.get('/invoices/service-catalog').then(r => r.data)
