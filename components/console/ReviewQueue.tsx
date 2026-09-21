'use client'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { EmptyState, StatusStamp } from '@/components/ui/Bits'
import { Button } from '@/components/ui/Button'
import { FIELD_LABEL, FIELD_ORDER, type Listing } from '@/lib/types'
import { ClipPlayer } from './ClipPlayer'

export type Resolution = { action: 'keep' | 'apply' | 'callback'; value?: string }

const unconfirmedField = (l: Listing) => FIELD_ORDER.find((k) => l.result.fields[k].status === 'unconfirmed')
const SUGGEST: Record<string, string> = { 'L-009': 'No', 'L-021': '530 Larkspur Rd (annex)', 'L-032': '' }

export function ReviewActions({ listing: l, resolution, onResolve }: { listing: Listing; resolution?: Resolution; onResolve: (r: Resolution) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(SUGGEST[l.id] ?? '')
  const k = unconfirmedField(l)
  if (resolution)
    return <p className="text-[13px] text-ink-muted">Resolved: {resolution.action === 'keep' ? 'kept as listed' : resolution.action === 'apply' ? `changed to “${resolution.value}”` : 'callback scheduled for Tue 2:00 PM'}.</p>
  return (
    <div className="flex flex-col gap-2">
      {editing ? (
        <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (value.trim()) onResolve({ action: 'apply', value: value.trim() }) }}>
          <label className="text-[12px] text-ink-muted" htmlFor={`fix-${l.id}`}>{k ? FIELD_LABEL[k] : 'New value'}</label>
          <input id={`fix-${l.id}`} autoFocus value={value} onChange={(e) => setValue(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-md border border-line bg-surface-1 px-2 text-[14px] outline-none focus:border-accent max-sm:text-[16px]" />
          <Button type="submit" disabled={!value.trim()} title={value.trim() ? undefined : 'Type the corrected value first'}>Save change</Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onResolve({ action: 'keep' })}>Keep as listed</Button>
          <Button onClick={() => setEditing(true)}>Apply change…</Button>
          <Button onClick={() => onResolve({ action: 'callback' })}>Schedule callback</Button>
        </div>
      )}
    </div>
  )
}

export function ReviewQueue({ items, swept, onResolve, onOpen }: { items: Listing[]; swept: boolean; onResolve: (id: string, r: Resolution) => void; onOpen: (id: string) => void }) {
  if (!swept) return <Shell><EmptyState title="Nothing to review yet" body="The queue fills with the answers the agent refused to write down. Run the sweep first." /></Shell>
  if (items.length === 0) return <Shell><EmptyState title="Nothing needs a human" body="Every answer was clear enough to write down." /></Shell>
  return (
    <Shell>
      <ul className="mx-auto flex max-w-[760px] flex-col gap-3 p-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((l) => {
            const k = unconfirmedField(l)
            const f = k ? l.result.fields[k] : undefined
            const turn = f?.clip ? l.call.turns.find((x) => x.t0 === f.clip![0]) : undefined
            return (
              <motion.li key={l.id} layout exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }} transition={{ type: 'spring', visualDuration: 0.3, bounce: 0 }}
                className="rounded-md border border-line bg-surface-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => onOpen(l.id)} className="min-w-0 text-left hover:underline">
                    <span className="t-listing block truncate text-[15px] font-semibold">{l.provider}, {l.credential}</span>
                    <span className="t-listing block truncate text-ink-muted">{l.practice} · {l.grid}</span>
                  </button>
                  <StatusStamp outcome="review" text={l.result.stamp} />
                </div>
                <p className="mt-3 text-[13px] font-semibold">{l.result.reason}</p>
                {turn && <div className="mt-2"><ClipPlayer listing={l} turn={turn} clipKey={`${l.id}:${k}`} hedge={l.result.hedge} /></div>}
                <p className="mt-2 text-[13px] text-ink-muted">The agent did not write this answer into the directory. A person decides.</p>
                <div className="mt-3"><ReviewActions listing={l} onResolve={(r) => onResolve(l.id, r)} /></div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </Shell>
  )
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <section aria-label="Needs a human" className="min-h-0 flex-1 overflow-y-auto rounded-md border border-line bg-canvas">{children}</section>
)
