'use client'
import { Pause, Play } from '@phosphor-icons/react'
import { playClip, stopClip, useClip } from '@/lib/clip'
import { clock, wordsOf } from '@/lib/format'
import type { Listing, Turn } from '@/lib/types'

/** A quote with its audio. While it plays, spoken words are inked and the rest stay muted. */
export function ClipPlayer({ listing, turn, clipKey, hedge, compact }: { listing: Listing; turn: Turn; clipKey: string; hedge?: string[]; compact?: boolean }) {
  const { playing, time, silent } = useClip(clipKey)
  const words = wordsOf(turn)
  const text = turn.text
  const hedged = (w: string, i: number) => {
    if (!hedge?.length) return false
    const upto = words.slice(0, i + 1).map((x) => x.w).join(' ')
    return hedge.some((h) => { const at = text.indexOf(h); return at >= 0 && upto.length > at && upto.length - w.length < at + h.length })
  }
  return (
    <div className={`flex items-start gap-3 ${compact ? '' : 'rounded-md border border-line bg-canvas/50 p-3'}`}>
      <button type="button" aria-label={playing ? 'Pause the clip' : 'Play the clip'} aria-pressed={playing}
        onClick={() => (playing ? stopClip() : playClip(listing, [turn.t0, turn.t1], clipKey))}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-transform duration-150 active:scale-[.94]">
        {playing ? <Pause size={12} weight="fill" /> : <Play size={12} weight="fill" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={compact ? 'text-[14px]' : 'text-[16px] leading-snug'}>
          <span aria-hidden>“</span>
          {words.map((w, i) => (
            <span key={i} className={`transition-colors duration-150 ${playing && time < w.t0 ? 'text-ink-muted/60' : 'text-ink'} ${hedged(w.w, i) ? 'rounded-[1px] bg-accent-soft' : ''}`}>{w.w}{i < words.length - 1 ? ' ' : ''}</span>
          ))}
          <span aria-hidden>”</span>
        </p>
        <p className="t-mono mt-1 text-ink-muted">
          {clock(turn.t0)}–{clock(turn.t1)}
          {!listing.call.audio && (compact ? silent && <span> · playing without sound</span> : <span> · {silent ? 'playing without sound · ' : ''}audio arrives with the recorded sweep</span>)}
        </p>
      </div>
    </div>
  )
}
