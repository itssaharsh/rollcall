// Two Voice Agent sessions on one phone line: the caller (Rollcall) and a simulated front desk.
// Audio is delivered in real time in both directions and mixed onto one tape, so the recording is the call as it happened.
import { agentSaid, gate, mergeWrite, newGateContext, officeSaid } from '../../lib/agent/gate'
import { deriveOutcome } from '../../lib/agent/outcome'
import { VoiceGate } from '../../lib/agent/voice-gate'
import type { FieldKey, FieldResult, Turn } from '../../lib/types'
import { FRAME, Leg, pace, RATE, takeFrame, type ServerEvent } from './aai'

export interface BridgeResult {
  turns: Turn[]; fields: Record<FieldKey, FieldResult>; flags: string[]; duration: number; tape: Int16Array
  /** what the front desk actually said, for scoring the recognizer against ground truth */
  said: string[]; refusals: string[]; sessions: { caller: string; office: string }
  outcome: ReturnType<typeof deriveOutcome>
}

export async function runCall(opts: { callerSession: Record<string, unknown>; officeSession: Record<string, unknown>; muteOfficeAfterGreeting?: boolean; answeredBy: 'person' | 'voicemail' | 'intercept' | 'wrong_number'; listed?: Partial<Record<FieldKey, string>>; maxSeconds?: number; interactiveTools?: boolean; log?: (s: string) => void }): Promise<BridgeResult> {
  const log = opts.log ?? (() => {})
  const maxFrames = (opts.maxSeconds ?? 110) * 50
  const tape = new Int16Array(maxFrames * FRAME)
  const turns: Turn[] = []; const said: string[] = []; const refusals: string[] = []; const flags: string[] = []
  const fields: Record<FieldKey, FieldResult> = { practising: { status: 'not_asked' }, address: { status: 'not_asked' }, phone: { status: 'not_asked' }, accepting: { status: 'not_asked' }, inNetwork: { status: 'not_asked' } }
  const ctx = newGateContext(opts.listed)
  let now = 0, heardStart = 0, agentStart = 0, hangUp = false, officeReplies = 0

  const onCaller = (e: ServerEvent, leg: Leg) => {
    if (e.type === 'input.speech.started') heardStart = Math.max(0, now - 0.3)
    if (e.type === 'transcript.user' && String(e.text ?? '').trim()) { const text = String(e.text).trim(); turns.push({ who: 'office', t0: +heardStart.toFixed(1), t1: +now.toFixed(1), text }); officeSaid(ctx, text); log(`  office  ${text}`) }
    if (e.type === 'reply.started') agentStart = now
    if (e.type === 'transcript.agent' && String(e.text ?? '').trim()) {
      const text = String(e.text).trim()
      turns.push({ who: 'agent', t0: +agentStart.toFixed(1), t1: +now.toFixed(1), text }); log(`  agent   ${text}`)
      agentSaid(ctx, text)
    }
    if (e.type === 'tool.call') {
      const name = String(e.name), args = (e.arguments ?? {}) as Record<string, unknown>
      const v = gate({ name, arguments: args }, ctx)
      const clipOf = (quote?: string) => { const hit = [...turns].reverse().find((t) => t.who === 'office' && quote && (quote.includes(t.text) || t.text.includes(quote))) ?? [...turns].reverse().find((t) => t.who === 'office'); return hit ? ([hit.t0, hit.t1] as [number, number]) : undefined }
      const answer = [...turns].reverse().find((t) => t.who === 'office')
      turns.push({ who: 'tool', t0: +now.toFixed(1), t1: +(now + 0.1).toFixed(1), text: v.ok ? name : `${name} ✕ refused`, tool: { name, args: args as Record<string, string> } })
      if (v.ok) {
        const writes = v.writes ?? (v.field && v.result ? [{ field: v.field, result: v.result }] : [])
        for (const w of writes) fields[w.field] = mergeWrite(fields[w.field], { ...w.result, at: +now.toFixed(1), clip: clipOf(w.result.quote) })
        if (v.flag && v.flag !== 'end') flags.push(v.flag)
        if (v.flag === 'end') hangUp = true
        else leg.answerTool(String(e.call_id), v.note ? { ok: true, note: v.note } : { ok: true })
      } else {
        refusals.push(`${name}(${JSON.stringify(args)}): ${v.error}`)
        if (v.downgrade && v.field) fields[v.field] = { status: 'unconfirmed', quote: answer?.text, at: +now.toFixed(1), clip: clipOf(answer?.text) }
        leg.answerTool(String(e.call_id), { error: v.error }, true)
      }
      log(`  tool    ${name} ${JSON.stringify(args)} → ${v.ok ? 'ok' : 'REFUSED'}`)
    }
  }
  const onOffice = (e: ServerEvent) => { if (e.type === 'transcript.agent' && String(e.text ?? '').trim()) said.push(String(e.text).trim()); if (e.type === 'reply.done') officeReplies++ }

  // BRIDGE_DEBUG=1 prints every protocol event on both legs against the tape clock: this is how turn latency gets diagnosed
  const debug = process.env.BRIDGE_DEBUG === '1'
  const trace = (who: string) => (e: ServerEvent) => { if (debug && !['reply.audio', 'transcript.agent.delta', 'transcript.user.delta', 'session.updated'].includes(e.type)) console.log(`    ${now.toFixed(1).padStart(5)}s ${who.padEnd(6)} ${e.type}${e.status ? ' ' + e.status : ''}${e.name ? ' ' + e.name : ''}${e.text ? ' “' + String(e.text).slice(0, 60) + '”' : ''}`) }
  const caller = new Leg('caller', opts.callerSession, (e, leg) => { trace('caller')(e); onCaller(e, leg) })
  const office = new Leg('office', opts.officeSession, (e) => { trace('office')(e); onOffice(e) })
  caller.interactive = Boolean(opts.interactiveTools)
  await Promise.all([caller.open(), office.open()])

  let quiet = 0, goodbyeDone = -1
  // each direction sends only around speech; see lib/agent/voice-gate.ts for why
  const toOffice = new VoiceGate({ threshold: 120, frameMs: 20 }), toCaller = new VoiceGate({ threshold: 120, frameMs: 20 })
  const wire = { caller: false, office: false }
  await pace((n) => {
    now = (n * FRAME) / RATE
    const fromCaller = takeFrame(caller.out)
    // a voicemail or intercept message plays once; whatever that agent says afterwards is dropped
    if (opts.muteOfficeAfterGreeting && officeReplies >= 1 && !office.out.length) office.out = []
    const fromOffice = opts.muteOfficeAfterGreeting && officeReplies > 1 ? { pcm: new Int16Array(FRAME), speaking: false } : takeFrame(office.out)
    for (const f of toOffice.push(fromCaller.pcm)) office.hear(f)
    for (const f of toCaller.push(fromOffice.pcm)) caller.hear(f)
    if (debug) {
      if (fromCaller.speaking !== wire.caller) { wire.caller = fromCaller.speaking; console.log(`    ${now.toFixed(1).padStart(5)}s wire   caller audio ${wire.caller ? 'starts' : 'ends'}`) }
      if (fromOffice.speaking !== wire.office) { wire.office = fromOffice.speaking; console.log(`    ${now.toFixed(1).padStart(5)}s wire   office audio ${wire.office ? 'starts' : 'ends'}`) }
    }
    const at = n * FRAME
    for (let i = 0; i < FRAME; i++) tape[at + i] = Math.max(-32768, Math.min(32767, fromCaller.pcm[i] + fromOffice.pcm[i]))
    quiet = toOffice.open || toCaller.open || caller.out.length || office.out.length ? 0 : quiet + 1
    // hang up 2.5s after the agent's goodbye has finished playing, whatever the office is still saying; or on the hard cap
    if (hangUp && goodbyeDone < 0 && !caller.out.length && !fromCaller.speaking) goodbyeDone = now
    return !((goodbyeDone >= 0 && now - goodbyeDone > 2.5) || (hangUp && quiet > 30) || n >= maxFrames - 1)
  })
  await Promise.all([caller.close(), office.close()])
  const duration = +now.toFixed(1)
  return { turns, fields, flags, duration, tape: tape.subarray(0, Math.ceil(now * RATE)), said, refusals, sessions: { caller: caller.sessionId, office: office.sessionId }, outcome: deriveOutcome({ fields, flags, answeredBy: opts.answeredBy }) }
}
