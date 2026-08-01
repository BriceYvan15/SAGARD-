import { Fragment, useState, useEffect } from 'react'
import { Users, Calendar, Loader2, Plus, X, Award, FileText, Video, ClipboardCheck, Trash2, Eye, Send, CheckCircle, XCircle, Clock, ChevronLeft } from 'lucide-react'
import { useApi } from '../lib/useApi'
import {
  getTrainingSessions, getTrainingSession, createTrainingSession, updateTrainingSession,
  deleteTrainingSession, publishTrainingSession,
  addTrainingQuestion, deleteTrainingQuestion,
  assignParticipants, updateParticipant,
} from '../services/trainings.service'
import { getAgents } from '../services/agents.service'
import { fmtDate } from '../lib/utils'
import Select from '../components/Select'
import DatePicker from '../components/DatePicker'

const TYPE_ICONS: Record<string, any> = {
  QCM: FileText,
  LECTURE: FileText,
  VIDEO: Video,
  PRATIQUE: ClipboardCheck,
}

const TYPE_LABELS: Record<string, string> = {
  QCM: 'QCM',
  LECTURE: 'Lecture',
  VIDEO: 'Vidéo',
  PRATIQUE: 'Pratique',
}

const SESSION_STATUS: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
  PUBLIEE: { label: 'Publiée', cls: 'bg-blue-100 text-blue-700' },
  CLOTUREE: { label: 'Clôturée', cls: 'bg-slate-200 text-slate-500' },
}

const PARTICIPANT_STATUS: Record<string, { label: string; cls: string }> = {
  ASSIGNEE: { label: 'Assigné', cls: 'bg-slate-100 text-slate-600' },
  EN_COURS: { label: 'En cours', cls: 'bg-amber-100 text-amber-700' },
  TERMINE: { label: 'Terminé', cls: 'bg-blue-100 text-blue-700' },
  REUSSI: { label: 'Réussi', cls: 'bg-green-100 text-green-700' },
  ECHOUE: { label: 'Échoué', cls: 'bg-red-100 text-red-700' },
}

const EMPTY_SESSION = {
  title: '', description: '', type: 'QCM', trainer: '', location: '',
  startDate: '', endDate: '', passingScore: 70, content: '', videoUrl: '',
}

const EMPTY_QUESTION = { question: '', options: ['', '', '', ''], correctIndex: 0, points: 1 }

