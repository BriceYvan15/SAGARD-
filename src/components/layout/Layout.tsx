import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const titles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Tableau de bord', subtitle: 'Vue générale de votre activité' },
  '/clients':     { title: 'Clients & CRM', subtitle: 'Gestion des prospects et clients actifs' },
  '/contrats':    { title: 'Contrats', subtitle: 'Suivi des contrats de prestation' },
  '/sites':       { title: 'Sites gardiennés', subtitle: 'Tous les sites sous surveillance' },
  '/agents':      { title: 'Agents', subtitle: 'Gestion du personnel opérationnel' },
  '/operations':  { title: 'Opérations', subtitle: 'Pointages et déploiements du jour' },
  '/facturation': { title: 'Facturation', subtitle: 'Factures, relances et paiements' },
}

export default function Layout() {
  const loc = useLocation()
  const base = '/' + loc.pathname.split('/')[1]
  const { title, subtitle } = titles[base] ?? { title: 'SAGARD ERP', subtitle: '' }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
