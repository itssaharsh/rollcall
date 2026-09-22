'use client'
import type { FieldKey, FieldResult, Listing, Turn } from './types'
import { seed } from './seed'

export type VoiceState = 'agent' | 'listening' | 'thinking'
export type CallErrorCode = 'mic-denied' | 'unavailable' | 'quota' | 'dropped' | 'capped'

export type CallEvent =
  | { type: 'voice'; state: VoiceState }
  | { type: 'partial'; who: 'agent' | 'office'; text: string }
  | { type: 'turn'; turn: Turn }
  | { type: 'level'; who: 'agent' | 'office'; level: number }
  | { type: 'field'; key: FieldKey; result: FieldResult }
  | { type: 'end'; result: Listing['result']; duration: number; turns: Turn[]; /** object URL of the mixed call audio, live calls only */ audio?: string }
  | { type: 'error'; code: CallErrorCode }

export interface CallDriver {
  readonly simulated: boolean
  start(): void
  /** hang up and discard */
  stop(): void
  /** hang up now, but still emit `end` with whatever was captured */
  wrapUp(): void
  /** ask the agent to finish quickly; used shortly before the time cap */
  hurry?(): void
  setMuted(muted: boolean): void
  on(fn: (e: CallEvent) => void): () => void
}

/** Plays the scripted sample call in real time. The live AssemblyAI driver must emit the same events. */
export class SimulatedDriver implements CallDriver {
  readonly simulated = true
  private fns = new Set<(e: CallEvent) => void>()
  private raf = 0
  private began = 0
  private cursor = 0
  private done: Turn[] = []

  on(fn: (e: CallEvent) => void) { this.fns.add(fn); return () => this.fns.delete(fn) }
  private emit(e: CallEvent) { this.fns.forEach((f) => f(e)) }
  setMuted() {}

  start() {
    const { turns, duration, result, audio } = seed.yourCall.sample
    this.began = performance.now()
    this.cursor = 0
    this.done = []
    // performance.now() on both sides: the rAF timestamp is a different clock under CDP virtual time (offset and rate)
    const loop = () => {
      const t = (performance.now() - this.began) / 1000
      const turn = turns[this.cursor]
      if (!turn) { this.emit({ type: 'end', result, duration, turns: this.done, audio }); return }
      if (t >= turn.t0) {
        if (turn.who === 'tool') {
          // confirm_fields carries a list; the other tools a single field
          const args = turn.tool?.args as { field?: FieldKey; fields?: FieldKey[] } | undefined
          for (const key of args?.fields ?? (args?.field ? [args.field] : [])) if (result.fields[key]) this.emit({ type: 'field', key, result: result.fields[key] })
          this.done.push(turn); this.cursor++
        } else if (t >= turn.t1) {
          this.emit({ type: 'turn', turn }); this.done.push(turn); this.cursor++
          this.emit({ type: 'voice', state: turn.who === 'agent' ? 'listening' : 'thinking' })
        } else {
          const who = turn.who === 'agent' ? 'agent' : 'office'
          const words = turn.text.split(/\s+/)
          const shown = Math.ceil(((t - turn.t0) / (turn.t1 - turn.t0)) * words.length)
          this.emit({ type: 'voice', state: who === 'agent' ? 'agent' : 'listening' })
          this.emit({ type: 'partial', who, text: words.slice(0, shown).join(' ') })
          this.emit({ type: 'level', who, level: 0.35 + 0.65 * Math.abs(Math.sin(t * 9) * Math.sin(t * 2.3)) })
        }
      }
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  stop() { cancelAnimationFrame(this.raf) }
  wrapUp() { this.stop(); const { duration, result } = seed.yourCall.sample; this.emit({ type: 'end', result, duration, turns: this.done }) }
}

export type LineStatus = { live: true } | { live: false; reason: 'unavailable' | 'quota' }

/** Asks the server whether the live line is open: a key is configured and today's budget isn't spent. */
export async function fetchLineStatus(): Promise<LineStatus> {
  try { return (await (await fetch('/api/status', { cache: 'no-store' })).json()) as LineStatus } catch { return { live: false, reason: 'unavailable' } }
}
