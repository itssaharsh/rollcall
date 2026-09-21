'use client'
import { ArrowCounterClockwise, FastForward, Phone, Play, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import Link from 'next/link'
import { Lockup } from '@/components/brand/Logo'
import { Tip } from '@/components/ui/Bits'
import { Button, IconButton, Kbd } from '@/components/ui/Button'
import { META } from '@/lib/seed'
import type { Mode } from '@/lib/sweep-engine'

export function TopBar({ mode, done, total, muted, attention, onSweep, onAnswer, onMute }: {
  mode: Mode; done: number; total: number; muted: boolean; attention: boolean; onSweep: () => void; onAnswer: () => void; onMute: () => void
}) {
  const label = mode === 'before' ? 'Start sweep' : mode === 'running' ? `Sweeping… ${done}/${total}` : 'Replay sweep'
  const Icon = mode === 'before' ? Play : mode === 'running' ? FastForward : ArrowCounterClockwise
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-line bg-surface-1 px-4 sm:px-6">
      <Link href="/" aria-label="Rollcall console" className="rounded-sm"><Lockup size={20} /></Link>
      <span className="hidden h-5 w-px bg-line lg:block" />
      <p className="hidden min-w-0 truncate text-[13px] text-ink-muted lg:block">{META.plan} · {META.network} · {total} listings · {META.county}</p>
      <div className="ml-auto flex items-center gap-2">
        <Tip text={mode === 'running' ? 'Skip to the end' : 'R'}>
          <Button onClick={onSweep} icon={<Icon size={14} weight="fill" />} className="tnum min-w-[138px] max-sm:min-w-0 max-sm:px-2.5 [&>span]:max-sm:sr-only">{label}</Button>
        </Tip>
        <Button variant="primary" onClick={onAnswer} icon={<Phone size={16} weight="fill" />} className={`max-sm:hidden ${attention ? 'attention' : ''}`}>Answer a call <Kbd>A</Kbd></Button>
        <IconButton label={muted ? 'Turn sound on (M)' : 'Turn sound off (M)'} aria-pressed={muted} onClick={onMute}>{muted ? <SpeakerSlash size={16} /> : <SpeakerHigh size={16} />}</IconButton>
        <Link href="/about" className="rounded-sm px-2 text-[13px] font-medium text-ink-muted transition-colors duration-150 hover:text-ink">About</Link>
      </div>
    </header>
  )
}

export function NoticeStrip({ running }: { running?: boolean }) {
  return (
    <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-6 gap-y-0.5 bg-surface-2 px-4 py-1.5 sm:px-6" role="note">
      <span className="t-label text-ink">Simulated offices — no real clinics were called</span>
      <span className="t-label text-ink-muted">{running ? `Recorded sweep · replaying at ${META.speed}×` : `Recorded sweep · ${META.sweepDate}`}</span>
    </div>
  )
}
