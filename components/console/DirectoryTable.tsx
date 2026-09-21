'use client'
import { Play } from '@phosphor-icons/react'
import { memo } from 'react'
import { StatusMark, StatusStamp, EmptyState } from '@/components/ui/Bits'
import { Button } from '@/components/ui/Button'
import { cellOf, phaseOf, type Cell, type Mode, type Phase } from '@/lib/sweep-engine'
import { FIELD_LABEL, type FieldKey, type Listing } from '@/lib/types'

const COLS = 'grid-cols-[36px_minmax(0,1fr)_auto] sm:grid-cols-[40px_minmax(180px,1fr)_104px_92px_128px] wide:grid-cols-[40px_minmax(180px,1.1fr)_minmax(140px,1fr)_144px_100px_92px_128px]'
const YES_NO: Partial<Record<FieldKey, [string, string]>> = { accepting: ['Accepting', 'Not accepting'], inNetwork: ['In network', 'Out of network'] }
const show = (key: FieldKey, v: string) => (YES_NO[key] ? YES_NO[key]![v === 'Yes' ? 0 : 1] : v)

export function FieldCell({ k, cell, onClip, animate }: { k: FieldKey; cell: Cell; onClip?: () => void; animate?: boolean }) {
  const clip = onClip && (cell.status === 'confirmed' || cell.status === 'corrected' || cell.status === 'unconfirmed')
  const always = cell.status === 'corrected' || cell.status === 'unconfirmed'
  const mono = k === 'phone' ? 't-mono' : 't-listing'
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="min-w-0 flex-1">
        {cell.status === 'corrected' ? (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className={`${mono} truncate text-ink-muted`}><span className={`strike ${animate ? 'strike-in' : ''}`}>{show(k, cell.was ?? '')}</span></span>
            <span className={`${mono} truncate font-semibold text-ink ${animate ? 'fade-in' : ''}`}>{show(k, cell.value)}</span>
          </span>
        ) : (
          <span className={`${mono} block truncate ${cell.status === 'stale' || cell.status === 'not_asked' ? 'text-ink-muted' : 'text-ink'}`}>
            {show(k, cell.value)}
            {cell.status === 'asking' && <span className="asking t-mono ml-1 text-accent" aria-label="being asked">···</span>}
            {cell.status === 'unconfirmed' && <span className="ml-1 font-bold text-accent" title="Couldn't confirm">?</span>}
          </span>
        )}
      </span>
      {clip && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onClip() }} aria-label={`Play the clip for ${FIELD_LABEL[k].toLowerCase()}`}
          className={`inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-[opacity,background-color,color] duration-150 hover:bg-ink hover:text-canvas focus-visible:opacity-100 ${always ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`}>
          <Play size={11} weight="fill" />
        </button>
      )}
    </span>
  )
}

interface RowProps { l: Listing; phase: Phase; cells: Record<FieldKey, Cell>; selected: boolean; sig: string; animate: boolean; onOpen: (id: string, field?: FieldKey) => void }

