'use client'
import { ClipPlayer } from '@/components/console/ClipPlayer'
import { StatusStamp } from '@/components/ui/Bits'
import { LISTINGS } from '@/lib/seed'
import type { FieldKey, Listing } from '@/lib/types'

const pick = (id: string, field: FieldKey) => { const l = LISTINGS.find((x) => x.id === id) as Listing; const f = l.result.fields[field]; return { l, f, turn: l.call.turns.find((t) => t.t0 === f.clip?.[0])! } }

/** Two real moments from the recorded sweep, with their audio. */
export function Clips() {
  const moved = pick('L-007', 'address'), hedge = pick('L-009', 'accepting')
  return (
    <div className="grid gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-2">
      <article className="flex flex-col gap-4 bg-surface-1 p-6">
        <div className="flex items-center justify-between gap-3"><h3 className="t-display text-[24px]">Every change has a receipt</h3><StatusStamp outcome="corrected" text="Corrected" /></div>
        <p className="text-ink-muted">The office moved. The old address is struck through, the new one is written in, and this is the receptionist saying it.</p>
        <p className="t-listing"><span className="strike text-ink-muted">{moved.l.listed.address}</span> <span className="font-semibold">{moved.f.value}</span></p>
        {moved.turn && <ClipPlayer listing={moved.l} turn={moved.turn} clipKey="landing:moved" />}
      </article>
      <article className="flex flex-col gap-4 bg-surface-1 p-6">
        <div className="flex items-center justify-between gap-3"><h3 className="t-display text-[24px]">It refuses to guess</h3><StatusStamp outcome="review" text="Needs a human" /></div>
        <p className="text-ink-muted">Asked whether the doctor is taking new patients, the front desk hedged. That answer was not written down. A person decides.</p>
        <p className="t-listing text-ink-muted">New patients: <span className="font-semibold text-ink">unchanged</span> <span className="font-bold text-accent">?</span></p>
        {hedge.turn && <ClipPlayer listing={hedge.l} turn={hedge.turn} clipKey="landing:hedge" hedge={['I think so', 'You would have to ask', 'I think']} />}
      </article>
    </div>
  )
}

/** Old links pointed at the console on "/". Anything carrying console state goes to where the console lives now. */
export function LegacyRedirect() {
  if (typeof window !== 'undefined') { const q = new URLSearchParams(location.search); if (['state', 'listing', 'call', 'tab', 't', 'pane'].some((k) => q.has(k))) location.replace('/console' + location.search) }
  return null
}
