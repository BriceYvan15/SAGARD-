/**
 * Notification sounds via Web Audio API — no external files needed.
 * Different sounds per notification type:
 *  - Normal (prospects, clients, etc.): soft double ding
 *  - Incident/Alert: urgent repeated beep
 *  - Facture/Commercial: pleasant crystal bell
 *  - Default: classic single ding
 */

let audioCtx: AudioContext | null = null
let unlocked = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
  }
  return audioCtx
}

/** Call on first user interaction to unlock audio playback */
export function unlockAudio() {
  const ctx = getCtx()
  if (!ctx || unlocked) return
  if (ctx.state === 'suspended') ctx.resume()
  unlocked = true
}

function playTone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
) {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
  g.gain.setValueAtTime(0, ctx.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration + 0.05)
}

const SOUND_MAP: Record<string, () => void> = {
  // Urgent: incidents, alerts — 3 beeps repeated 3 times with pauses
  urgent: () => {
    const beep = (offset: number) => {
      playTone(880, offset,      0.25, 'square', 0.14)
      playTone(880, offset + 0.35, 0.25, 'square', 0.14)
      playTone(880, offset + 0.70, 0.35, 'square', 0.16)
    }
    beep(0)      // 1st round
    beep(1.30)   // 2nd round
    beep(2.60)   // 3rd round
  },

  // Crystal bell: factures, commercial — pleasant chime with long tail
  crystal: () => {
    playTone(523.25, 0,    0.60, 'sine', 0.14)  // C5
    playTone(659.25, 0.15, 0.60, 'sine', 0.12)  // E5
    playTone(783.99, 0.30, 0.80, 'sine', 0.12)  // G5
    playTone(1046.50, 0.45, 0.90, 'sine', 0.08) // C6 (overtone for richness)
  },

  // Soft double ding: prospects, clients, RH, etc. — longer with more spacing
  soft: () => {
    playTone(587.33, 0,    0.40, 'sine', 0.14)  // D5
    playTone(783.99, 0.30, 0.55, 'sine', 0.12)  // G5
  },

  // Default: classic ding — longer
  default: () => {
    playTone(660, 0, 0.50, 'sine', 0.14)
  },
}

const TYPE_TO_SOUND: Record<string, keyof typeof SOUND_MAP> = {
  INCIDENT: 'urgent',
  ALERTE: 'urgent',
  RECLAMATION: 'urgent',
  FACTURE: 'crystal',
  FACTURE_RETARD: 'crystal',
  COMMERCIAL: 'crystal',
  PROSPECT: 'soft',
  CLIENT: 'soft',
  CONTRAT: 'soft',
  POINTAGE: 'soft',
  RECRUTEMENT: 'soft',
  EQUIPEMENT: 'soft',
  EXPIRATION_CONTRAT: 'soft',
  ASSIGNATION: 'soft',
  SYSTEME: 'default',
}

export function playNotificationSound(type?: string) {
  if (!unlocked) return
  const soundKey = type ? TYPE_TO_SOUND[type] ?? 'default' : 'default'
  SOUND_MAP[soundKey]?.()
}

/** Check if sound is enabled in localStorage */
export function isSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem('sagard_sound_enabled')
    return v === null ? true : v === 'true'
  } catch { return true }
}

export function setSoundEnabled(enabled: boolean) {
  try { localStorage.setItem('sagard_sound_enabled', String(enabled)) } catch {}
}
