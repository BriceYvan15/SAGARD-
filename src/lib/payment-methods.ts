export const PAYMENT_METHODS = [
  { value: 'CHEQUE_NSIA',     label: 'Chèque NSIA' },
  { value: 'VIREMENT_NSIA',   label: 'Virement NSIA' },
  { value: 'CHEQUE_BOA',      label: 'Chèque BOA' },
  { value: 'VIREMENT_BOA',    label: 'Virement BOA' },
  { value: 'CHEQUE_ECOBANK',  label: 'Chèque Ecobank' },
  { value: 'VIREMENT_ECOBANK',label: 'Virement Ecobank' },
  { value: 'WAVE',            label: 'Wave' },
  { value: 'ORANGE_MONEY',    label: 'Orange Money' },
  { value: 'DJAMO',           label: 'Djamo' },
  { value: 'ESPECE',          label: 'Espèces' },
] as const

export const PAYMENT_METHOD_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map(m => [m.value, m.label])
)
