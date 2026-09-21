'use client'
import { useState } from 'react'
import { useActiveClipKey } from '@/lib/clip'
import { phaseOf, type Mode, type Phase } from '@/lib/sweep-engine'
import { OUTCOME_LABEL, OUTCOME_ORDER, type Listing, type Outcome } from '@/lib/types'

const W = 1000, H = 760
const RIVER = 'M540,-10 C525,50 505,95 500,120 C492,170 462,205 470,250 C480,300 535,340 560,380 C585,420 612,440 600,470 C588,510 545,560 540,600 C536,650 562,710 570,770'
const V_ROADS = [60, 118, 171, 236, 290, 352, 410, 465, 528, 590, 644, 702, 765, 820, 884, 940]
const H_ROADS = [48, 102, 160, 214, 276, 330, 392, 446, 505, 560, 622, 676, 730]
const DISTRICTS: [string, number, number][] = [['Northgate', 235, 92], ['Quarry Heights', 770, 100], ['Old Mill', 190, 352], ['Harbor', 418, 548], ['Eastbank', 830, 408], ['Fernhill', 250, 640], ['Saltmarsh', 800, 660]]

function PinShape({ outcome }: { outcome: Outcome }) {
  switch (outcome) {
    case 'confirmed': return <circle r="7" fill="var(--oc)" stroke="var(--surface-1)" strokeWidth="2" />
    case 'corrected': return <rect x="-6.5" y="-6.5" width="13" height="13" transform="rotate(45)" fill="var(--oc)" stroke="var(--surface-1)" strokeWidth="2" />
    case 'ghost': return <g><circle r="7.5" fill="var(--surface-1)" stroke="var(--oc)" strokeWidth="2.5" /><path d="M-3.5-3.5l7 7M3.5-3.5l-7 7" stroke="var(--oc)" strokeWidth="2.5" strokeLinecap="round" /></g>
    case 'review': return <path d="M0-9l8.5 14.5h-17z" fill="var(--oc)" stroke="var(--surface-1)" strokeWidth="2" strokeLinejoin="round" />
    case 'retry': return <circle r="6.5" fill="var(--surface-1)" stroke="var(--oc)" strokeWidth="2.5" strokeDasharray="4 3" />
  }
}

function Pin({ l, phase, selected, pulsing, animate, onOpen, onHover }: { l: Listing; phase: Phase; selected: boolean; pulsing: boolean; animate: boolean; onOpen: (id: string) => void; onHover: (l: Listing | null) => void }) {
  const live = phase === 'dialing' || phase === 'live'
  return (
    <g transform={`translate(${l.x} ${l.y})`} role="button" tabIndex={0} aria-label={`${l.provider}, ${phase === 'done' ? OUTCOME_LABEL[l.result.outcome] : live ? 'on a call' : 'not called yet'}`}
      data-outcome={l.result.outcome} className="cursor-pointer outline-none [&:focus-visible>.halo]:opacity-100"
      onClick={() => onOpen(l.id)} onKeyDown={(e) => e.key === 'Enter' && onOpen(l.id)}
      onMouseEnter={() => onHover(l)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(l)} onBlur={() => onHover(null)}>
      <circle r="16" fill="transparent" />
      <circle className="halo" r="13" fill="none" stroke="var(--ink)" strokeWidth="2" opacity={selected ? 1 : 0} />
      {phase === 'done' ? (
        <g key="done" className={`${animate ? 'pin-drop' : ''} ${pulsing ? 'pin-pulse' : ''}`}><PinShape outcome={l.result.outcome} /></g>
      ) : live ? (
        <g key="live"><circle className="pin-ring" r="7" fill="none" stroke="var(--lamp-ringing)" strokeWidth="2" /><circle r="5.5" fill="var(--lamp-ringing)" stroke="var(--surface-1)" strokeWidth="1.5" /></g>
      ) : (
        <circle key="stale" r="4" fill="var(--surface-1)" stroke="var(--line-strong)" strokeWidth="1.5" />
      )}
    </g>
  )
}

