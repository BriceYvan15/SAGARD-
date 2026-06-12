import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Bot, Send, Loader2, User } from 'lucide-react'
import { sendMessage } from '../services/ai.service'

interface Message {
  role: 'user' | 'assistant'
  content: string
  time: string
}

const SUGGESTIONS = [
  'Combien d\'agents sont actuellement en service ?',
  'Quelles factures sont en retard ce mois-ci ?',
  'Quels contrats arrivent à échéance bientôt ?',
  'Donne-moi un résumé de l\'activité de la semaine',
]

export default function IA() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis l\'assistant IA de SAGARD SÉCURITÉ. Je peux vous aider avec des informations sur vos agents, contrats, factures et opérations. Comment puis-je vous aider ?',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: msg, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const { reply } = await sendMessage(msg)
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Erreur de connexion à l\'IA. Vérifiez que la clé OpenAI est configurée.', time: '' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
          <Bot size={22} className="text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800">Assistant IA SAGARD</h2>
          <p className="text-xs text-slate-400">Propulsé par GPT-4o · Données internes uniquement</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          En ligne
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              m.role === 'assistant' ? 'bg-violet-500' : 'bg-sagard-yellow'
            }`}>
              {m.role === 'assistant'
                ? <Bot size={16} className="text-white" />
                : <User size={16} className="text-sagard-dark" />}
            </div>
            <div className={`max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'assistant'
                  ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                  : 'bg-sagard-yellow text-sagard-dark rounded-tr-sm'
              }`}>
                {m.content}
              </div>
              {m.time && <span className="text-xs text-slate-400 mt-1 px-1">{m.time}</span>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 py-3">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => handleSend(s)}
              className="text-xs bg-white border border-slate-200 text-slate-600 rounded-full px-3 py-1.5 hover:border-sagard-yellow hover:text-sagard-yellow-dark transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex gap-3 items-end mt-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Posez votre question… (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
          rows={2}
          className="flex-1 resize-none text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl bg-sagard-yellow hover:bg-sagard-yellow-dark text-sagard-dark flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
