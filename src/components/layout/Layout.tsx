import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const titles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':   { title: 'Tableau de bord', subtitle: 'Vue générale de votre activité' },
  '/clients':     { title: 'Clients & CRM', subtitle: 'Gestion des prospects et clients actifs' },
  '/prospects':   { title: 'Prospects', subtitle: 'Pipeline commercial et opportunités' },
  '/contrats':    { title: 'Contrats', subtitle: 'Suivi des contrats de prestation' },
  '/sites':       { title: 'Sites gardiennés', subtitle: 'Tous les sites sous surveillance' },
  '/agents':      { title: 'Agents', subtitle: 'Gestion du personnel opérationnel' },
  '/operations':  { title: 'Opérations', subtitle: 'Pointages et déploiements du jour' },
  '/supervision': { title: 'Supervision', subtitle: 'Alertes, incidents, visites de contrôle et rapports' },
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

  return (
    <div className="flex min-h-screen bg-slate-100 print:block print:bg-white">
      <div className="no-print">
        <Sidebar />
      </div>
      <div className="flex-1 ml-64 flex flex-col min-h-screen print:ml-0">
        <div className="no-print">
          <Header title={title} subtitle={subtitle} />
        </div>
        <main className="flex-1 p-6 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
