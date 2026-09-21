'use client'
import { Phone } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { stopClip } from '@/lib/clip'
import { LISTINGS, META } from '@/lib/seed'
import { isMuted, setMuted as persistMuted, stamp } from '@/lib/sound'
import { linesAt, phaseOf, tallyAt } from '@/lib/sweep-engine'
import type { FieldKey, Listing, Outcome } from '@/lib/types'
import { useSweep } from '@/lib/use-sweep'
import { clearYourRows, useYourRows } from '@/lib/your-rows'
import { AreaMap } from './AreaMap'
import { CallLog } from './CallLog'
import { CallSheet } from './CallSheet'
import { DirectoryTable } from './DirectoryTable'
import { FilterBar, Tabs } from './FilterBar'
import { ListingDrawer } from './ListingDrawer'
import { ReportSheet } from './ReportSheet'
import { ReviewQueue, type Resolution } from './ReviewQueue'
import { Switchboard } from './Switchboard'
import { Tally } from './Tally'
import { NoticeStrip, TopBar } from './TopBar'

type Tab = 'directory' | 'review' | 'report'
const REVIEW_KEY = 'rollcall:review'
const RESOLVED: Record<Resolution['action'], { outcome: Outcome; stamp: string }> = {
  keep: { outcome: 'confirmed', stamp: 'Confirmed' }, apply: { outcome: 'corrected', stamp: 'Corrected ·1' }, callback: { outcome: 'retry', stamp: 'Retry Tue 2PM' },
}

