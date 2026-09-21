'use client'
import type { ReactNode } from 'react'
import { Glyph } from '@/components/brand/glyphs'
import type { Outcome } from '@/lib/types'

export function StatusStamp({ outcome, text, large, land }: { outcome: Outcome; text: string; large?: boolean; land?: boolean }) {
  return (
    <span data-outcome={outcome}
      className={`t-label inline-flex shrink-0 items-center rounded-sm border border-[var(--oc)] bg-[color-mix(in_oklch,var(--oc)_12%,transparent)] text-[var(--oc)] ${large ? `h-10 px-3 text-[14px] -rotate-[4deg] ${land ? 'stamp-land' : ''}` : 'h-[22px] px-2'}`}>
      {text}
    </span>
  )
}

export function StatusMark({ outcome, draw }: { outcome: Outcome; draw?: boolean }) {
  return <span data-outcome={outcome} className="inline-flex text-[var(--oc)]"><Glyph name={outcome} draw={draw} /></span>
}

export function Lamp({ state }: { state: 'off' | 'ringing' | 'connected' }) {
  return (
    <span aria-hidden className={`inline-block size-[10px] shrink-0 rounded-full border ${state === 'off' ? 'border-line-strong bg-surface-2' : state === 'ringing' ? 'lamp-blink border-transparent bg-lamp-ringing' : 'border-transparent bg-lamp-connected'}`} />
  )
}

export function VoiceBars({ active, tone = 'ink', count = 20, height = 16 }: { active: boolean; tone?: 'ink' | 'accent'; count?: number; height?: number }) {
  return (
    <span aria-hidden className="flex items-end gap-[2px]" style={{ height }}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`w-[3px] rounded-[1px] ${tone === 'accent' ? 'bg-accent' : 'bg-ink'} ${active ? 'bar' : ''}`}
          style={active ? { height: '100%', animationDelay: `${-((i * 137) % 900)}ms`, animationDuration: `${700 + ((i * 53) % 500)}ms` } : { height: 2, opacity: 0.35 }} />
      ))}
    </span>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 p-8 text-center">
      <span className="text-ink-muted"><Glyph name="register" size={24} /></span>
      <h3 className="text-[16px] font-semibold">{title}</h3>
      <p className="max-w-[44ch] text-ink-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Tip({ text, children, side = 'bottom' }: { text: string; children: ReactNode; side?: 'bottom' | 'top' }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span role="tooltip" className={`t-mono pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-canvas opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100 group-hover/tip:delay-500 group-focus-within/tip:opacity-100 ${side === 'bottom' ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]'}`}>{text}</span>
    </span>
  )
}
