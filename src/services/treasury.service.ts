import { api } from '../lib/api'

export const getTreasuryAccounts     = () => api.get('/treasury/accounts').then(r => r.data)
export const getTreasuryAccount      = (id: string) => api.get(`/treasury/accounts/${id}`).then(r => r.data)
export const createTreasuryAccount   = (d: any) => api.post('/treasury/accounts', d).then(r => r.data)
export const updateTreasuryAccount   = (id: string, d: any) => api.patch(`/treasury/accounts/${id}`, d).then(r => r.data)
export const debitTreasuryAccount    = (id: string, d: { amount: number; description?: string; reference?: string }) => api.post(`/treasury/accounts/${id}/debit`, d).then(r => r.data)
export const creditTreasuryAccount   = (id: string, d: { amount: number; description?: string; reference?: string }) => api.post(`/treasury/accounts/${id}/credit`, d).then(r => r.data)
export const transferTreasury        = (d: { fromId: string; toId: string; amount: number; description?: string }) => api.post('/treasury/transfer', d).then(r => r.data)
export const getTreasuryTransactions = (accountId?: string, limit?: number) => api.get('/treasury/transactions', { params: { accountId, limit } }).then(r => r.data)
export const seedTreasuryAccounts    = () => api.post('/treasury/seed').then(r => r.data)
