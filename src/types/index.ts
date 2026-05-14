export type ClientStatus = 'prospect' | 'actif' | 'inactif' | 'suspendu';
export type ContractStatus = 'brouillon' | 'actif' | 'expire' | 'resilie' | 'renouvellement';
export type InvoiceStatus = 'brouillon' | 'envoyee' | 'payee' | 'retard' | 'annulee';
export type AgentStatus = 'actif' | 'inactif' | 'conge' | 'formation';
export type SiteStatus = 'actif' | 'inactif' | 'suspendu';
export type AlertLevel = 'info' | 'warning' | 'danger' | 'success';

export interface Client {
  id: string;
  name: string;
  sector: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: ClientStatus;
  createdAt: string;
  contracts: number;
  totalRevenue: number;
  history: HistoryEntry[];
}

export interface Contract {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
  type: string;
  nbAgents: number;
  startDate: string;
  endDate: string | null;
  monthlyAmount: number;
  status: ContractStatus;
  description: string;
  history: HistoryEntry[];
}

export interface Site {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  address: string;
  city: string;
  district: string;
  agentsDeployed: number;
  contractId: string | null;
  status: SiteStatus;
  riskLevel: 'faible' | 'moyen' | 'eleve';
}

export interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  position: string;
  phone: string;
  email: string;
  siteId: string | null;
  siteName: string | null;
  status: AgentStatus;
  hireDate: string;
  shift: 'jour' | 'nuit' | 'mixte';
  certifications: string[];
}

export interface Invoice {
  id: string;
  reference: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  contractId: string;
  contractRef: string;
  issueDate: string;
  dueDate: string;
  deliveryDate: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  totalAmount: number;
  paidAt: string | null;
  notes: string;
  history: HistoryEntry[];
}

export interface InvoiceLine {
  id: string;
  code: string;
  description: string;
  details: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Operation {
  id: string;
  agentId: string;
  agentName: string;
  siteId: string | null;
  siteName: string | null;
  contractId: string | null;
  date: string;
  checkIn: string;
  checkOut: string | null;
  shift: 'jour' | 'nuit';
  status: 'en_cours' | 'termine' | 'absent' | 'retard';
  notes: string;
}

export interface Notification {
  id: string;
  type: 'invoice_overdue' | 'contract_expiry' | 'new_client' | 'payment' | 'incident' | 'system';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  priority: AlertLevel;
  link?: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  action: string;
  user: string;
  details: string;
  type: 'create' | 'update' | 'status' | 'payment' | 'document' | 'note';
}
