import type { Listing, Turn, Word } from './types'
import { META } from './seed'

export const clock = (sec: number) => {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const money = (n: number) => `$${n.toFixed(2)}`

export const callCost = (l: Pick<Listing, 'call'>) => (l.call.duration / 60) * META.pricePerMinute

export const ANSWERED_BY: Record<Listing['call']['answeredBy'], string> = {
  person: 'answered by a person',
  voicemail: 'reached voicemail',
  intercept: 'number not in service',
  wrong_number: 'answered by another business',
}

/** Recorded sessions carry word timings; scripted ones get even spacing across the turn. */
export const wordsOf = (turn: Turn): Word[] => {
  if (turn.words?.length) return turn.words
  const parts = turn.text.split(/\s+/)
  const step = (turn.t1 - turn.t0) / parts.length
  return parts.map((w, i) => ({ w, t0: turn.t0 + i * step, t1: turn.t0 + (i + 1) * step }))
}

export const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
