'use client'
import { Phone, Play, X } from '@phosphor-icons/react'
import { Glyph } from '@/components/brand/glyphs'
import { Lockup, Mark } from '@/components/brand/Logo'
import { ClipPlayer } from '@/components/console/ClipPlayer'
import { FieldCell } from '@/components/console/DirectoryTable'
import { LineCard } from '@/components/console/Switchboard'
import { EmptyState, Lamp, StatusMark, StatusStamp, Tip, VoiceBars } from '@/components/ui/Bits'
import { Button, IconButton, Kbd } from '@/components/ui/Button'
import { LISTINGS } from '@/lib/seed'
import type { Line } from '@/lib/sweep-engine'
import { OUTCOME_LABEL, OUTCOME_ORDER } from '@/lib/types'

const TOKENS = ['canvas', 'surface-1', 'surface-2', 'line', 'line-strong', 'ink', 'ink-muted', 'accent', 'accent-soft', 'success', 'warning', 'danger', 'lamp-ringing', 'lamp-connected', 'river', 'park']
const l14 = LISTINGS[13], l9 = LISTINGS[8], l3 = LISTINGS[2]
const quote = (l: typeof l14) => l.call.turns.find((x) => x.who === 'office' && x.t0 > 5)!
const LINES: Line[] = [
  { n: 1, state: 'idle', elapsed: 0 },
  { n: 2, state: 'dialing', listing: l3, elapsed: 0 },
  { n: 3, state: 'connected', listing: l3, caption: l3.call.turns[1], elapsed: 12 },
  { n: 4, state: 'hold', listing: LISTINGS[3], caption: { who: 'system', t0: 0, t1: 1, text: 'On hold' }, elapsed: 21 },
  { n: 5, state: 'voicemail', listing: LISTINGS[27], caption: LISTINGS[27].call.turns[0], elapsed: 8 },
  { n: 6, state: 'ended', listing: l14, elapsed: 23 },
]

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-line py-8"><h2 className="t-label mb-4 text-ink-muted">{title}</h2>{children}</section>
)

