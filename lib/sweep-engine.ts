// The console is a pure function of sweep time `t` (recorded seconds). Nothing here touches React.
import type { FieldKey, FieldStatus, Listing, Outcome, Turn } from './types'
import { FIELD_ORDER, OUTCOME_ORDER } from './types'

export type Mode = 'before' | 'running' | 'done'
export type Phase = 'stale' | 'queued' | 'dialing' | 'live' | 'done'
export type CellStatus = 'stale' | 'asking' | FieldStatus

/** seconds between dialing and the office picking up */
export const DIAL = 3
/** how long a finished call's outcome stays on its line card, in sweep seconds */
export const FLASH = 7
/** a field counts as "being asked" this many seconds before its tool call lands */
const ASK_WINDOW = 7

export const callEnd = (l: Listing) => l.call.startAt + DIAL + l.call.duration
export const localTime = (l: Listing, t: number) => t - l.call.startAt - DIAL

export function phaseOf(l: Listing, t: number, mode: Mode): Phase {
  if (l.yours || mode === 'done') return 'done'
  if (mode === 'before') return 'stale'
  if (t < l.call.startAt) return 'queued'
  if (t < l.call.startAt + DIAL) return 'dialing'
  if (t < callEnd(l)) return 'live'
  return 'done'
}

export interface Cell {
  status: CellStatus
  /** value to show; for corrected cells this is the new value */
  value: string
  was?: string
}

export function cellOf(l: Listing, key: FieldKey, t: number, mode: Mode): Cell {
  const listed = l.listed[key]
  const f = l.result.fields[key]
  const phase = phaseOf(l, t, mode)
  if (phase === 'stale' || phase === 'queued' || phase === 'dialing') return { status: 'stale', value: listed }
  const lt = phase === 'done' ? Infinity : localTime(l, t)
  if (f.at !== undefined && lt >= f.at) {
    if (f.status === 'corrected') return { status: 'corrected', value: f.value ?? listed, was: listed }
    return { status: f.status, value: listed }
  }
  if (f.at !== undefined && lt >= f.at - ASK_WINDOW) return { status: 'asking', value: listed }
  if (phase === 'done') return { status: 'not_asked', value: listed }
  return { status: 'stale', value: listed }
}

export const spokenTurns = (l: Listing) => l.call.turns.filter((x) => x.who !== 'tool')

export function captionAt(l: Listing, t: number): Turn | undefined {
  const lt = localTime(l, t)
  let last: Turn | undefined
  for (const turn of l.call.turns) {
    if (turn.who === 'tool') continue
    if (turn.t0 <= lt) last = turn
    else break
  }
  return last
}

export type LineState = 'idle' | 'dialing' | 'connected' | 'hold' | 'voicemail' | 'ended'
export interface Line {
  n: number
  state: LineState
  listing?: Listing
  caption?: Turn
  elapsed: number
}

export function linesAt(listings: Listing[], t: number, mode: Mode, count: number): Line[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1
    if (mode !== 'running') return { n, state: 'idle' as const, elapsed: 0 }
    const l = listings.find((x) => !x.yours && x.call.line === n && t >= x.call.startAt && t < callEnd(x) + FLASH)
    if (!l) return { n, state: 'idle' as const, elapsed: 0 }
    if (t < l.call.startAt + DIAL) return { n, state: 'dialing' as const, listing: l, elapsed: 0 }
    if (t >= callEnd(l)) return { n, state: 'ended' as const, listing: l, elapsed: l.call.duration }
    const caption = captionAt(l, t)
    const state: LineState =
      l.call.answeredBy === 'voicemail' || l.call.answeredBy === 'intercept'
        ? 'voicemail'
        : caption?.who === 'system'
          ? 'hold'
          : 'connected'
    return { n, state, listing: l, caption, elapsed: localTime(l, t) }
  })
}

export type Tally = Record<Outcome, number> & { done: number; total: number }

export function tallyAt(listings: Listing[], t: number, mode: Mode): Tally {
  const out = { confirmed: 0, corrected: 0, ghost: 0, review: 0, retry: 0, done: 0, total: listings.length } as Tally
  for (const l of listings) {
    if (phaseOf(l, t, mode) !== 'done') continue
    out[l.result.outcome]++
    out.done++
  }
  return out
}

export const sweepStats = (listings: Listing[], pricePerMinute: number) => {
  const swept = listings.filter((l) => !l.yours)
  const talk = swept.reduce((a, l) => a + l.call.duration, 0)
  return {
    avgCall: talk / swept.length,
    costPerListing: ((talk / 60) * pricePerMinute) / swept.length,
    totalCost: (talk / 60) * pricePerMinute,
    talk,
  }
}

export const changedFields = (l: Listing) => FIELD_ORDER.filter((k) => l.result.fields[k].status === 'corrected')
export { OUTCOME_ORDER }
