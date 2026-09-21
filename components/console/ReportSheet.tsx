'use client'
import { DownloadSimple, Printer } from '@phosphor-icons/react'
import { Lockup } from '@/components/brand/Logo'
import { EmptyState, StatusStamp } from '@/components/ui/Bits'
import { Button } from '@/components/ui/Button'
import { clock, csvEscape, money } from '@/lib/format'
import { META } from '@/lib/seed'
import { changedFields, sweepStats } from '@/lib/sweep-engine'
import { FIELD_LABEL, OUTCOME_LABEL, OUTCOME_ORDER, type Listing } from '@/lib/types'

export function downloadCorrections(listings: Listing[]) {
  const head = ['listing', 'provider', 'practice', 'field', 'was', 'now', 'outcome', 'quote', 'clip_start_s', 'clip_end_s']
  const rows = listings.flatMap((l) => {
    const changed = changedFields(l).map((k) => { const f = l.result.fields[k]; return [l.id, l.provider, l.practice, k, l.listed[k], f.value ?? '', l.result.outcome, f.quote ?? '', String(f.clip?.[0] ?? ''), String(f.clip?.[1] ?? '')] })
    return changed.length || l.result.outcome !== 'ghost' ? changed : [[l.id, l.provider, l.practice, 'listing', 'listed', 'remove', 'ghost', l.result.reason ?? '', '', '']]
  })
  const csv = [head, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `rollcall-corrections-${META.sweepDate}.csv` })
  a.click(); URL.revokeObjectURL(a.href)
}

export function ReportSheet({ listings, swept, page }: { listings: Listing[]; swept: boolean; page?: boolean }) {
  if (!swept) return <div className="flex-1 rounded-md border border-line bg-surface-1"><EmptyState title="No report yet" body="Run the sweep first. The report is written from its results." /></div>
  const stats = sweepStats(listings, META.pricePerMinute)
  const by = (o: string) => listings.filter((l) => l.result.outcome === o)
  const corrections = listings.flatMap((l) => changedFields(l).filter(() => l.result.outcome !== 'ghost').map((k) => ({ l, k, f: l.result.fields[k] })))
  return (
    <div className={page ? '' : 'min-h-0 flex-1 overflow-y-auto rounded-md border border-line bg-canvas p-4'}>
      <article className="mx-auto max-w-[840px] border border-line bg-surface-1 p-6 sm:p-10 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-4">
          <div>
            <Lockup size={18} />
            <h1 className="t-display mt-3 text-[32px]">Directory sweep report</h1>
            <p className="text-ink-muted">{META.plan} · {META.network} network · {META.county}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="t-label -rotate-[4deg] rounded-sm border-2 border-ink px-3 py-2 text-[13px]">Sweep complete · {META.sweepDate}</span>
            <div className="no-print flex gap-2">
              <Button icon={<DownloadSimple size={14} />} onClick={() => downloadCorrections(listings)}>Download corrections (CSV)</Button>
              <Button icon={<Printer size={14} />} onClick={() => print()}>Print</Button>
            </div>
          </div>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
          {OUTCOME_ORDER.map((o) => (
            <div key={o} data-outcome={o}><dt className="t-label text-ink-muted">{OUTCOME_LABEL[o]}</dt><dd className="t-display tnum text-[32px] text-[var(--oc)]">{by(o).length}</dd></div>
          ))}
        </dl>
        <p className="t-mono mt-4 text-ink-muted">{listings.length} listings called on {META.lines} lines · {clock(META.sweepDuration)} wall time · average call {clock(stats.avgCall)} · {money(stats.costPerListing)} per listing · {money(stats.totalCost)} total at ${META.pricePerMinute}/min</p>

        <h2 className="t-display mt-8 text-[20px]">Corrections</h2>
        <div className="overflow-x-auto"><table className="mt-2 w-full min-w-[560px] border-collapse text-left text-[13px]">
          <thead><tr className="border-b border-line-strong">{['Listing', 'Field', 'Was', 'Now', 'In their words'].map((h) => <th key={h} className="t-label py-2 pr-3 font-semibold text-ink-muted">{h}</th>)}</tr></thead>
          <tbody>
            {corrections.map(({ l, k, f }) => (
              <tr key={l.id + k} className="border-b border-line align-top">
                <td className="py-2 pr-3"><span className="font-semibold [font-stretch:85%]">{l.provider}</span><br /><span className="t-mono text-ink-muted">{l.id}</span></td>
                <td className="py-2 pr-3 [font-stretch:85%]">{FIELD_LABEL[k]}</td>
                <td className="py-2 pr-3 text-ink-muted [font-stretch:85%]"><span className="strike">{l.listed[k]}</span></td>
                <td className="py-2 pr-3 font-semibold [font-stretch:85%]">{f.value}</td>
                <td className="py-2 text-ink-muted">“{f.quote}” <span className="t-mono whitespace-nowrap">{f.clip ? `${clock(f.clip[0])}–${clock(f.clip[1])}` : ''}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>

        <h2 className="t-display mt-8 text-[20px]">Remove from the directory</h2>
        <ul className="mt-2 divide-y divide-line border-y border-line text-[13px]">
          {by('ghost').map((l) => <li key={l.id} className="flex flex-wrap items-baseline gap-x-3 py-2"><span className="font-semibold [font-stretch:85%]">{l.provider}</span><span className="text-ink-muted [font-stretch:85%]">{l.practice}</span><span className="ml-auto"><StatusStamp outcome="ghost" text={l.result.reason ?? 'Remove'} /></span></li>)}
        </ul>

        <h2 className="t-display mt-8 text-[20px]">Left for a person</h2>
        <ul className="mt-2 divide-y divide-line border-y border-line text-[13px]">
          {[...by('review'), ...by('retry')].map((l) => <li key={l.id} className="flex flex-wrap items-baseline gap-x-3 py-2"><span className="font-semibold [font-stretch:85%]">{l.provider}</span><span className="text-ink-muted">{l.result.reason}</span></li>)}
        </ul>

        <footer className="mt-8 grid gap-6 border-t border-line pt-4 text-[12px] text-ink-muted sm:grid-cols-2">
          <p><span className="font-semibold text-ink">Method.</span> Every office in this report is simulated; no real clinic was called. The agent discloses that it is automated, asks five questions, and writes a value only when the answer was unambiguous. Each written value keeps the audio span it came from.</p>
          <p><span className="font-semibold text-ink">Attested by</span><span className="mt-6 block border-b border-ink-muted" /><span className="mt-1 block">Provider data lead · date</span></p>
        </footer>
      </article>
    </div>
  )
}