export function Console() {
  const sweep = useSweep()
  const { mode, t, view } = sweep
  const yours = useYourRows()
  const [tab, setTab] = useState<Tab>('directory')
  const [pane, setPane] = useState<'list' | 'map'>('list')
  const [filter, setFilter] = useState<Outcome | null>(null)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<{ id: string; field?: FieldKey } | null>(null)
  const [calling, setCalling] = useState(false)
  const [forcedCall, setForcedCall] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [attention, setAttention] = useState(false)
  const [resolved, setResolved] = useState<Record<string, Resolution>>({})
  const search = useRef<HTMLInputElement>(null)
  const wasRunning = useRef(false)

  // a resolved review item takes its new outcome everywhere: tally, table, map, report
  const all = useMemo<Listing[]>(() => [...LISTINGS, ...yours].map((l) => {
    const r = resolved[l.id]
    return r ? { ...l, result: { ...l.result, ...RESOLVED[r.action] } } : l
  }), [yours, resolved])

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (view === 'empty' ? [] : all).filter((l) =>
      (!filter || (l.result.outcome === filter && phaseOf(l, t, mode) === 'done')) &&
      (!needle || `${l.provider} ${l.practice} ${l.district} ${l.grid} ${l.address}`.toLowerCase().includes(needle)))
  }, [all, filter, q, t, mode, view])

  const tally = tallyAt(all, t, mode)
  const lines = linesAt(all, t, mode, META.lines)
  const reviewItems = all.filter((l) => l.result.outcome === 'review' && !resolved[l.id] && phaseOf(l, t, mode) === 'done')
  const current = selected ? all.find((l) => l.id === selected.id) ?? null : null

  const url = (mut: (p: URLSearchParams) => void) => { const p = new URLSearchParams(location.search); mut(p); history.replaceState(null, '', p.size ? `?${p}` : location.pathname) }
  const open = useCallback((id: string, field?: FieldKey) => { setSelected({ id, field }); url((p) => p.set('listing', id)) }, [])
  const closeDrawer = useCallback(() => { setSelected(null); url((p) => p.delete('listing')) }, [])
  const answer = useCallback(() => { stopClip(); setSelected(null); setCalling(true) }, [])
  const runSweep = useCallback(() => { if (mode === 'running') sweep.skip(); else { setFilter(null); setTab('directory'); sweep.start() } }, [mode, sweep])
  const toggleMute = useCallback(() => setMuted((m) => { persistMuted(!m); return !m }), [])

  // URL state on arrival
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    setMuted(isMuted())
    try { setResolved(JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}')) } catch {}
    const tabParam = p.get('tab'); if (tabParam === 'review' || tabParam === 'report') setTab(tabParam)
    if (p.get('pane') === 'map') setPane('map')
    const id = p.get('listing'); if (id) setSelected({ id })
    if (p.has('call')) { setForcedCall(p.get('state')); setCalling(true) }
  }, [])

  // the moment the sweep completes: stamp, and one nudge toward the call
  useEffect(() => {
    if (mode === 'running') wasRunning.current = true
    if (mode === 'done' && wasRunning.current) { wasRunning.current = false; if (!new URLSearchParams(location.search).has('embed')) stamp(); setAttention(true); const id = setTimeout(() => setAttention(false), 1400); return () => clearTimeout(id) }
  }, [mode])

  // single-key shortcuts; key-triggered actions don't animate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault(); clearYourRows(); setResolved({}); try { localStorage.removeItem(REVIEW_KEY) } catch {}; setSelected(null); setFilter(null); setQ(''); sweep.reset(); toast('Demo reset'); return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || el.closest('input, textarea, dialog')) return
      if (e.key === 'r') runSweep()
      if (e.key === 'a') answer()
      if (e.key === 'm') toggleMute()
      if (e.key === '/') { e.preventDefault(); setTab('directory'); search.current?.focus() }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [answer, runSweep, sweep, toggleMute])

  const resolve = useCallback((id: string, r: Resolution) => {
    setResolved((prev) => {
      const next = { ...prev, [id]: r }
      try { localStorage.setItem(REVIEW_KEY, JSON.stringify(next)) } catch {}
      return next
    })
    toast(r.action === 'keep' ? 'Kept as listed' : r.action === 'apply' ? 'Change applied' : 'Callback scheduled for Tue 2:00 PM', {
      action: { label: 'Undo', onClick: () => setResolved((prev) => { const next = { ...prev }; delete next[id]; try { localStorage.setItem(REVIEW_KEY, JSON.stringify(next)) } catch {}; return next }) }, duration: 6000,
    })
  }, [])

  return (
    <div className="flex min-h-dvh flex-col lg:h-[max(100dvh,960px)]">
      <TopBar mode={mode} done={tally.done} total={LISTINGS.length} muted={muted} attention={attention} onSweep={runSweep} onAnswer={answer} onMute={toggleMute} />
      <NoticeStrip running={mode === 'running'} />
      <main className="flex min-h-0 flex-1 flex-col gap-3 p-4 pb-24 sm:gap-4 sm:p-6 sm:pb-6">
        <h1 className="sr-only">Rollcall: directory sweep console</h1>
        <Tally tally={tally} listings={all} t={t} mode={mode} filter={filter} onFilter={(o) => { setFilter(o); setTab('directory') }} onOpen={open} />
        <Switchboard lines={lines} active={mode === 'running'} called={mode === 'done' ? LISTINGS.length : 0} onOpen={open} />
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line">
          <Tabs<Tab> value={tab} onChange={(v) => { setTab(v); url((p) => (v === 'directory' ? p.delete('tab') : p.set('tab', v))) }}
            tabs={[{ id: 'directory', label: 'Directory', count: all.length }, { id: 'review', label: 'Needs a human', count: reviewItems.length }, { id: 'report', label: 'Report' }]} />
          {tab === 'directory' && <div className="pb-1 max-sm:w-full"><FilterBar ref={search} q={q} onQ={setQ} filter={filter} onFilter={setFilter} /></div>}
        </div>
        {tab === 'directory' && (
          <>
            <div role="tablist" aria-label="View" className="grid grid-cols-2 rounded-md border border-line bg-surface-1 p-0.5 lg:hidden">
              {(['list', 'map'] as const).map((p) => <button key={p} role="tab" aria-selected={pane === p} type="button" onClick={() => setPane(p)} className={`h-9 rounded-sm text-[13px] font-semibold capitalize ${pane === p ? 'bg-ink text-canvas' : 'text-ink-muted'}`}>{p}</button>)}
            </div>
            <div className="flex min-h-[420px] flex-1 gap-4 max-lg:min-h-0">
              <div className={`min-h-0 min-w-0 flex-1 ${pane === 'map' ? 'max-lg:hidden' : 'flex'} lg:flex max-lg:h-[62dvh]`}>
                <DirectoryTable listings={visible} t={t} mode={mode} view={view} q={q} selected={selected?.id ?? null} onOpen={open} onClearFilter={() => { setFilter(null); setQ('') }} />
              </div>
              <div className={`${pane === 'list' ? 'max-lg:hidden' : 'flex w-full'} min-h-0 shrink-0 flex-col gap-4 lg:side lg:flex lg:w-[360px] wide:w-[480px]`}>
                <AreaMap listings={all} t={t} mode={mode} selected={selected?.id ?? null} onOpen={open} />
                <CallLog listings={all} t={t} mode={mode} onOpen={open} />
              </div>
            </div>
          </>
        )}
        {tab === 'review' && <ReviewQueue items={reviewItems} swept={mode === 'done'} onResolve={resolve} onOpen={open} />}
        {tab === 'report' && <ReportSheet listings={all} swept={mode === 'done'} />}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface-1 p-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:hidden">
        <Button variant="primary" icon={<Phone size={18} weight="fill" />} onClick={answer} className="h-12 w-full text-[15px]">Answer a call</Button>
      </div>

      <ListingDrawer listing={current} field={selected?.field} t={t} mode={mode} resolution={current ? resolved[current.id] : undefined} onResolve={resolve} onClose={closeDrawer} />
      <CallSheet open={calling} forced={forcedCall} onClose={() => { setCalling(false); setForcedCall(null); url((p) => { p.delete('call'); p.delete('state') }) }}
        onRow={(n) => { setTab('directory'); setFilter(null); setQ(''); open(`L-${String(n).padStart(3, '0')}`) }} />
    </div>
  )
}
