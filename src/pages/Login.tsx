import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from '../services/auth.service'
import logoSagard from '../assets/logo-sagard.jpg'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      nav('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sagard-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logoSagard} alt="SAGARD Sécurité" className="w-24 h-24 object-contain mb-4" />
          <h1 className="text-white text-2xl font-bold">SAGARD SÉCURITÉ</h1>
          <p className="text-slate-400 text-sm mt-1">Espace de gestion interne</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          <h2 className="text-white font-semibold text-lg mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vous@sagard-securite.ci"
                autoComplete="email"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sagard-yellow focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 pr-12 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sagard-yellow focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-sagard-yellow hover:bg-sagard-yellow-dark text-sagard-dark font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          SAGARD SÉCURITÉ © {new Date().getFullYear()} · Accès réservé au personnel autorisé
        </p>
      </div>
    </div>
  )
}
