import { useState, useRef, useEffect, useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  min?: string
  max?: string
  className?: string
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function DatePicker({
  value, onChange, placeholder = 'Sélectionner une date', min, max, className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00')
    return new Date()
  })
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [calPos, setCalPos] = useState<{ top?: number; bottom?: number; left?: number } | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && value) setViewDate(new Date(value + 'T00:00:00'))
  }, [open])

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const calWidth = 288
      const calHeight = 340
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const left = Math.min(rect.left, window.innerWidth - calWidth - 8)
      if (spaceBelow >= calHeight) {
        setCalPos({ top: rect.bottom + 4, left })
      } else if (spaceAbove >= calHeight) {
        setCalPos({ bottom: window.innerHeight - rect.top + 4, left })
      } else {
        const top = Math.max(8, window.innerHeight - calHeight - 8)
        setCalPos({ top, left })
      }
    }
  }, [open])

  const selected = value ? new Date(value + 'T00:00:00') : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const minDate = min ? new Date(min + 'T00:00:00') : null
  const maxDate = max ? new Date(max + 'T00:00:00') : null

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = (firstDay.getDay() + 6) % 7 // Monday = 0
    const totalDays = lastDay.getDate()

    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewDate])

  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const isSelected = (date: Date) => {
    return selected && date.getTime() === selected.getTime()
  }

  const isToday = (date: Date) => {
    return date.getTime() === today.getTime()
  }

  const selectDate = (date: Date) => {
    if (isDisabled(date)) return
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setOpen(false)
  }

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

  const formatDate = (val: string) => {
    if (!val) return ''
    const d = new Date(val + 'T00:00:00')
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm border rounded-lg transition-all text-left ${
          open
            ? 'border-sagard-yellow/40 ring-2 ring-sagard-yellow/40'
            : 'border-slate-200 hover:border-slate-300'
        } bg-white`}
      >
        <CalendarIcon size={15} className="text-slate-400 flex-shrink-0" />
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value ? formatDate(value) : placeholder}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className="ml-auto p-0.5 rounded hover:bg-slate-100 transition-colors"
          >
            <X size={13} className="text-slate-400" />
          </button>
        )}
      </button>

      {open && calPos && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div
            style={{ top: calPos.top, bottom: calPos.bottom, left: calPos.left }}
            className="fixed z-[71] bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-72"
          >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={16} className="text-slate-600" />
            </button>
            <p className="text-sm font-bold text-slate-800">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </p>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, i) => {
              if (!date) return <div key={i} />
              const disabled = isDisabled(date)
              const selectedCls = isSelected(date)
              const todayCls = isToday(date)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(date)}
                  className={`aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center
                    ${selectedCls
                      ? 'bg-sagard-yellow text-sagard-dark font-bold shadow-sm'
                      : todayCls
                        ? 'bg-slate-800 text-white font-bold'
                        : disabled
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-700 hover:bg-sagard-yellow/20 hover:text-sagard-dark'
                    }`}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                const t = new Date()
                if (!isDisabled(t)) selectDate(t)
              }}
              className="text-xs font-semibold text-sagard-yellow-dark hover:underline"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Fermer
            </button>
          </div>
          </div>
        </>
      )}
    </div>
  )
}
