import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { ChevronDown, Check, X } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface OptionGroup {
  label: string
  options: Option[]
}

interface SelectProps {
  value?: string
  onChange: (value: string) => void
  options?: Option[]
  groups?: OptionGroup[]
  placeholder?: string
  className?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  required?: boolean
}

export default function Select({
  value = '', onChange, options = [], groups, placeholder = '— Sélectionner —', className = '', size = 'md', disabled = false, required = false,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})

  useLayoutEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const showAbove = spaceBelow < 260 && rect.top > 260
      setDropStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      })
    }
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    const scrollHandler = (e: Event) => {
      if (!open) return
      if (dropRef.current && dropRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    if (open) {
      document.addEventListener('scroll', scrollHandler, true)
      window.addEventListener('resize', scrollHandler)
    }
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('scroll', scrollHandler, true)
      window.removeEventListener('resize', scrollHandler)
    }
  }, [open])

  const allOptions = [
    ...options,
    ...(groups ?? []).flatMap(g => g.options),
  ]
  const selected = allOptions.find(o => o.value === value)

  const padCls = size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 ${padCls} border rounded-lg transition-all text-left bg-white
          ${disabled
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            : open
              ? 'border-sagard-yellow/40 ring-2 ring-sagard-yellow/40'
              : 'border-slate-200 hover:border-slate-300'
          }`}
      >
        <span className={selected ? 'text-slate-800 truncate' : 'text-slate-400 truncate'}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="p-0.5 rounded hover:bg-slate-100 transition-colors"
            >
              <X size={13} className="text-slate-400" />
            </button>
          )}
          <ChevronDown size={15} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div ref={dropRef} style={dropStyle} className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto">
          {options.map(opt => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center justify-between gap-2 ${padCls} text-left transition-colors
                  ${isActive
                    ? 'bg-sagard-yellow/10 text-sagard-dark font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <span className="truncate">{opt.label}</span>
                {isActive && <Check size={14} className="text-sagard-yellow-dark flex-shrink-0" />}
              </button>
            )
          })}
          {groups?.map(group => (
            <div key={group.label}>
              <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 border-y border-slate-100`}>
                {group.label}
              </div>
              {group.options.map(opt => {
                const isActive = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={`w-full flex items-center justify-between gap-2 ${padCls} text-left transition-colors
                      ${isActive
                        ? 'bg-sagard-yellow/10 text-sagard-dark font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isActive && <Check size={14} className="text-sagard-yellow-dark flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          ))}
          {allOptions.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-slate-400">Aucune option</div>
          )}
        </div>
      )}
    </div>
  )
}
