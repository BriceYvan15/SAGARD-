import { api } from '../lib/api'

export const sendMessage = (message: string, context?: string) =>
  api.post('/ai/chat', { message, context }).then(r => r.data)
