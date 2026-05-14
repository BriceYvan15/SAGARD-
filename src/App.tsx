import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Contrats from './pages/Contrats'
import Sites from './pages/Sites'
import Agents from './pages/Agents'
import Operations from './pages/Operations'
import Facturation from './pages/Facturation'
import InvoiceDetail from './pages/InvoiceDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="contrats" element={<Contrats />} />
          <Route path="sites" element={<Sites />} />
          <Route path="agents" element={<Agents />} />
          <Route path="operations" element={<Operations />} />
          <Route path="facturation" element={<Facturation />} />
          <Route path="facturation/:id" element={<InvoiceDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
