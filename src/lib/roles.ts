import { getUser } from './auth'

// Roles hierarchy
export const ROLES = {
  DG: 'DIRECTEUR_GENERAL',
  COMMERCIAL: 'COMMERCIAL',
  COMPTABLE: 'COMPTABLE',
  RH: 'RH',
  CHEF_OPS: 'CHEF_OPERATIONS',
  CONTROLEUR: 'CONTROLEUR',
} as const

// What each role can access
// COMMERCIAL : prospection, devis/proforma, clients
// COMPTABLE  : contrats, factures définitives, suivi docs commerciaux des commerciaux, alertes
// DG         : tout
const ROLE_PERMISSIONS: Record<string, string[]> = {
  DIRECTEUR_GENERAL: ['*'],
  COMMERCIAL: [
    'prospects',               // CRM prospects
    'documents-commerciaux',   // Créer/gérer devis & proformas
    'clients',                 // Voir ses clients
  ],
  COMPTABLE: [
    'dashboard',               // Tableau de bord
    'contrats',                // Créer/gérer contrats à partir des devis acceptés
    'facturation',             // Factures définitives + lots de facturation
    'comptabilite',            // Journal comptable, trésorerie, dashboard financier
    'documents-commerciaux',   // Voir les devis/proformas des commerciaux (lecture)
    'clients',                 // Voir les clients
    'alertes-commerciales',    // Tableau de bord alertes
  ],
  RH: ['rh', 'agents', 'utilisateurs', 'audit'],
  CHEF_OPERATIONS: ['operations', 'sites', 'agents', 'supervision', 'registres', 'accueil', 'audit'],
  CONTROLEUR: ['operations', 'supervision'],
  TECHNICIENNE_SURFACE: [],
  AGENT_ACCUEIL: ['accueil', 'stock'],
  AGENT_TERRAIN: [],
  CLIENT: [],
}

// Pages visible only by DG (not commercials)
export const DG_ONLY_PAGES = ['alertes-commerciales']

// Pages accessible to everyone (except commercial for dashboard)
const PUBLIC_PAGES = ['ia']

export function hasAccess(page: string): boolean {
  if (PUBLIC_PAGES.includes(page)) return true
  const user = getUser()
  if (!user) return false
  const perms = ROLE_PERMISSIONS[user.role] ?? []
  if (perms.includes('*')) return true
  return perms.includes(page)
}

export function isDG(): boolean {
  return getUser()?.role === 'DIRECTEUR_GENERAL'
}

export function isCommercial(): boolean {
  return getUser()?.role === 'COMMERCIAL'
}

export function currentUserId(): string | null {
  return getUser()?.id ?? null
}
