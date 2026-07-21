import { api } from '../lib/api'

export const getInvoices     = (p?: any) => api.get('/invoices', { params: p }).then(r => r.data)
export const getInvoice      = (id: string) => api.get(`/invoices/${id}`).then(r => r.data)
export const createInvoice   = (d: any) => api.post('/invoices', d).then(r => r.data)
export const payInvoice      = (id: string, d: any) => api.post(`/invoices/${id}/pay`, d).then(r => r.data)
export const updateInvoiceStatus = (id: string, status: string) => api.patch(`/invoices/${id}/status`, { status }).then(r => r.data)
export const deleteInvoice   = (id: string) => api.delete(`/invoices/${id}`).then(r => r.data)
export const updateInvoice   = (id: string, d: any) => api.patch(`/invoices/${id}`, d).then(r => r.data)
export const markOverdue     = () => api.post('/invoices/check-overdue').then(r => r.data)
export const genMonthly      = () => api.post('/invoices/generate-monthly').then(r => r.data)
export const getServiceCatalog = () => api.get('/invoices/service-catalog').then(r => r.data)
export const createCatalogItem = (d: { code: string; description: string; unitPrice?: number }) => api.post('/invoices/service-catalog', d).then(r => r.data)
export const updateCatalogItem = (id: string, d: { description?: string; unitPrice?: number; isActive?: boolean }) => api.patch(`/invoices/service-catalog/${id}`, d).then(r => r.data)
export const deleteCatalogItem = (id: string) => api.delete(`/invoices/service-catalog/${id}`).then(r => r.data)
export const resetCatalog      = () => api.post('/invoices/service-catalog/reset').then(r => r.data)
export const sendInvoiceEmail = (id: string) => api.post(`/invoices/${id}/send-email`).then(r => r.data)

export const downloadInvoicePdf = async (id: string) => {
  const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  const disposition = res.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  a.download = match ? match[1] : `facture-${id}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export const sendInvoiceEmailWithAttachment = (id: string, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/invoices/${id}/send-email-with-attachment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

