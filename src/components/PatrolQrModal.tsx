import { useEffect } from 'react'
import { X, Download, Printer, Image as ImageIcon, Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  svg: string | null
  title: string
  subtitle?: string
  filename: string
  loading?: boolean
}

/** Ouvre le SVG dans un iframe caché et lance l'impression (fiable, sans popup bloqué). */
function printSvg(svg: string, title: string) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow?.document
  if (!doc) return
  doc.open()
  doc.write(
    `<!doctype html><html><head><title>${title}</title>` +
    `<style>@page{margin:12mm}html,body{margin:0;padding:0}` +
    `body{display:flex;justify-content:center;align-items:flex-start}svg{max-width:100%;height:auto}</style>` +
    `</head><body>${svg}</body></html>`,
  )
  doc.close()
  iframe.contentWindow?.focus()
  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 1500)
  }, 350)
}

function downloadSvg(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadPng(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.onload = () => {
    const scale = 3
    const w = img.naturalWidth || 340
    const h = img.naturalHeight || 462
    const canvas = document.createElement('canvas')
    canvas.width = w * scale
    canvas.height = h * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) { URL.revokeObjectURL(url); return }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    canvas.toBlob(b => {
      if (!b) return
      const u = URL.createObjectURL(b)
      const a = document.createElement('a')
      a.href = u
      a.download = `${filename}.png`
      a.click()
      URL.revokeObjectURL(u)
    }, 'image/png')
  }
  img.onerror = () => URL.revokeObjectURL(url)
  img.src = url
}

export default function PatrolQrModal({ open, onClose, svg, title, subtitle, filename, loading }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><X size={18} /></button>
        </div>

        <div className="p-5 flex items-center justify-center bg-slate-50 min-h-[280px]">
          {loading || !svg ? (
            <div className="flex flex-col items-center gap-2 text-slate-400 py-12">
              <Loader2 className="animate-spin" size={28} />
              <span className="text-xs font-medium">Génération du QR…</span>
            </div>
          ) : (
            <div
              className="w-full max-w-[300px] [&>svg]:w-full [&>svg]:h-auto drop-shadow-sm"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 grid grid-cols-3 gap-2">
          <button
            disabled={!svg}
            onClick={() => svg && printSvg(svg, title)}
            className="flex items-center justify-center gap-1.5 bg-sagard-dark text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-900 disabled:opacity-40">
            <Printer size={14} /> Imprimer
          </button>
          <button
            disabled={!svg}
            onClick={() => svg && downloadPng(svg, filename)}
            className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-40">
            <ImageIcon size={14} /> PNG
          </button>
          <button
            disabled={!svg}
            onClick={() => svg && downloadSvg(svg, filename)}
            className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-40">
            <Download size={14} /> SVG
          </button>
        </div>
      </div>
    </div>
  )
}
