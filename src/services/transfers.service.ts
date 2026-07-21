import { api } from '../lib/api'

// AgentTransfer — mutations d'agents entre sites
export const getTransfers       = (p?: { agentId?: string; fromSiteId?: string; toSiteId?: string }) =>
  api.get('/transfers', { params: p }).then(r => r.data)

export const getAgentTransfers  = (agentId: string) =>
  api.get(`/transfers/agent/${agentId}`).then(r => r.data)

export const transferDeployment = (deploymentId: string, body: { toSiteId: string; motif: string; transferDate?: string }) =>
  api.post(`/deployments/${deploymentId}/transfer`, body).then(r => r.data)