export function AreaMap({ listings, t, mode, selected, onOpen }: { listings: Listing[]; t: number; mode: Mode; selected: string | null; onOpen: (id: string) => void }) {
  const [hover, setHover] = useState<Listing | null>(null)
  const clipKey = useActiveClipKey()
  const pulsingId = clipKey?.split(':')[0]
  const label = hover ?? listings.find((l) => l.id === selected) ?? null
  return (
    <section aria-label="Area map" className="flex w-full shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-surface-1">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="group" aria-label="Marlow County, pins show each listing's result">
          <defs><clipPath id="frame"><rect width={W} height={H} /></clipPath></defs>
          <g clipPath="url(#frame)">
            <rect width={W} height={H} fill="var(--surface-1)" />
            <g transform={`rotate(-7 ${W / 2} ${H / 2})`}>
              <path d="M70 250h180v120H70z M300 600h150v110H300z M700 80h170v95H700z M760 470h140v80H760z" fill="var(--park)" />
              {V_ROADS.map((x) => <line key={x} x1={x} y1={-80} x2={x} y2={H + 80} stroke="var(--line)" strokeWidth="1.5" />)}
              {H_ROADS.map((y) => <line key={y} x1={-80} y1={y} x2={W + 80} y2={y} stroke="var(--line)" strokeWidth="1.5" />)}
              {[236, 644, 884].map((x) => <line key={x} x1={x} y1={-80} x2={x} y2={H + 80} stroke="var(--line-strong)" strokeWidth="3.5" />)}
              {[214, 505].map((y) => <line key={y} x1={-80} y1={y} x2={W + 80} y2={y} stroke="var(--line-strong)" strokeWidth="3.5" />)}
              <line x1="-40" y1="700" x2="720" y2="-60" stroke="var(--line-strong)" strokeWidth="3.5" />
            </g>
            <path d={RIVER} fill="none" stroke="var(--surface-1)" strokeWidth="78" />
            <path d={RIVER} fill="none" stroke="var(--river)" strokeWidth="58" strokeLinecap="round" />
            <text className="map-text" fontSize="15" fill="var(--ink-muted)" opacity=".75" transform="translate(532 470) rotate(68)" textAnchor="middle">Marlow River</text>
            {/* index grid: the directory's map references */}
            {[1, 2, 3, 4, 5].map((i) => <line key={'v' + i} x1={(W / 6) * i} y1="0" x2={(W / 6) * i} y2={H} stroke="var(--ink)" strokeOpacity=".16" strokeDasharray="3 7" />)}
            {[1, 2, 3, 4].map((i) => <line key={'h' + i} x1="0" y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke="var(--ink)" strokeOpacity=".16" strokeDasharray="3 7" />)}
            {'ABCDEF'.split('').map((c, i) => <text key={c} x={(W / 6) * (i + 0.5)} y="22" textAnchor="middle" fontSize="17" className="map-text" fill="var(--ink-muted)">{c}</text>)}
            {[1, 2, 3, 4, 5].map((r, i) => <text key={r} x="14" y={(H / 5) * (i + 0.5) + 6} fontSize="17" className="map-text" fill="var(--ink-muted)">{r}</text>)}
            {DISTRICTS.map(([name, x, y]) => <text key={name} x={x} y={y} textAnchor="middle" fontSize="19" className="map-text" fill="var(--ink)" opacity=".5" style={{ paintOrder: 'stroke', stroke: 'var(--surface-1)', strokeWidth: 6 }}>{name}</text>)}
          </g>
          {listings.map((l) => (
            <Pin key={l.id} l={l} phase={phaseOf(l, t, mode)} selected={selected === l.id} pulsing={pulsingId === l.id} animate={mode === 'running' || !!l.yours} onOpen={onOpen} onHover={setHover} />
          ))}
        </svg>
        {label && (
          <div className="pointer-events-none absolute z-10 max-w-[220px] -translate-x-1/2 rounded-sm bg-ink px-2 py-1 text-canvas"
            style={{ left: `${Math.min(78, Math.max(22, (label.x / W) * 100))}%`, top: `calc(${(label.y / H) * 100}% + 14px)` }}>
            <span className="t-listing block truncate font-semibold">{label.provider}</span>
            <span className="t-mono block truncate opacity-80">{label.grid} · {phaseOf(label, t, mode) === 'done' ? label.result.reason ?? OUTCOME_LABEL[label.result.outcome] : 'not called yet'}</span>
          </div>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line px-4 py-3 text-[12px] text-ink-muted sm:grid-cols-3">
        {OUTCOME_ORDER.map((o) => (
          <li key={o} data-outcome={o} className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="-11 -11 22 22" aria-hidden><PinShape outcome={o} /></svg>{OUTCOME_LABEL[o]}
          </li>
        ))}
        <li className="flex items-center gap-2"><svg width="18" height="18" viewBox="-11 -11 22 22" aria-hidden><circle r="4" fill="var(--surface-1)" stroke="var(--line-strong)" strokeWidth="1.5" /></svg>Not called yet</li>
      </ul>
    </section>
  )
}
