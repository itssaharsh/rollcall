// The call's outcome is derived here from what was written, never taken from the model.
import type { FieldKey, FieldResult, Outcome } from '../types'

export interface CallFacts { fields: Record<FieldKey, FieldResult>; flags: string[]; answeredBy: 'person' | 'voicemail' | 'intercept' | 'wrong_number' }

const GHOST_FLAGS = ['provider_retired', 'left_practice', 'not_in_network', 'provider_deceased', 'practice_closed', 'wrong_number']
export const REASON: Record<string, string> = {
  provider_retired: 'Provider retired', left_practice: 'Left the practice', not_in_network: "Doesn't take this plan", provider_deceased: 'Provider deceased',
  practice_closed: 'Practice closed', wrong_number: 'Wrong number', intercept: 'Number disconnected', voicemail: 'Voicemail',
}

export function deriveOutcome({ fields, flags, answeredBy }: CallFacts): { outcome: Outcome; stamp: string; reason?: string } {
  const all = Object.values(fields)
  const ghost = flags.find((f) => GHOST_FLAGS.includes(f))
  if (answeredBy === 'intercept') return { outcome: 'ghost', stamp: 'Remove', reason: REASON.intercept }
  if (ghost || fields.practising.value === 'No' || fields.inNetwork.value === 'No')
    return { outcome: 'ghost', stamp: 'Remove', reason: REASON[ghost ?? (fields.inNetwork.value === 'No' ? 'not_in_network' : 'left_practice')] }
  if (all.some((f) => f.status === 'unconfirmed')) return { outcome: 'review', stamp: 'Needs a human' }
  if (answeredBy === 'voicemail') return { outcome: 'retry', stamp: 'Retry 2PM', reason: REASON.voicemail }
  if (flags.includes('callback') && all.every((f) => f.status === 'not_asked')) return { outcome: 'review', stamp: 'Needs a human' }
  const corrected = all.filter((f) => f.status === 'corrected').length
  if (corrected) return { outcome: 'corrected', stamp: `Corrected ·${corrected}` }
  if (all.every((f) => f.status === 'confirmed')) return { outcome: 'confirmed', stamp: 'Confirmed' }
  // the call ended with questions unanswered: a person finishes it
  return { outcome: 'review', stamp: 'Needs a human' }
}
