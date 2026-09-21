'use client'
import { StatusMark } from '@/components/ui/Bits'
import { clock } from '@/lib/format'
import { callEnd, phaseOf, type Mode } from '@/lib/sweep-engine'
import { OUTCOME_LABEL, type Listing } from '@/lib/types'

/** The audit trail: every finished call, newest first. It fills as the sweep runs. */
export function CallLog({ listings, t, mode, onOpen }: { listings: Listing[]; t: number; mode: Mode; onOpen: (id: string) => void }) {
  const done = listings.filter((l) => phaseOf(l, t, mode) === 'done').sort((a, b) => (b.yours ? 1e9 + b.n : callEnd(b)) - (a.yours ? 1e9 + a.n : callEnd(a)))
  return (
    <section aria-label="Call log" className="call-log flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-surface-1 max-lg:max-h-[280px]">
      <h2 className="t-label flex h-9 shrink-0 items-center justify-between border-b border-line px-3 text-ink-muted"><span>Call log</span><span>{done.length} ended</span></h2>
      {done.length === 0 ? (
        <p className="p-3 text-[13px] text-ink-muted">No calls yet. Each finished call lands here with its result.</p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {done.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onOpen(l.id)} className="grid w-full grid-cols-[40px_16px_minmax(0,1fr)] items-center gap-2 border-b border-line px-3 py-1.5 text-left transition-colors duration-150 hover:bg-surface-2">
                <span className="t-mono text-ink-muted">{l.yours ? 'you' : clock(callEnd(l))}</span>
                <StatusMark outcome={l.result.outcome} />
                <span className="t-listing truncate"><span className="font-semibold">{l.provider}</span> <span className="text-ink-muted">· {l.result.reason ?? OUTCOME_LABEL[l.result.outcome]}</span></span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
