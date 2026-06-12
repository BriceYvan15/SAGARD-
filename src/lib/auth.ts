export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  photoUrl?: string
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('sagard_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function getToken(): string | null {
  return localStorage.getItem('sagard_token')
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem('sagard_token', token)
  localStorage.setItem('sagard_user', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('sagard_token')
  localStorage.removeItem('sagard_user')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export const ROLE_LABELS: Record<string, string> = {
  DIRECTEUR_GENERAL:    'Directeur Général',
  COMMERCIAL:           'Commercial',
  COMPTABLE:            'Comptable',
  RH:                   'Ressources Humaines',
  CHEF_OPERATIONS:      'Chef Opérations',
  CONTROLEUR:           'Contrôleur',
  TECHNICIENNE_SURFACE: 'Technicienne Surface',
  AGENT_ACCUEIL:        'Agent Accueil',
  AGENT_TERRAIN:        'Agent Terrain',
  CLIENT:               'Client',
}
