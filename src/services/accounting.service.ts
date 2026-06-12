import { api } from '../lib/api'

export const getAccountingDashboard = (year?: number) =>
  api.get('/accounting/dashboard', { params: year ? { year } : {} }).then(r => r.data)

export const getJournal = (params?: { year?: number; month?: number; type?: string }) =>
  api.get('/accounting/journal', { params }).then(r => r.data)

export const getTreasury = (year?: number) =>
  api.get('/accounting/treasury', { params: year ? { year } : {} }).then(r => r.data)

export const getUnpaidInvoices = () =>
  api.get('/accounting/unpaid-invoices').then(r => r.data)

export const registerPayment = (invoiceId: string, data: { amount?: number; paymentDate?: string; paymentMethod?: string; reference?: string }) =>
  api.post(`/accounting/payments/${invoiceId}`, data).then(r => r.data)

export const recordExpense = (data: { description: string; amount: number; account: string; date?: string; reference?: string; category?: string }) =>
  api.post('/accounting/expenses', data).then(r => r.data)

export const getExpenses = (params?: { year?: number; month?: number }) =>
  api.get('/accounting/expenses', { params }).then(r => r.data)

// Billing Runs (facturation automatique depuis contrats)
export const getBillingRuns = () =>
  api.get('/billing-runs').then(r => r.data)

export const createBillingRun = (data: { period: string; invoiceDate: string; invoicingFrequency?: string }) =>
  api.post('/billing-runs', data).then(r => r.data)

export const previewBillingRun = (id: string) =>
  api.get(`/billing-runs/${id}/preview`).then(r => r.data)

export const generateBillingRun = (id: string) =>
  api.post(`/billing-runs/${id}/generate`).then(r => r.data)

export const cancelBillingRun = (id: string) =>
  api.post(`/billing-runs/${id}/cancel`).then(r => r.data)
