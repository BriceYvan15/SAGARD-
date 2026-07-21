import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Contrats from './pages/Contrats'
import Sites from './pages/Sites'
import Agents from './pages/Agents'
import Operations from './pages/Operations'
import Facturation from './pages/Facturation'
import InvoiceDetail from './pages/InvoiceDetail'
import RH from './pages/RH'
import Stock from './pages/Stock'
import IA from './pages/IA'
import Supervision from './pages/Supervision'
import Registres from './pages/Registres'
import Prospects from './pages/Prospects'
import DocumentsCommerciaux from './pages/DocumentsCommerciaux'
import AlertesCommerciales from './pages/AlertesCommerciales'
import Utilisateurs from './pages/Utilisateurs'
import Parametres from './pages/Parametres'
import Comptabilite from './pages/Comptabilite'
import AuditTrail from './pages/AuditTrail'
import Accueil from './pages/Accueil'
import { getUser } from './lib/auth'

function HomeRedirect() {
  const user = getUser()
  if (user?.role === 'AGENT_ACCUEIL') return <Navigate to="/accueil" replace />
  if (user?.role === 'COMMERCIAL') return <Navigate to="/prospects" replace />
  if (user?.role === 'RH') return <Navigate to="/rh" replace />
  if (user?.role === 'CHEF_OPERATIONS') return <Navigate to="/operations" replace />
  if (user?.role === 'CONTROLEUR') return <Navigate to="/operations" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="clients"     element={<Clients />} />
            <Route path="clients/:id"  element={<ClientDetail />} />
            <Route path="contrats"    element={<Contrats />} />
            <Route path="sites"       element={<Sites />} />
            <Route path="agents"      element={<Agents />} />
            <Route path="operations"  element={<Operations />} />
            <Route path="supervision" element={<Supervision />} />
            <Route path="registres"   element={<Registres />} />
            <Route path="prospects"  element={<Prospects />} />
            <Route path="documents-commerciaux" element={<DocumentsCommerciaux />} />
            <Route path="devis"       element={<Navigate to="/documents-commerciaux" replace />} />
            <Route path="proforma"    element={<Navigate to="/documents-commerciaux" replace />} />
            <Route path="alertes-commerciales" element={<AlertesCommerciales />} />
            <Route path="facturation" element={<Facturation />} />
            <Route path="facturation/:id" element={<InvoiceDetail />} />
            <Route path="rh"          element={<RH />} />
            <Route path="stock"       element={<Stock />} />
            <Route path="ia"          element={<IA />} />
            <Route path="utilisateurs" element={<Utilisateurs />} />
            <Route path="comptabilite" element={<Comptabilite />} />
            <Route path="audit"         element={<AuditTrail />} />
            <Route path="parametres"   element={<Parametres />} />
            <Route path="accueil"      element={<Accueil />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
