import { api } from '../lib/api'

export const getSettings = () => api.get('/settings').then(r => r.data)
export const updateSettings = (d: any) => api.put('/settings', d).then(r => r.data)

export const backupDatabase = async () => {
  const res = await api.post('/settings/backup', {}, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  const disposition = res.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  a.download = match ? match[1] : `sagard-backup-${new Date().toISOString().slice(0, 10)}.sql`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
