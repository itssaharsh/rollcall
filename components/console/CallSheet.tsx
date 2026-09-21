'use client'
import { MicrophoneSlash, Microphone, PhoneDisconnect, PhoneIncoming, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Lamp, StatusStamp, VoiceBars } from '@/components/ui/Bits'
import { Button, IconButton, Spinner } from '@/components/ui/Button'
import { AssemblyDriver } from '@/lib/agent/assembly-driver'
import { fetchLineStatus, SimulatedDriver, type CallDriver, type CallEvent, type VoiceState } from '@/lib/call-driver'
import { clock } from '@/lib/format'
import { META, seed } from '@/lib/seed'
import { startRing, stopRing } from '@/lib/sound'
import { FIELD_LABEL, FIELD_ORDER, type FieldKey, type FieldResult, type Listing, type Turn } from '@/lib/types'
import { addYourRow } from '@/lib/your-rows'

export type CallState = 'invite' | 'permission' | 'ringing' | 'connected' | 'wrap' | 'done' | 'mic-denied' | 'unavailable' | 'quota' | 'dropped' | 'capped'
const STATES: CallState[] = ['invite', 'permission', 'ringing', 'connected', 'wrap', 'done', 'mic-denied', 'unavailable', 'quota', 'dropped', 'capped']
/** A person answers more slowly than a scripted front desk: measured calls run 60 to 110 seconds. */
const CAP = 150
const HURRY_AT = CAP - 25
const office = seed.yourCall.listing
const SUGGESTIONS = ['“It’s all correct.”', '“She left in March.”', '“Not taking new patients.”', '“Can you hold?”', '“You’ve got the wrong number.”']
const VOICE: Record<VoiceState, string> = { agent: 'Rollcall is speaking', listening: 'Listening', thinking: 'Thinking' }

const NOTICE: Partial<Record<CallState, { title: string; body: string }>> = {
  'mic-denied': { title: 'The microphone is blocked', body: 'Allow it from the address bar and try again, or watch a sample call.' },
  unavailable: { title: 'Live calls are switched off in this preview', body: 'The line opens once the recorded sweep is in. Until then, watch a sample call: same agent script, a scripted front desk.' },
  quota: { title: 'Today’s live-call budget is used up', body: 'Calls cost real minutes, so the demo caps them each day. Watch a recorded call instead.' },
  dropped: { title: 'The line dropped', body: 'Nothing was saved. Call again?' },
}

