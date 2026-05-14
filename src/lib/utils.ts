export function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' XOF'
}

export function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function clsx(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function daysOverdue(dueDate: string) {
  const diff = new Date().getTime() - new Date(dueDate).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
