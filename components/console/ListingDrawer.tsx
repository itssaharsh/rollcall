'use client'
import { Play, X } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import { StatusStamp } from '@/components/ui/Bits'
import { IconButton } from '@/components/ui/Button'
import { playClip, stopClip, useActiveClipKey } from '@/lib/clip'
import { ANSWERED_BY, callCost, clock, money } from '@/lib/format'
import { cellOf, localTime, phaseOf, type Mode } from '@/lib/sweep-engine'
import { FIELD_LABEL, FIELD_ORDER, type FieldKey, type Listing, type Turn } from '@/lib/types'
import { ClipPlayer } from './ClipPlayer'
import { ReviewActions, type Resolution } from './ReviewQueue'

const TOOL_TONE: Record<string, string> = { confirm_field: 'text-success', correct_field: 'text-warning', mark_unconfirmed: 'text-accent', flag_listing: 'text-danger', flag_wrong_number: 'text-danger' }
const WHO: Record<Turn['who'], string> = { agent: 'Rollcall', office: 'Office', system: 'Line', tool: '' }

export function ListingDrawer({ listing: l, t, mode, field, resolution, onResolve, onClose }: {
  listing: Listing | null; t: number; mode: Mode; field?: FieldKey; resolution?: Resolution; onResolve: (id: string, r: Resolution) => void; onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const active = useActiveClipKey()

  useEffect(() => {
    const d = ref.current; if (!d) return
    if (l && !d.open) d.showModal()
    if (!l && d.open) d.close()
  }, [l])

  // opening from a cell plays that cell's quote
  useEffect(() => {
    if (!l || !field) return
    const f = l.result.fields[field]
    if (!f.clip) return
    const id = setTimeout(() => {
      playClip(l, f.clip!, `${l.id}:${field}`)
      document.getElementById(`turn-${f.clip![0]}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 380)
    return () => clearTimeout(id)
  }, [l, field])

  const phase = l ? phaseOf(l, t, mode) : 'stale'
  const lt = l ? (phase === 'done' ? Infinity : localTime(l, t)) : 0
  const turns = l && (phase === 'live' || phase === 'done') ? l.call.turns.filter((x) => x.t0 <= lt) : []

  return (
    <dialog ref={ref} className="drawer w-[480px] max-w-full" aria-label={l ? `Listing ${l.n}: ${l.provider}` : 'Listing'}
      onClose={() => { stopClip(); onClose() }} onClick={(e) => e.target === ref.current && ref.current?.close()}>
      {l && (
        <div className="flex h-full flex-col overflow-hidden rounded-l-lg bg-surface-1 shadow-float">
          <header className="flex shrink-0 items-start gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="t-label text-ink-muted">Listing {l.n} · {l.grid} · {l.district}</p>
              <h2 className="t-display mt-1 truncate text-[22px]">{l.provider}<span className="font-medium text-ink-muted">, {l.credential}</span></h2>
              <p className="t-listing truncate text-ink-muted">{l.practice} · {l.specialty}</p>
            </div>
            <IconButton label="Close (Esc)" onClick={() => ref.current?.close()}><X size={16} /></IconButton>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <section className="relative px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="t-label text-ink-muted">Listing</h3>
                {phase === 'done' && <StatusStamp outcome={l.result.outcome} text={l.result.stamp} large land />}
              </div>
              {l.result.reason && phase === 'done' && <p className="mt-2 text-[14px] font-semibold">{l.result.reason}</p>}
              <dl className="mt-3 divide-y divide-line border-y border-line">
                {FIELD_ORDER.map((k) => {
                  const c = cellOf(l, k, t, mode)
                  const f = l.result.fields[k]
                  const canPlay = phase === 'done' && !!f.clip
                  const on = active === `${l.id}:${k}`
                  return (
                    <div key={k} className={`grid grid-cols-[132px_1fr_28px] items-center gap-2 py-2 ${on ? 'bg-accent-soft' : ''}`}>
                      <dt className="text-[12px] text-ink-muted">{FIELD_LABEL[k]}</dt>
                      <dd className={`${k === 'phone' ? 't-mono' : 't-listing'} min-w-0`}>
                        {c.status === 'corrected' ? <><span className="strike text-ink-muted">{c.was}</span> <span className="font-semibold">{c.value}</span></>
                          : <span className={c.status === 'stale' || c.status === 'not_asked' ? 'text-ink-muted' : ''}>{c.value}{c.status === 'unconfirmed' && <span className="ml-1 font-bold text-accent">? not confirmed</span>}{c.status === 'not_asked' && phase === 'done' && <span className="ml-1 font-sans text-[12px] [font-stretch:85%]">· not asked</span>}{c.status === 'asking' && <span className="asking t-mono ml-1 text-accent">···</span>}</span>}
                      </dd>
                      {canPlay && (
                        <button type="button" aria-label={`Play the clip for ${FIELD_LABEL[k].toLowerCase()}`} onClick={() => { playClip(l, f.clip!, `${l.id}:${k}`); document.getElementById(`turn-${f.clip![0]}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }) }}
                          className="inline-flex size-6 items-center justify-center rounded-sm text-ink-muted transition-colors duration-150 hover:bg-ink hover:text-canvas"><Play size={11} weight="fill" /></button>
                      )}
                    </div>
                  )
                })}
              </dl>
            </section>

            {l.result.outcome === 'review' && phase === 'done' && (
              <section className="border-t border-line px-5 py-4">
                <h3 className="t-label mb-2 text-ink-muted">Human gate</h3>
                <ReviewActions listing={l} resolution={resolution} onResolve={(r) => onResolve(l.id, r)} />
              </section>
            )}

            <section className="border-t border-line px-5 py-4">
              <h3 className="t-label text-ink-muted">Call</h3>
              {phase === 'stale' || phase === 'queued' ? <p className="mt-2 text-ink-muted">Not called yet. Start the sweep and this listing gets its turn.</p>
                : phase === 'dialing' ? <p className="t-mono mt-2">Line {l.call.line} · dialing {l.phone}…</p>
                : <>
                  <p className="t-mono mt-2 text-ink-muted">{l.yours ? 'Your line' : `Line ${l.call.line}`} · {clock(phase === 'done' ? l.call.duration : lt)} · {ANSWERED_BY[l.call.answeredBy]}{phase === 'done' && ` · ${money(callCost(l))}`}</p>
                  {!l.call.audio && phase === 'done' && <p className="mt-1 text-[12px] text-ink-muted">Audio arrives with the recorded sweep. Until then clips step through the words without sound.</p>}
                  <ol className="mt-3 flex flex-col gap-2.5">
                    {turns.map((turn) => turn.who === 'tool' ? (
                      <li key={turn.t0 + turn.text} className={`t-mono pl-[68px] ${turn.text.includes('refused') ? 'text-danger' : TOOL_TONE[turn.text] ?? 'text-ink-muted'}`}>
                        <span className="flex flex-wrap gap-x-2"><span aria-hidden>↳</span><span className="font-semibold">{turn.text.replace(' ✕ refused', '')}</span><span className="text-ink-muted">{Object.values(turn.tool?.args ?? {}).flat().join(' · ')}</span>{turn.text.includes('refused') && <span className="t-label rounded-sm border border-danger px-1">Refused by the gate</span>}</span>
                        {turn.note && <span className="mt-1 block font-sans text-[12px] leading-snug text-ink-muted [font-stretch:85%]">{turn.text.includes('refused') ? 'Gate: ' : 'Gate note: '}{turn.note}</span>}
                      </li>
                    ) : (
                      <li key={turn.t0} id={`turn-${turn.t0}`} className="grid grid-cols-[60px_1fr] gap-2">
                        <span className={`t-label pt-1 ${turn.who === 'office' ? 'text-accent' : 'text-ink-muted'}`}>{WHO[turn.who]}</span>
                        {turn.who === 'office' && phase === 'done'
                          ? <ClipPlayer compact listing={l} turn={turn} clipKey={clipKeyFor(l, turn)} hedge={l.result.hedge} />
                          : <p className={`text-[14px] ${turn.who === 'system' ? 'italic text-ink-muted' : ''}`}>{turn.text}</p>}
                      </li>
                    ))}
                  </ol>
                </>}
            </section>
          </div>
          <footer className="t-label shrink-0 border-t border-line bg-surface-2 px-5 py-2 text-ink-muted">Simulated office — no real clinic was called</footer>
        </div>
      )}
    </dialog>
  )
}

/** A turn that answers a field shares that field's key, so the cell, the drawer row and the transcript light up together. */
function clipKeyFor(l: Listing, turn: Turn) {
  const k = FIELD_ORDER.find((f) => l.result.fields[f].clip?.[0] === turn.t0)
  return `${l.id}:${k ?? turn.t0}`
}