export function Kit() {
  return (
    <main className="mx-auto max-w-[1100px] overflow-x-hidden p-6">
      <h1 className="t-display text-[32px]">Rollcall kit</h1>
      <p className="text-ink-muted">Every component, every state. Direction: Register.</p>

      <Block title="Logo candidates at 16 / 32 / 128 — chosen: 1">
        <div className="flex flex-wrap items-end gap-10">
          {([1, 2, 3] as const).map((v) => (
            <div key={v} className="flex items-end gap-4"><Mark size={16} variant={v} /><Mark size={32} variant={v} /><Mark size={128} variant={v} /><span className="t-mono text-ink-muted">{v}</span></div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-10"><Lockup size={28} /><span className="rounded-md bg-[#111A2E] p-4 [--accent:#8E9BFF] [--ink:#F4F6F2]"><Lockup size={28} /></span></div>
      </Block>

      <Block title="Tokens">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{TOKENS.map((x) => <div key={x}><div className="h-12 rounded-sm border border-line" style={{ background: `var(--${x})` }} /><p className="t-mono mt-1 text-ink-muted">{x}</p></div>)}</div>
      </Block>

      <Block title="Type">
        <p className="t-display text-[44px]">Directory sweep 44</p><p className="t-display text-[32px]">Display 32 condensed 700</p><p className="t-display text-[20px]">Display 20</p>
        <p className="mt-2 text-[16px]">Body 16. The agent never writes a value it couldn’t confirm.</p><p>Body 14. Simulated offices — no real clinics were called.</p>
        <p className="t-listing">Listing 13 at 85% width: Northgate Psychiatry Associates, 1180 Kestrel Ave, Suite 300</p>
        <p className="t-mono">Mono 11 · (564) 555-0117 · 0:52 · $0.07</p><p className="t-label">Label 10 · line 3 · verified 21 sep</p>
      </Block>

      <Block title="Buttons: rest · disabled · busy">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={<Phone size={16} weight="fill" />}>Answer a call <Kbd>A</Kbd></Button><Button variant="primary" disabled title="Starting the sweep…">Answer a call</Button><Button variant="primary" busy>Saving row</Button>
          <Button icon={<Play size={14} weight="fill" />}>Start sweep</Button><Button disabled>Replay sweep</Button><Button busy>Sweeping… 23/40</Button>
          <Button variant="ghost">Cancel</Button><Button variant="danger">Hang up</Button>
          <IconButton label="Close"><X size={16} /></IconButton><Tip text="Shortcut: R"><Button>With tooltip</Button></Tip>
        </div>
      </Block>

      <Block title="Status: stamps · marks · glyphs · lamps">
        <div className="flex flex-wrap items-center gap-3">{OUTCOME_ORDER.map((o) => <StatusStamp key={o} outcome={o} text={o === 'corrected' ? 'Corrected ·2' : o === 'ghost' ? 'Remove' : o === 'retry' ? 'Retry 2PM' : o === 'review' ? 'Needs a human' : 'Confirmed'} />)}</div>
        <div className="mt-6 flex flex-wrap items-center gap-8">{OUTCOME_ORDER.map((o) => <StatusStamp key={o} outcome={o} text={OUTCOME_LABEL[o]} large />)}</div>
        <div className="mt-6 flex items-center gap-4">{OUTCOME_ORDER.map((o) => <StatusMark key={o} outcome={o} draw />)}<Glyph name="register" /><span className="ml-6 flex items-center gap-3"><Lamp state="off" /><Lamp state="ringing" /><Lamp state="connected" /></span></div>
      </Block>

      <Block title="Field cell: stale · asking · confirmed · corrected · unconfirmed · not asked">
        <div className="group/row grid max-w-[900px] grid-cols-3 gap-4 sm:grid-cols-6">
          <FieldCell k="address" cell={{ status: 'stale', value: '412 Alder St, Suite 2' }} />
          <FieldCell k="accepting" cell={{ status: 'asking', value: 'Yes' }} />
          <FieldCell k="phone" cell={{ status: 'confirmed', value: '(564) 555-0101' }} onClip={() => {}} />
          <FieldCell k="address" cell={{ status: 'corrected', value: '2310 Pruett St, Suite 1', was: '2203 Pruett St' }} onClip={() => {}} animate />
          <FieldCell k="accepting" cell={{ status: 'unconfirmed', value: 'Yes' }} onClip={() => {}} />
          <FieldCell k="inNetwork" cell={{ status: 'not_asked', value: 'Yes' }} />
        </div>
      </Block>

      <Block title="Line card: idle · dialing · connected · hold · no person · ended">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">{LINES.map((x) => <LineCard key={x.n} line={x} />)}</div>
      </Block>

      <Block title="Voice bars: agent · office · silent">
        <div className="flex items-end gap-8"><VoiceBars active height={40} count={28} /><VoiceBars active tone="accent" height={40} count={28} /><VoiceBars active={false} height={40} count={28} /></div>
      </Block>

      <Block title="Clip player: quote · hedged quote">
        <div className="grid gap-3 lg:grid-cols-2"><ClipPlayer listing={l14} turn={quote(l14)} clipKey="kit:1" /><ClipPlayer listing={l9} turn={l9.call.turns.find((x) => x.text.includes('I think'))!} clipKey="kit:2" hedge={l9.result.hedge} /></div>
      </Block>

      <Block title="Empty and error states">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-line bg-surface-1"><EmptyState title="No listings match “fernhill east”" body="Every listing is still in the register. Clear the filter to see all of them." action={<Button>Clear the filter</Button>} /></div>
          <div className="rounded-md border border-line bg-surface-1"><EmptyState title="Nothing needs a human" body="Every answer was clear enough to write down." /></div>
        </div>
      </Block>

      <Block title="Skeleton"><div className="flex max-w-[480px] flex-col gap-2"><span className="sk h-3 w-40" /><span className="sk h-3 w-64" /><span className="sk h-5 w-24" /></div></Block>
    </main>
  )
}
