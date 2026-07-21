import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

type SidebarMode = 'pinned' | 'hover'

const titles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Tableau de bord', subtitle: 'Vue générale de votre activité' },
  '/clients':     { title: 'Clients & CRM', subtitle: 'Gestion des prospects et clients actifs' },
  '/prospects':   { title: 'Prospects', subtitle: 'Pipeline commercial et opportunités' },
  '/contrats':    { title: 'Contrats', subtitle: 'Suivi des contrats de prestation' },
  '/sites':       { title: 'Sites gardiennés', subtitle: 'Tous les sites sous surveillance' },
  '/agents':      { title: 'Agents', subtitle: 'Gestion du personnel opérationnel' },
  '/operations':  { title: 'Opérations', subtitle: 'Pointages et déploiements du jour' },
  '/supervision': { title: 'Supervision', subtitle: 'Tableau de bord des opérations — alertes, incidents, visites et rapports' },
  '/registres':   { title: 'Registres site', subtitle: 'Visiteurs, clés et matériel de sécurité' },
  '/facturation': { title: 'Facturation', subtitle: 'Factures, relances et paiements' },
  '/rh':          { title: 'Ressources Humaines', subtitle: 'Paie, congés et formations' },
  '/stock':       { title: 'Stock & Véhicules', subtitle: 'Équipements, véhicules et carburant' },
  '/ia':          { title: 'Assistant IA', subtitle: 'Intelligence artificielle SAGARD' },
  '/utilisateurs':{ title: 'Utilisateurs', subtitle: 'Gestion des comptes et des r\u00f4les' },
  '/comptabilite':{ title: 'Comptabilité', subtitle: 'Tableau de bord financier, journal et trésorerie' },
  '/audit':       { title: 'Journal des modifications', subtitle: 'Traçabilité des actions (créations, modifications, suppressions)' },
  '/parametres':  { title: 'Paramètres', subtitle: 'Configuration du système' },
  '/accueil':     { title: 'Accueil & R\u00e9ception', subtitle: 'Registre des visites et enregistrement des postulants' },
}

export default function Layout() {
  const loc = useLocation()
  const base = '/' + loc.pathname.split('/')[1]
  const { title, subtitle } = titles[base] ?? { title: 'SAGARD ERP', subtitle: '' }
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    const saved = localStorage.getItem('sidebarMode')
    return saved === 'hover' ? 'hover' : 'pinned'
  })

  const toggleSidebarMode = () => {
    setSidebarMode(prev => {
      const next = prev === 'pinned' ? 'hover' : 'pinned'
      localStorage.setItem('sidebarMode', next)
      return next
    })
  }

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [loc.pathname])

  return (
    <div className="flex min-h-screen print:block" style={{ background: '#f5f5f7' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden no-print"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer, hidden on mobile via translate */}
      <div className={`no-print fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar mode={sidebarMode} onToggleMode={toggleSidebarMode} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className={`flex-1 flex flex-col min-h-screen print:ml-0 transition-all duration-300 ${sidebarMode === 'pinned' ? 'lg:ml-60' : 'lg:ml-[60px]'}`}>
        <div className="no-print">
          <Header title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 p-4 sm:p-5 lg:p-6 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