const Row = memo(function Row({ l, phase, cells, selected, animate, onOpen }: RowProps) {
  const live = phase === 'dialing' || phase === 'live'
  const done = phase === 'done'
  const cell = (k: FieldKey) => <FieldCell k={k} cell={cells[k]} animate={animate} onClip={done ? () => onOpen(l.id, k) : undefined} />
  return (
    <div role="row" tabIndex={0} aria-selected={selected} onClick={() => onOpen(l.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(l.id)
        if (e.key === 'ArrowDown') (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus()
        if (e.key === 'ArrowUp') (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus()
      }}
      className={`group/row grid ${COLS} min-h-12 cursor-pointer items-center gap-x-2 border-b border-line pr-2 outline-offset-[-2px] transition-colors duration-150 ${selected ? 'bg-accent-soft' : 'hover:bg-surface-2'} ${l.yours ? 'row-in' : ''}`}
      style={{ boxShadow: selected ? 'inset 2px 0 0 var(--accent)' : live ? 'inset 2px 0 0 var(--lamp-ringing)' : undefined }}>
      <span role="cell" className="flex h-full flex-col items-center justify-center gap-0.5 border-r border-line-strong/50">
        <span className={`t-mono ${phase === 'stale' ? 'text-ink-muted' : 'text-ink'}`}>{l.n}</span>
        {done && <StatusMark outcome={l.result.outcome} draw={animate} />}
      </span>
      <span role="cell" className="min-w-0 py-1.5">
        <span className="t-listing block truncate"><span className="font-semibold">{l.provider}</span><span className="text-ink-muted">, {l.credential}</span>
          {l.yours && <span className="t-label ml-2 rounded-sm bg-accent px-1 py-px text-accent-ink">{l.tag ?? 'Your call'}</span>}</span>
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-ink-muted"><span className="truncate [font-stretch:85%]">{l.practice}</span><span className="t-mono shrink-0 text-[10px]">{l.grid}</span></span>
        <span className="mt-0.5 block wide:hidden">{cell('address')}</span>
        <span className="mt-0.5 flex gap-4 sm:hidden">{cell('accepting')}{cell('inNetwork')}</span>
      </span>
      <span role="cell" className="hidden min-w-0 wide:block">{cell('address')}</span>
      <span role="cell" className="hidden min-w-0 wide:block">{cell('phone')}</span>
      <span role="cell" className="hidden min-w-0 sm:block">{cell('accepting')}</span>
      <span role="cell" className="hidden min-w-0 sm:block">{cell('inNetwork')}</span>
      <span role="cell" className="flex min-w-0 justify-end">
        {done ? <StatusStamp outcome={l.result.outcome} text={l.result.stamp} />
          : live ? <span className="t-mono text-ink">Line {l.call.line} · {phase === 'dialing' ? 'dialing' : 'on call'}</span>
          : <span className="t-mono truncate text-ink-muted" title={`Last verified ${l.lastVerifiedDays} days ago`}>Stale · {l.lastVerifiedDays}d</span>}
      </span>
    </div>
  )
}, (a, b) => a.sig === b.sig && a.selected === b.selected && a.animate === b.animate && a.l === b.l)

export function DirectoryTable({ listings, t, mode, selected, view, q, onOpen, onClearFilter }: {
  listings: Listing[]; t: number; mode: Mode; selected: string | null; view: 'ready' | 'loading' | 'error' | 'empty'; q: string
  onOpen: (id: string, field?: FieldKey) => void; onClearFilter: () => void
}) {
  return (
    <section aria-label="Directory" role="table" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-line bg-surface-1">
      <div role="row" className={`grid ${COLS} h-9 shrink-0 items-center gap-x-2 border-b border-line-strong/60 pr-2`}>
        {['#', 'Provider', 'Address', 'Booking phone', 'New patients', 'Plan', 'Result'].map((h, i) => (
          <span key={h} role="columnheader" className={`t-label truncate text-ink-muted ${i === 0 ? 'text-center' : ''} ${i === 2 || i === 3 ? 'hidden wide:block' : ''} ${i === 4 || i === 5 ? 'hidden sm:block' : ''} ${i === 6 ? 'text-right' : ''}`}>{h}</span>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {view === 'loading' ? Array.from({ length: 9 }, (_, i) => (
          <div key={i} className={`grid ${COLS} h-12 items-center gap-x-2 border-b border-line pr-2`}>
            <span className="sk mx-auto h-3 w-4" /><span className="flex flex-col gap-1.5"><span className="sk h-3 w-40 max-w-full" /><span className="sk h-2.5 w-28" /></span>
            <span className="sk hidden h-3 w-32 wide:block" /><span className="sk hidden h-3 w-24 wide:block" /><span className="sk hidden h-3 w-16 sm:block" /><span className="sk hidden h-3 w-14 sm:block" /><span className="sk ml-auto h-5 w-24" />
          </div>
        )) : view === 'error' ? (
          <EmptyState title="Couldn't load the directory" body="The listing file didn't arrive. Nothing was changed." action={<Button onClick={() => location.assign(location.pathname)}>Reload the page</Button>} />
        ) : listings.length === 0 ? (
          <EmptyState title={q ? `No listings match “${q}”` : 'No listings with that result'} body="Every listing is still in the register. Clear the filter to see all of them." action={<Button onClick={onClearFilter}>Clear the filter</Button>} />
        ) : listings.map((l) => {
          const phase = phaseOf(l, t, mode)
          const cells = { practising: cellOf(l, 'practising', t, mode), address: cellOf(l, 'address', t, mode), phone: cellOf(l, 'phone', t, mode), accepting: cellOf(l, 'accepting', t, mode), inNetwork: cellOf(l, 'inNetwork', t, mode) }
          const sig = phase + Object.values(cells).map((c) => c.status[0] + c.status[2]).join('')
          return <Row key={l.id} l={l} phase={phase} cells={cells} sig={sig} selected={selected === l.id} animate={mode === 'running'} onOpen={onOpen} />
        })}
      </div>
    </section>
  )
}