export function CallSheet({ open, forced, onClose, onRow }: { open: boolean; forced?: string | null; onClose: () => void; onRow: (n: number) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const driver = useRef<CallDriver | null>(null)
  const [live, setLive] = useState(false)
  const [state, setState] = useState<CallState>('invite')
  const [voice, setVoice] = useState<VoiceState>('listening')
  const [turns, setTurns] = useState<Turn[]>([])
  const [partial, setPartial] = useState<{ who: 'agent' | 'office'; text: string } | null>(null)
  const [fields, setFields] = useState<Partial<Record<FieldKey, FieldResult>>>({})
  const [muted, setMuted] = useState(false)
  const [secs, setSecs] = useState(0)
  const [row, setRow] = useState<number | null>(null)
  const [stampText, setStampText] = useState('')

  const hangUp = useCallback(() => { driver.current?.stop(); driver.current = null; stopRing() }, [])

  const reset = useCallback((to: CallState = 'invite') => {
    hangUp(); setTurns([]); setPartial(null); setFields({}); setSecs(0); setRow(null); setMuted(false); setState(to)
  }, [hangUp])

  useEffect(() => {
    const d = ref.current; if (!d) return
    if (open && !d.open) {
      reset('invite')
      // the live line is open only when the server has a key and budget left
      if (!forced) void fetchLineStatus().then((st) => { setLive(st.live); if (!st.live) setState((cur) => (cur === 'invite' ? st.reason : cur)) })
      // QA: ?call=1&state=<name> pins the sheet to one state with sample content
      if (forced && STATES.includes(forced as CallState)) {
        const s = forced as CallState
        const sample = seed.yourCall.sample
        if (s === 'connected' || s === 'wrap' || s === 'done' || s === 'capped') {
          const shown = sample.turns.filter((x) => x.who !== 'tool').slice(0, s === 'connected' ? 5 : 99)
          setTurns(shown); setSecs(s === 'connected' ? 24 : Math.round(sample.duration))
          setFields(s === 'connected' ? { practising: sample.result.fields.practising } : sample.result.fields)
          if (s === 'connected') { setVoice('agent'); setPartial({ who: 'agent', text: 'Thanks. We list the office at 88 Juniper Row,' }) }
          if (s === 'done') { setRow(41); setStampText(sample.result.stamp) }
        }
        setState(s)
      }
      d.showModal()
    }
    if (!open && d.open) d.close()
  }, [open, forced, reset])

  // call timer and the 90 second cap
  useEffect(() => {
    if (state !== 'connected' || forced) return
    const id = setInterval(() => setSecs((s) => {
      if (s + 1 === HURRY_AT) driver.current?.hurry?.()
      // at the cap the call still ends properly: whatever was captured becomes the row
      if (s + 1 >= CAP) { setState('capped'); setTimeout(() => driver.current?.wrapUp(), 1600) }
      return s + 1
    }), 1000)
    return () => clearInterval(id)
  }, [state, forced, hangUp])

  const finish = useCallback((e: Extract<CallEvent, { type: 'end' }>, sample: boolean) => {
    setState('wrap'); setPartial(null)
    setTimeout(() => {
      const listing: Listing = { ...office, tag: sample ? 'Sample call' : 'Your call', result: e.result, call: { line: 7, startAt: 0, duration: e.duration, answeredBy: 'person', turns: e.turns, audio: e.audio } }
      setRow(addYourRow(listing)); setStampText(e.result.stamp); setState('done')
    }, 1100)
  }, [])

  const connect = useCallback((sample: boolean) => {
    stopRing()
    const d: CallDriver = sample ? new SimulatedDriver() : new AssemblyDriver(office, META.plan)
    driver.current = d
    d.on((e) => {
      if (e.type === 'voice') setVoice(e.state)
      if (e.type === 'partial') setPartial({ who: e.who, text: e.text })
      if (e.type === 'turn') { setTurns((x) => [...x, e.turn]); setPartial(null) }
      if (e.type === 'field') setFields((x) => ({ ...x, [e.key]: e.result }))
      if (e.type === 'end') finish(e, sample)
      if (e.type === 'error') setState(e.code)
    })
    setState('connected'); d.start()
  }, [finish])

  const ring = useCallback((sample: boolean) => {
    setState('ringing'); startRing()
    if (sample) setTimeout(() => connect(true), 1900)
  }, [connect])

  const answer = useCallback(async () => {
    setState('permission')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((x) => x.stop())
      ring(false)
    } catch { setState('mic-denied') }
  }, [ring])

  const close = () => ref.current?.close()
  const spoken = turns.filter((x) => x.who !== 'tool').slice(-3)
  const notice = NOTICE[state]

  return (
    <dialog ref={ref} className="sheet h-[560px] w-[780px] max-w-[calc(100vw-24px)] max-sm:h-dvh max-sm:max-w-full" aria-label="Verification call"
      onClose={() => { hangUp(); onClose() }}
      onCancel={(e) => { if (state === 'connected' && !confirm('Hang up and close?')) e.preventDefault() }}>
      <div className="flex h-full flex-col overflow-hidden rounded-lg bg-surface-1 shadow-float max-sm:rounded-none">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
          <Lamp state={state === 'ringing' ? 'ringing' : state === 'connected' ? 'connected' : 'off'} />
          <span className="t-label text-ink-muted">Line 7 · verification call</span>
          <span className="t-mono ml-auto text-ink-muted">{state === 'connected' || state === 'capped' ? `${clock(secs)} / ${clock(CAP)}` : ''}</span>
          <IconButton label="Close (Esc)" onClick={() => (state === 'connected' ? confirm('Hang up and close?') && close() : close())}><X size={16} /></IconButton>
        </header>
        <p className="t-label shrink-0 bg-surface-2 px-4 py-1.5 text-ink">Simulated offices — no real clinics were called</p>

        <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[1fr_320px]">
          {/* the line */}
          <div className="flex min-h-0 flex-col p-5">
            {state === 'invite' && (
              <Panel title="Your turn: be the front desk" body="Rollcall will call you about one listing. Answer however you like: be helpful, be vague, put it on hold. What you say becomes row 41.">
                <Button variant="primary" icon={<PhoneIncoming size={16} weight="fill" />} onClick={answer}>Answer</Button>
                <Button onClick={() => ring(true)}>Watch a sample call</Button>
              </Panel>
            )}
            {notice && (
              <Panel title={notice.title} body={notice.body}>
                {state === 'dropped' || state === 'mic-denied' ? <Button variant="primary" onClick={answer}>{state === 'dropped' ? 'Call again' : 'Try again'}</Button> : null}
                <Button variant={state === 'unavailable' || state === 'quota' ? 'primary' : 'secondary'} onClick={() => ring(true)}>Watch a sample call</Button>
              </Panel>
            )}
            {state === 'permission' && <Panel title="Allow the microphone to pick up" body="Your browser is asking. Nothing is recorded outside this call."><span className="flex items-center gap-2 text-ink-muted"><Spinner /> Waiting for the browser…</span></Panel>}
            {state === 'ringing' && (
              <Panel title="Ringing…" body={`${office.phone} · ${office.practice}`}>
                {live ? <Button variant="primary" icon={<PhoneIncoming size={16} weight="fill" />} onClick={() => connect(false)}>Pick up</Button> : <span className="text-ink-muted">The sample front desk is picking up.</span>}
              </Panel>
            )}
            {(state === 'connected' || state === 'capped') && (
              <>
                <div className="flex items-center gap-3">
                  <span className="t-display text-[20px]">{state === 'capped' ? 'Calls are capped at two and a half minutes in this demo' : VOICE[voice]}</span>
                  {voice === 'thinking' && state === 'connected' && <span className="asking t-mono text-accent">···</span>}
                </div>
                <div className="mt-3"><VoiceBars active={voice !== 'thinking' && state === 'connected'} tone={voice === 'agent' ? 'ink' : 'accent'} count={28} height={40} /></div>
                <ol className="mt-4 flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-hidden" aria-live="polite">
                  {spoken.map((x) => <Caption key={x.t0} who={x.who === 'agent' ? 'agent' : 'office'} text={x.text} />)}
                  {partial && <Caption who={partial.who} text={partial.text} live />}
                </ol>
                <div className="mt-4 flex h-14 shrink-0 items-center gap-2 border-t border-line pt-3">
                  <Button aria-pressed={muted} icon={muted ? <MicrophoneSlash size={16} /> : <Microphone size={16} />} onClick={() => { setMuted(!muted); driver.current?.setMuted(!muted) }}>{muted ? 'Unmute' : 'Mute'}</Button>
                  <Button variant="danger" icon={<PhoneDisconnect size={16} weight="fill" />} onClick={() => (turns.length ? driver.current?.wrapUp() : reset(live ? 'invite' : 'unavailable'))}>Hang up</Button>
                </div>
              </>
            )}
            {state === 'wrap' && <Panel title="Writing results…" body="Each answer goes into the listing with the words you said next to it."><span className="flex items-center gap-2 text-ink-muted"><Spinner /> Saving row</span></Panel>}
            {state === 'done' && (
              <Panel title={`Added as row ${row ?? 41}`} body="Open the row to read the call back, line by line, with a clip on every answer.">
                <Button variant="primary" onClick={() => { close(); if (row) onRow(row) }}>See it in the directory</Button>
                <Button onClick={() => { reset('invite'); ring(!live) }}>Call again</Button>
              </Panel>
            )}
          </div>

          {/* your office */}
          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto border-line bg-canvas/60 p-5 max-sm:border-t sm:border-l">
            <div>
              <p className="t-label text-ink-muted">You’re the front desk at</p>
              <p className="t-display mt-1 text-[18px]">{office.practice}</p>
              <p className="t-listing text-ink-muted">About {office.provider}, {office.credential} · {office.address}</p>
            </div>
            {state !== 'done' && state !== 'connected' && (
              <div>
                <p className="t-label mb-1.5 text-ink-muted">Things you could say</p>
                <ul className="flex flex-col gap-1 text-[13px] text-ink-muted">{SUGGESTIONS.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between"><p className="t-label text-ink-muted">What Rollcall heard</p>{state === 'done' && stampText && <StatusStamp outcome="corrected" text={stampText} />}</div>
              <dl className="mt-1.5 divide-y divide-line border-y border-line">
                {FIELD_ORDER.map((k) => {
                  const f = fields[k]
                  return (
                    <div key={k} className="grid grid-cols-[112px_1fr] gap-2 py-1.5">
                      <dt className="text-[12px] text-ink-muted">{FIELD_LABEL[k]}</dt>
                      <dd className="t-listing min-w-0">
                        {!f ? <span className="text-ink-muted">—</span>
                          : f.status === 'corrected' ? <span className="fade-in"><span className="strike strike-in text-ink-muted">{office.listed[k]}</span> <span className="font-semibold">{f.value}</span></span>
                          : f.status === 'unconfirmed' ? <span className="fade-in">{office.listed[k]} <span className="font-bold text-accent">?</span></span>
                          : <span className="fade-in">{office.listed[k]} <span className="text-success">✓</span></span>}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </dialog>
  )
}

function Panel({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <h2 className="t-display text-[26px]">{title}</h2>
      <p className="max-w-[44ch] text-[15px] text-ink-muted">{body}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function Caption({ who, text, live }: { who: 'agent' | 'office'; text: string; live?: boolean }) {
  return (
    <li className={`grid grid-cols-[64px_1fr] gap-2 text-[14px] ${live ? '' : 'text-ink-muted'}`}>
      <span className={`t-label pt-1 ${who === 'office' ? 'text-accent' : 'text-ink-muted'}`}>{who === 'agent' ? 'Rollcall' : 'You'}</span>
      <span>{text}</span>
    </li>
  )
}
