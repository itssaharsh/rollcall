'use client'
import { motion } from 'motion/react'
import { Lamp, StatusStamp, VoiceBars } from '@/components/ui/Bits'
import { clock } from '@/lib/format'
import type { Line } from '@/lib/sweep-engine'

const LABEL: Record<Line['state'], string> = { idle: 'Idle', dialing: 'Dialing', connected: 'On call', hold: 'On hold', voicemail: 'No person', ended: 'Ended' }

export function LineCard({ line, onOpen }: { line: Line; onOpen?: (id: string) => void }) {
  const l = line.listing
  const lamp = line.state === 'dialing' ? 'ringing' : line.state === 'idle' || line.state === 'ended' ? 'off' : 'connected'
  const speaking = line.state === 'connected' && line.caption && line.caption.who !== 'system'
  return (
    <button type="button" disabled={!l} onClick={() => l && onOpen?.(l.id)} aria-label={l ? `Line ${line.n}: ${l.practice}, ${LABEL[line.state]}` : `Line ${line.n} idle`}
      className="flex h-[116px] min-w-0 flex-col gap-1 rounded-md border border-line bg-surface-1 p-3 text-left transition-colors duration-150 enabled:hover:bg-surface-2 disabled:cursor-default max-sm:w-[260px] max-sm:shrink-0 max-sm:snap-start">
      <span className="flex w-full items-center gap-2">
        <Lamp state={lamp} />
        <span className="t-label text-ink-muted">Line {line.n}</span>
        <span className="t-mono ml-auto text-ink-muted">{line.state === 'idle' ? '' : line.state === 'dialing' ? 'dialing' : clock(line.elapsed)}</span>
      </span>
      <span className="t-listing w-full truncate font-semibold">{l ? l.practice : 'Idle'}</span>
      <span className="line-clamp-2 min-h-[32px] w-full text-[12px] leading-[16px] text-ink-muted">
        {line.state === 'dialing' && l ? <span className="t-mono">{l.phone}</span>
          : line.state === 'ended' && l ? <StatusStamp outcome={l.result.outcome} text={l.result.stamp} />
          : line.caption ? <><span className="font-semibold text-ink">{line.caption.who === 'agent' ? 'Rollcall: ' : line.caption.who === 'office' ? 'Office: ' : ''}</span>{line.caption.text}</>
          : null}
      </span>
      <span className="mt-auto"><VoiceBars active={!!speaking} tone={line.caption?.who === 'office' ? 'accent' : 'ink'} count={18} height={14} /></span>
    </button>
  )
}

export function Switchboard({ lines, active, called, onOpen }: { lines: Line[]; active: boolean; called: number; onOpen: (id: string) => void }) {
  return (
    <motion.section layout aria-label="Phone lines" transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.1 }} className="overflow-hidden">
      {active ? (
        <div className="grid grid-cols-6 gap-2 max-lg:grid-cols-3 max-sm:flex max-sm:snap-x max-sm:overflow-x-auto max-sm:pb-1">
          {lines.map((line) => <LineCard key={line.n} line={line} onOpen={onOpen} />)}
        </div>
      ) : (
        <div className="flex h-10 items-center gap-3 rounded-md border border-line bg-surface-1 px-3">
          <span className="flex gap-1.5">{lines.map((l) => <Lamp key={l.n} state="off" />)}</span>
          <span className="t-label text-ink-muted">{lines.length} lines idle{called ? ` · last sweep ${called} calls` : ''}</span>
        </div>
      )}
    </motion.section>
  )
}
