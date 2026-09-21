'use client'
import NumberFlow from '@number-flow/react'
import { Glyph } from '@/components/brand/glyphs'
import { Tip } from '@/components/ui/Bits'
import { clock, money } from '@/lib/format'
import { META } from '@/lib/seed'
import { phaseOf, sweepStats, type Mode, type Tally as TallyT } from '@/lib/sweep-engine'
import { OUTCOME_LABEL, OUTCOME_ORDER, type Listing, type Outcome } from '@/lib/types'

export function Tally({ tally, listings, t, mode, filter, onFilter, onOpen }: {
  tally: TallyT; listings: Listing[]; t: number; mode: Mode; filter: Outcome | null
  onFilter: (o: Outcome | null) => void; onOpen: (id: string) => void
}) {
  const stats = sweepStats(listings, META.pricePerMinute)
  return (
    <section aria-label="Sweep tally" className="@container flex flex-col overflow-hidden rounded-md border border-line bg-surface-1 xl:flex-row">
      <div className="grid flex-1 grid-cols-3 @[760px]:grid-cols-5">
        {OUTCOME_ORDER.map((o) => {
          const on = filter === o
          return (
            <button key={o} type="button" data-outcome={o} aria-pressed={on} onClick={() => onFilter(on ? null : o)}
              className={`group flex h-[96px] min-w-0 flex-col justify-between border-b-2 border-r border-r-line px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2 ${on ? 'border-b-[var(--oc)] bg-surface-2' : 'border-b-transparent'}`}>
              <span className="flex min-h-[26px] items-start gap-1.5 text-[var(--oc)]">
                <Glyph name={o} size={14} />
                <span className="t-label text-ink-muted">{OUTCOME_LABEL[o]}</span>
              </span>
              <NumberFlow value={tally[o]} className={`t-display tnum text-[44px] leading-none ${tally[o] === 0 ? 'text-ink-muted' : 'text-ink'}`} />
            </button>
          )
        })}
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-2 border-t border-line px-4 py-3 xl:w-[380px] xl:border-t-0">
        <div className="flex items-center justify-between gap-3">
          <span className="t-label text-ink-muted">Register · {tally.done}/{tally.total} called</span>
          {mode === 'done' && <span className="t-label stamp-land rounded-sm border border-ink px-1.5 py-0.5 text-ink">Sweep complete</span>}
        </div>
        <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[3px]" role="list" aria-label="One box per listing">
          {listings.map((l) => {
            const phase = phaseOf(l, t, mode)
            const live = phase === 'dialing' || phase === 'live'
            return (
              <Tip key={l.id} text={`${l.n} · ${l.provider}${phase === 'done' ? ' · ' + OUTCOME_LABEL[l.result.outcome] : ''}`} side="top">
                <button type="button" role="listitem" aria-label={`Open listing ${l.n}, ${l.provider}`} onClick={() => onOpen(l.id)} data-outcome={l.result.outcome}
                  className={`h-[14px] w-full rounded-[1px] border transition-colors duration-150 ${phase === 'done' ? 'border-[var(--oc)] bg-[var(--oc)]' : live ? 'lamp-blink border-transparent bg-lamp-ringing' : 'border-line-strong/60 bg-transparent hover:bg-surface-2'}`} />
              </Tip>
            )
          })}
        </div>
        <p className="t-mono truncate text-ink-muted">{clock(META.sweepDuration)} sweep · {clock(stats.avgCall)} avg call · {money(stats.costPerListing)}/listing</p>
      </div>
    </section>
  )
}