export default function TrainingSessions() {
  const { data: sessionsData, loading, reload } = useApi(getTrainingSessions)
  const { data: agentsData } = useApi(getAgents)
  const agents = (agentsData as any[]) ?? []
  const sessions = (sessionsData as any[]) ?? []

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editSession, setEditSession] = useState<any | null>(null)
  const [sessionForm, setSessionForm] = useState({ ...EMPTY_SESSION })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Detail view
  const [detailSession, setDetailSession] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Questions
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [questionForm, setQuestionForm] = useState({ ...EMPTY_QUESTION })
  const [questionSaving, setQuestionSaving] = useState(false)

  // Participants
  const [showParticipantModal, setShowParticipantModal] = useState(false)
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [participantSaving, setParticipantSaving] = useState(false)

  // Publish
  const [publishing, setPublishing] = useState(false)

  async function loadDetail(id: string) {
    setDetailLoading(true)
    try {
      const data = await getTrainingSession(id)
      setDetailSession(data)
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Erreur')
    } finally { setDetailLoading(false) }
  }

  async function handleSaveSession(e: React.FormEvent) {
    e.preventDefault()
    if (!sessionForm.title) { setFormError('Le titre est obligatoire.'); return }
    setSaving(true); setFormError(null)
    try {
      const payload: any = {
        title: sessionForm.title,
        description: sessionForm.description || undefined,
        type: sessionForm.type,
        trainer: sessionForm.trainer || undefined,
        location: sessionForm.location || undefined,
        startDate: sessionForm.startDate ? new Date(sessionForm.startDate) : undefined,
        endDate: sessionForm.endDate ? new Date(sessionForm.endDate) : undefined,
        passingScore: Number(sessionForm.passingScore) || 70,
      }
      if (sessionForm.type === 'LECTURE') payload.content = sessionForm.content || undefined
      if (sessionForm.type === 'VIDEO') payload.videoUrl = sessionForm.videoUrl || undefined

      if (editSession) {
        await updateTrainingSession(editSession.id, payload)
      } else {
        await createTrainingSession(payload)
      }
      setShowCreateModal(false)
      setSessionForm({ ...EMPTY_SESSION })
      setEditSession(null)
      reload()
    } catch (err: any) { setFormError(err.response?.data?.message ?? 'Erreur') }
    finally { setSaving(false) }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!questionForm.question || questionForm.options.filter(o => o.trim()).length < 2) {
      setFormError('Question et au moins 2 options requises.'); return
    }
    setQuestionSaving(true); setFormError(null)
    try {
      await addTrainingQuestion(detailSession.id, {
        question: questionForm.question,
        options: questionForm.options.filter(o => o.trim()),
        correctIndex: questionForm.correctIndex,
        points: questionForm.points,
      })
      await loadDetail(detailSession.id)
      setQuestionForm({ ...EMPTY_QUESTION })
      setShowQuestionForm(false)
    } catch (err: any) { setFormError(err.response?.data?.message ?? 'Erreur') }
    finally { setQuestionSaving(false) }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm('Supprimer cette question ?')) return
    try {
      await deleteTrainingQuestion(detailSession.id, questionId)
      await loadDetail(detailSession.id)
    } catch (e: any) { alert(e.response?.data?.message ?? 'Erreur') }
  }

  async function handleSaveParticipants() {
    setParticipantSaving(true)
    try {
      await assignParticipants(detailSession.id, selectedAgentIds)
      await loadDetail(detailSession.id)
      setShowParticipantModal(false)
    } catch (e: any) { alert(e.response?.data?.message ?? 'Erreur') }
    finally { setParticipantSaving(false) }
  }

  async function handlePublish() {
    if (!confirm('Publier cette formation ? Les agents assignés recevront une notification.')) return
    setPublishing(true)
    try {
      await publishTrainingSession(detailSession.id)
      await loadDetail(detailSession.id)
      reload()
    } catch (e: any) { alert(e.response?.data?.message ?? 'Erreur') }
    finally { setPublishing(false) }
  }

  async function handleDeleteSession(id: string) {
    if (!confirm('Supprimer cette formation ?')) return
    try {
      await deleteTrainingSession(id)
      reload()
    } catch (e: any) { alert(e.response?.data?.message ?? 'Erreur') }
  }

  async function handleValidateParticipant(participantId: string, status: 'REUSSI' | 'ECHOUE') {
    try {
      await updateParticipant(participantId, { status })
      await loadDetail(detailSession.id)
    } catch (e: any) { alert(e.response?.data?.message ?? 'Erreur') }
  }

  // ── Detail view ──────────────────────────────────────────────
  if (detailSession) {
    const Icon = TYPE_ICONS[detailSession.type] ?? FileText
    return (
      <div className="space-y-4">
        <button onClick={() => setDetailSession(null)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft size={16} /> Retour
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-sagard-yellow/10 rounded-lg flex items-center justify-center">
                <Icon size={20} className="text-sagard-yellow-dark" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{detailSession.title}</h2>
                <p className="text-sm text-slate-500">{TYPE_LABELS[detailSession.type]} · {detailSession.trainer ?? 'Interne'}</p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${SESSION_STATUS[detailSession.status]?.cls}`}>
              {SESSION_STATUS[detailSession.status]?.label}
            </span>
          </div>

          {detailSession.description && <p className="text-sm text-slate-600 mb-4">{detailSession.description}</p>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div><span className="text-slate-400 text-xs">Lieu</span><p className="font-medium text-slate-700">{detailSession.location ?? '—'}</p></div>
            <div><span className="text-slate-400 text-xs">Début</span><p className="font-medium text-slate-700">{detailSession.startDate ? fmtDate(detailSession.startDate) : '—'}</p></div>
            <div><span className="text-slate-400 text-xs">Fin</span><p className="font-medium text-slate-700">{detailSession.endDate ? fmtDate(detailSession.endDate) : '—'}</p></div>
            {detailSession.type === 'QCM' && <div><span className="text-slate-400 text-xs">Score requis</span><p className="font-medium text-slate-700">{detailSession.passingScore}%</p></div>}
          </div>

          {detailSession.type === 'LECTURE' && detailSession.content && (
            <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contenu</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{detailSession.content}</p>
            </div>
          )}
          {detailSession.type === 'VIDEO' && detailSession.videoUrl && (
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vidéo</p>
              <a href={detailSession.videoUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">{detailSession.videoUrl}</a>
            </div>
          )}

          {/* Actions */}
          {detailSession.status === 'BROUILLON' && (
            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <button onClick={() => { setEditSession(detailSession); setSessionForm({ title: detailSession.title, description: detailSession.description ?? '', type: detailSession.type, trainer: detailSession.trainer ?? '', location: detailSession.location ?? '', startDate: detailSession.startDate ?? '', endDate: detailSession.endDate ?? '', passingScore: detailSession.passingScore ?? 70, content: detailSession.content ?? '', videoUrl: detailSession.videoUrl ?? '' }); setShowCreateModal(true) }}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50">Modifier</button>
              <button onClick={() => { setSelectedAgentIds(detailSession.participants?.map((p: any) => p.agentId) ?? []); setShowParticipantModal(true) }}
                className="px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50">Participants ({detailSession.participants?.length ?? 0})</button>
              <button onClick={handlePublish} disabled={publishing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publier
              </button>
              <button onClick={() => handleDeleteSession(detailSession.id)}
                className="px-3 py-1.5 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Supprimer</button>
            </div>
          )}
        </div>

        {/* Questions section (QCM only) */}
        {detailSession.type === 'QCM' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Questions ({detailSession.questions?.length ?? 0})</h3>
              {detailSession.status === 'BROUILLON' && (
                <button onClick={() => { setQuestionForm({ ...EMPTY_QUESTION }); setFormError(null); setShowQuestionForm(true) }}
                  className="flex items-center gap-1.5 text-sm font-bold text-sagard-dark bg-sagard-yellow hover:bg-sagard-yellow-dark px-3 py-1.5 rounded-lg">
                  <Plus size={14} /> Ajouter
                </button>
              )}
            </div>

            {showQuestionForm && (
              <form onSubmit={handleAddQuestion} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Question *</label>
                  <input value={questionForm.question} onChange={e => setQuestionForm(f => ({ ...f, question: e.target.value }))} required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Ex: Que faire en cas d'incendie ?" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-600">Options (cochez la bonne réponse) *</label>
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" name="correct" checked={questionForm.correctIndex === i} onChange={() => setQuestionForm(f => ({ ...f, correctIndex: i }))}
                        className="w-4 h-4 text-sagard-yellow" />
                      <input value={opt} onChange={e => setQuestionForm(f => ({ ...f, options: f.options.map((o, idx) => idx === i ? e.target.value : o) }))}
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder={`Option ${i + 1}`} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowQuestionForm(false)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-100">Annuler</button>
                  <button type="submit" disabled={questionSaving} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold bg-sagard-yellow text-sagard-dark rounded-lg hover:bg-sagard-yellow-dark disabled:opacity-60">
                    {questionSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Ajouter
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {(detailSession.questions ?? []).map((q: any, i: number) => (
                <div key={q.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-slate-800 text-sm">{i + 1}. {q.question}</p>
                    {detailSession.status === 'BROUILLON' && (
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {q.options.map((opt: string, idx: number) => (
                      <div key={idx} className={`text-xs px-2 py-1 rounded ${idx === q.correctIndex ? 'bg-green-100 text-green-700 font-medium' : 'text-slate-500'}`}>
                        {String.fromCharCode(65 + idx)}. {opt} {idx === q.correctIndex && '✓'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(detailSession.questions ?? []).length === 0 && (
                <p className="text-center text-slate-400 text-sm py-6">Aucune question. Ajoutez-en avant de publier.</p>
              )}
            </div>
          </div>
        )}

        {/* Participants table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Participants ({detailSession.participants?.length ?? 0})</h3>
            {detailSession.status !== 'BROUILLON' && (
              <button onClick={() => { setSelectedAgentIds(detailSession.participants?.map((p: any) => p.agentId) ?? []); setShowParticipantModal(true) }}
                className="text-sm text-blue-600 hover:underline">Modifier</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Agent', 'Matricule', 'Statut', 'Score', 'Date', detailSession.type === 'PRATIQUE' ? 'Validation' : ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(detailSession.participants ?? []).map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.agent?.user?.firstName} {p.agent?.user?.lastName}</td>
                    <td className="px-4 py-3 text-slate-600">{p.agent?.matricule ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PARTICIPANT_STATUS[p.status]?.cls}`}>
                        {PARTICIPANT_STATUS[p.status]?.label ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{p.score != null ? `${p.score}%` : '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.completedAt ? fmtDate(p.completedAt) : '—'}</td>
                    <td className="px-4 py-3">
                      {detailSession.type === 'PRATIQUE' && p.status === 'TERMINE' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleValidateParticipant(p.id, 'REUSSI')} className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200">
                            <CheckCircle size={12} /> Réussi
                          </button>
                          <button onClick={() => handleValidateParticipant(p.id, 'ECHOUE')} className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200">
                            <XCircle size={12} /> Échoué
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(detailSession.participants ?? []).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Aucun participant assigné</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────
  return (
    <Fragment>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Formations</h2>
          <button onClick={() => { setEditSession(null); setSessionForm({ ...EMPTY_SESSION }); setFormError(null); setShowCreateModal(true) }}
            className="flex items-center gap-2 bg-sagard-yellow hover:bg-sagard-yellow-dark text-sagard-dark text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            <Plus size={16} /> Nouvelle formation
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s: any) => {
              const Icon = TYPE_ICONS[s.type] ?? FileText
              const participantCount = s._count?.participants ?? 0
              const questionCount = s._count?.questions ?? 0
              return (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => loadDetail(s.id)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-sagard-yellow/10 rounded-lg flex items-center justify-center">
                        <Icon size={16} className="text-sagard-yellow-dark" />
                      </div>
                      <h3 className="font-semibold text-slate-800 text-sm">{s.title}</h3>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SESSION_STATUS[s.status]?.cls}`}>
                      {SESSION_STATUS[s.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 ml-10">{TYPE_LABELS[s.type]} · {s.trainer ?? 'Interne'}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 ml-10">
                    <Calendar size={12} />
                    {s.startDate ? fmtDate(s.startDate) : 'Non planifiée'}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 ml-10">
                    <span className="flex items-center gap-1"><Users size={12} /> {participantCount}</span>
                    {s.type === 'QCM' && <span className="flex items-center gap-1"><FileText size={12} /> {questionCount} Q</span>}
                  </div>
                </div>
              )
            })}
            {sessions.length === 0 && (
              <div className="col-span-3 text-center text-slate-400 text-sm py-10">
                <Award size={40} className="mx-auto mb-3 opacity-30" />
                Aucune formation. Cliquez sur "Nouvelle formation" pour commencer.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Modal Créer/Modifier session ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Award size={18} className="text-sagard-yellow-dark" /> {editSession ? 'Modifier la formation' : 'Nouvelle formation'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
            </div>
            <form onSubmit={handleSaveSession} className="px-6 py-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{formError}</div>}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Titre *</label>
                <input value={sessionForm.title} onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Ex: Formation sécurité incendie" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type de formation *</label>
                <Select value={sessionForm.type} onChange={v => setSessionForm(f => ({ ...f, type: v }))}
                  options={[
                    { value: 'QCM', label: 'QCM (Questions à choix multiples)' },
                    { value: 'LECTURE', label: 'Lecture (Document à lire)' },
                    { value: 'VIDEO', label: 'Vidéo (À visionner)' },
                    { value: 'PRATIQUE', label: 'Pratique (Évaluation sur le terrain)' },
                  ]} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={sessionForm.description} onChange={e => setSessionForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none" placeholder="Détails de la formation..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Formateur</label>
                  <input value={sessionForm.trainer} onChange={e => setSessionForm(f => ({ ...f, trainer: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Nom du formateur" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Lieu</label>
                  <input value={sessionForm.location} onChange={e => setSessionForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="Lieu de la formation" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date début</label>
                  <DatePicker value={sessionForm.startDate} onChange={v => setSessionForm(f => ({ ...f, startDate: v }))} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date fin</label>
                  <DatePicker value={sessionForm.endDate} onChange={v => setSessionForm(f => ({ ...f, endDate: v }))} className="w-full" />
                </div>
              </div>

              {sessionForm.type === 'QCM' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Score de réussite (%)</label>
                  <input type="number" min={0} max={100} value={sessionForm.passingScore} onChange={e => setSessionForm(f => ({ ...f, passingScore: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" />
                </div>
              )}
              {sessionForm.type === 'LECTURE' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Contenu à lire</label>
                  <textarea value={sessionForm.content} onChange={e => setSessionForm(f => ({ ...f, content: e.target.value }))} rows={5}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40 resize-none" placeholder="Tapez le contenu de la formation ici..." />
                </div>
              )}
              {sessionForm.type === 'VIDEO' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">URL de la vidéo</label>
                  <input value={sessionForm.videoUrl} onChange={e => setSessionForm(f => ({ ...f, videoUrl: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sagard-yellow/40" placeholder="https://..." />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />} {editSession ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Modal Participants ═══ */}
      {showParticipantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-sagard-yellow-dark" /> Assigner les participants</h2>
              <button onClick={() => setShowParticipantModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-slate-500">{selectedAgentIds.length} agent(s) sélectionné(s)</p>
              <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto p-2 space-y-1">
                {agents.map((a: any) => {
                  const checked = selectedAgentIds.includes(a.id)
                  return (
                    <label key={a.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${checked ? 'bg-sagard-yellow/10 text-slate-800' : 'hover:bg-slate-50 text-slate-600'}`}>
                      <input type="checkbox" checked={checked} onChange={() => {
                        setSelectedAgentIds(checked ? selectedAgentIds.filter(id => id !== a.id) : [...selectedAgentIds, a.id])
                      }} className="rounded border-slate-300" />
                      <span className="font-medium">{a.user?.firstName} {a.user?.lastName}</span>
                      <span className="text-xs text-slate-400">({a.matricule})</span>
                    </label>
                  )
                })}
                {agents.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Aucun agent disponible</p>}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowParticipantModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 bg-white">Annuler</button>
                <button onClick={handleSaveParticipants} disabled={participantSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-sagard-yellow text-sagard-dark rounded-lg text-sm font-bold hover:bg-sagard-yellow-dark disabled:opacity-60">
                  {participantSaving ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />} Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  )
}
