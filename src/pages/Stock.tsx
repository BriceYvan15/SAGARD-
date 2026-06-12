import { useState } from 'react'
import { Package, Truck, Fuel, Wrench, Loader2, Plus, X } from 'lucide-react'
import { useApi } from '../lib/useApi'
import { getEquipments, getEquipmentStats, getVehicles, createEquipment, createVehicle } from '../services/stock.service'
import { fmt, fmtDate } from '../lib/utils'

const EQ_STATUS: Record<string, { label: string; cls: string }> = {
  DISPONIBLE:    { label: 'Disponible',    cls: 'bg-green-100 text-green-700' },
  EN_SERVICE:    { label: 'En service',    cls: 'bg-blue-100 text-blue-700' },
  EN_MAINTENANCE:{ label: 'Maintenance',   cls: 'bg-amber-100 text-amber-700' },
  HORS_SERVICE:  { label: 'Hors service',  cls: 'bg-red-100 text-red-700' },
  PERDU:         { label: 'Perdu',         cls: 'bg-gray-100 text-gray-600' },
}
const VEH_STATUS: Record<string, { label: string; cls: string }> = {
  DISPONIBLE:    { label: 'Disponible',    cls: 'bg-green-100 text-green-700' },
  EN_SERVICE:    { label: 'En service',    cls: 'bg-blue-100 text-blue-700' },
  EN_PANNE:      { label: 'En panne',      cls: 'bg-red-100 text-red-700' },
  EN_MAINTENANCE:{ label: 'Maintenance',   cls: 'bg-amber-100 text-amber-700' },
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-sagard-yellow text-sagard-dark' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
    }`}>{children}</button>
  )
}

const EMPTY_EQ = { name: '', code: '', category: 'RADIO', serialNumber: '', purchaseDate: '' }
const EMPTY_VEH = { brand: '', model: '', plateNumber: '', type: 'VOITURE', year: new Date().getFullYear().toString(), mileage: '' }

export default function Stock() {
  const [tab, setTab] = useState<'equipments' | 'vehicles'>('equipments')
  const { data: stats, loading: sLoad, reload: reloadStats }  = useApi(getEquipmentStats)
  const { data: equipments, loading: eLoad, reload: reloadEq } = useApi(getEquipments)
  const { data: vehicles, loading: vLoad, reload: reloadVeh }   = useApi(getVehicles)

  const [showEqModal, setShowEqModal] = useState(false)
  const [eqForm, setEqForm] = useState({ ...EMPTY_EQ })
  const [showVehModal, setShowVehModal] = useState(false)
  const [vehForm, setVehForm] = useState({ ...EMPTY_VEH })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const s = stats as any

  return (
    <div className="space-y-5">
      {/* Stats équipements */}
      {!sLoad && s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total équipements', value: s.total,       icon: Package, color: 'bg-violet-500' },
            { label: 'Disponibles',       value: s.available,   icon: Package, color: 'bg-green-500' },
            { label: 'En service',        value: s.assigned,    icon: Wrench,  color: 'bg-blue-500' },
            { label: 'En maintenance',    value: s.maintenance, icon: Wrench,  color: 'bg-amber-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex gap-1 w-fit">
        <Tab active={tab === 'equipments'} onClick={() => setTab('equipments')}>📦 Équipements</Tab>
        <Tab active={tab === 'vehicles'}   onClick={() => setTab('vehicles')}>🚗 Véhicules</Tab>
      </div>

      {/* ÉQUIPEMENTS */}
      {tab === 'equipments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Équipements</h2>
            <button onClick={() => { setEqForm({ ...EMPTY_EQ }); setFormError(null); setShowEqModal(true) }}
              className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark text-sm font-bold px-4 py-2 rounded-xl hover:bg-sagard-yellow-dark transition-colors">
              <Plus size={16} /> Ajouter
            </button>
          </div>
          {eLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Code', 'Équipement', 'Catégorie', 'Statut', 'Assigné à', 'Date achat'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {((equipments as any[]) ?? []).map((e: any) => {
                    const st = EQ_STATUS[e.status] ?? { label: e.status, cls: 'bg-slate-100 text-slate-600' }
                    const assignedTo = e.assignments?.[0]?.agent?.user
                      ? `${e.assignments[0].agent.user.firstName} ${e.assignments[0].agent.user.lastName}`
                      : '—'
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{e.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{e.name}</td>
                        <td className="px-4 py-3 text-slate-600">{e.category}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span></td>
                        <td className="px-4 py-3 text-slate-600">{assignedTo}</td>
                        <td className="px-4 py-3 text-slate-500">{e.purchaseDate ? fmtDate(e.purchaseDate) : '—'}</td>
                      </tr>
                    )
                  })}
                  {((equipments as any[]) ?? []).length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Aucun équipement</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VÉHICULES */}
      {tab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Véhicules</h2>
            <button onClick={() => { setVehForm({ ...EMPTY_VEH }); setFormError(null); setShowVehModal(true) }}
              className="flex items-center gap-2 bg-sagard-yellow text-sagard-dark text-sm font-bold px-4 py-2 rounded-xl hover:bg-sagard-yellow-dark transition-colors">
              <Plus size={16} /> Ajouter
            </button>
          </div>
          {vLoad ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {((vehicles as any[]) ?? []).map((v: any) => {
                const st = VEH_STATUS[v.status] ?? { label: v.status, cls: '' }
                return (
                  <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          {v.type === 'MOTO' ? '🏍️' : '🚗'} {v.brand} {v.model}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{v.plateNumber}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1 mt-3">
                      <div className="flex items-center gap-1"><Truck size={12} /> {v.type} · {v.year}</div>
                      {v.mileage && <div className="flex items-center gap-1"><Fuel size={12} /> {v.mileage.toLocaleString('fr-FR')} km</div>}
                      {v.driver && <div>Chauffeur : {v.driver.firstName} {v.driver.lastName}</div>}
                    </div>
                    {v.lastMaintenanceAt && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                        Dernière maintenance : {fmtDate(v.lastMaintenanceAt)}
                      </div>
                    )}
                  </div>
                )
              })}
              {((vehicles as any[]) ?? []).length === 0 && (
                <div className="col-span-3 text-center text-slate-400 text-sm py-10">Aucun véhicule enregistré</div>
              )}
            </div>
          )}
        </div>
      )}
      {/* ═══ Modal Ajouter Équipement ═══ */}
      {showEqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Package size={18} className="text-sagard-yellow-dark" /> Nouvel équipement</h2>
              <button onClick={() => setShowEqModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!eqForm.name || !eqForm.code) { setFormError('Nom et code sont obligatoires'); return }
              setSaving(true); setFormError(null)
              try {
                await createEquipment({
                  name: eqForm.name, code: eqForm.code, category: eqForm.category,
                  serialNumber: eqForm.serialNumber || undefined,
                  purchaseDate: eqForm.purchaseDate ? new Date(eqForm.purchaseDate) : undefined,
                })
                setShowEqModal(false); setEqForm({ ...EMPTY_EQ }); reloadEq(); reloadStats()
              } catch (err: any) { setFormError(err.response?.data?.message ?? 'Erreur') }
              finally { setSaving(false) }
            }} className="px-6 py-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
                  <input value={eqForm.name} onChange={e => setEqForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Talkie-walkie Motorola"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Code *</label>
                  <input value={eqForm.code} onChange={e => setEqForm(f => ({ ...f, code: e.target.value }))} required placeholder="Ex: EQ-0045"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie</label>
                  <select value={eqForm.category} onChange={e => setEqForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    <option value="RADIO">Radio / Talkie-walkie</option>
                    <option value="LAMPE">Lampe torche</option>
                    <option value="UNIFORME">Uniforme</option>
                    <option value="GILET">Gilet pare-balles</option>
                    <option value="BATON">Bâton / Matraque</option>
                    <option value="MENOTTE">Menotte</option>
                    <option value="DETECTEUR">Détecteur de métaux</option>
                    <option value="CAMERA">Caméra</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">N° série</label>
                  <input value={eqForm.serialNumber} onChange={e => setEqForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="Optionnel"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date d'achat</label>
                <input type="date" value={eqForm.purchaseDate} onChange={e => setEqForm(f => ({ ...f, purchaseDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEqModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Modal Ajouter Véhicule ═══ */}
      {showVehModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Truck size={18} className="text-sagard-yellow-dark" /> Nouveau véhicule</h2>
              <button onClick={() => setShowVehModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!vehForm.brand || !vehForm.plateNumber) { setFormError('Marque et immatriculation sont obligatoires'); return }
              setSaving(true); setFormError(null)
              try {
                await createVehicle({
                  brand: vehForm.brand, model: vehForm.model, plateNumber: vehForm.plateNumber,
                  type: vehForm.type, year: vehForm.year ? +vehForm.year : undefined,
                  mileage: vehForm.mileage ? +vehForm.mileage : undefined,
                })
                setShowVehModal(false); setVehForm({ ...EMPTY_VEH }); reloadVeh()
              } catch (err: any) { setFormError(err.response?.data?.message ?? 'Erreur') }
              finally { setSaving(false) }
            }} className="px-6 py-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Marque *</label>
                  <input value={vehForm.brand} onChange={e => setVehForm(f => ({ ...f, brand: e.target.value }))} required placeholder="Ex: Toyota"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Modèle</label>
                  <input value={vehForm.model} onChange={e => setVehForm(f => ({ ...f, model: e.target.value }))} placeholder="Ex: Hilux"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Immatriculation *</label>
                  <input value={vehForm.plateNumber} onChange={e => setVehForm(f => ({ ...f, plateNumber: e.target.value }))} required placeholder="Ex: AB-1234-CI"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                  <select value={vehForm.type} onChange={e => setVehForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                    <option value="VOITURE">Voiture</option>
                    <option value="MOTO">Moto</option>
                    <option value="PICKUP">Pickup</option>
                    <option value="FOURGON">Fourgon</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Année</label>
                  <input type="number" value={vehForm.year} onChange={e => setVehForm(f => ({ ...f, year: e.target.value }))} placeholder="2024"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Kilométrage</label>
                  <input type="number" value={vehForm.mileage} onChange={e => setVehForm(f => ({ ...f, mileage: e.target.value }))} placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowVehModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
