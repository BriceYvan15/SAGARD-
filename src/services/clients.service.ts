import { api } from '../lib/api'

export const getClients      = (p?: { status?: string; search?: string }) => api.get('/clients', { params: p }).then(r => r.data)
export const getClient       = (id: string) => api.get(`/clients/${id}`).then(r => r.data)
export const getClientStats  = (id: string) => api.get(`/clients/${id}/stats`).then(r => r.data)
export const createClient    = (d: any) => api.post('/clients', d).then(r => r.data)
export const updateClient    = (id: string, d: any) => api.patch(`/clients/${id}`, d).then(r => r.data)
export const deleteClient    = (id: string) => api.delete(`/clients/${id}`).then(r => r.data)
export const getComplaints   = (id: string) => api.get(`/clients/${id}/complaints`).then(r => r.data)
export const createComplaint = (id: string, d: any) => api.post(`/clients/${id}/complaints`, d).then(r => r.data)

export const downloadClientPdf = async (id: string, name: string) => {
  const res = await api.get(`/clients/${id}/pdf`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `fiche_${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
