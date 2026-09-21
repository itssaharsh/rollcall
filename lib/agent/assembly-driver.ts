'use client'
// The live line: browser ⇄ AssemblyAI Voice Agent API over one WebSocket, with a single-use token from /api/token.
// It emits the same events as SimulatedDriver, so the call sheet cannot tell them apart.
// Written against the docs on 2026-09-21; first run with a real key is tracked in docs/PLAN.md (check 2).
import type { CallDriver, CallErrorCode, CallEvent } from '../call-driver'
import type { FieldKey, FieldResult, Listing, Turn } from '../types'
import { agentSaid, gate, mergeWrite, newGateContext, officeSaid } from './gate'
import { deriveOutcome } from './outcome'
import { sessionFor } from './session'
import { VoiceGate } from './voice-gate'

const WS_URL = 'wss://agents.assemblyai.com/v1/ws'
const RATE = 24000
/** if the visitor picks up and says nothing, the agent speaks first after this long */
const DEAD_AIR_MS = 4500

type Office = Omit<Listing, 'result' | 'call'>
const b64ToPcm = (b64: string) => { const raw = atob(b64); const out = new Int16Array(raw.length / 2); for (let i = 0; i < out.length; i++) out[i] = (raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8)) << 16 >> 16; return out }
const pcmToB64 = (pcm: Int16Array) => { const u8 = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s) }
const rms = (pcm: Int16Array) => { let sum = 0; for (let i = 0; i < pcm.length; i += 8) sum += (pcm[i] / 32768) ** 2; return Math.min(1, Math.sqrt(sum / (pcm.length / 8)) * 4) }

export class AssemblyDriver implements CallDriver {
  readonly simulated = false
  private fns = new Set<(e: CallEvent) => void>()
  private ws: WebSocket | null = null
  private ctx: AudioContext | null = null
  private stream: MediaStream | null = null
  private sources = new Set<AudioBufferSourceNode>()
  private playAt = 0
  private t0 = 0
  private muted = false
  private ended = false
  private ready = false
  private lastEvent = ''
  private pending: { call_id: string; result: string; is_error: boolean }[] = []
  private hangUpAfterReply = false
  private deadAir: ReturnType<typeof setTimeout> | null = null
  private speechStart = 0
  private agentText = ''
  private agentStart = 0
  private turns: Turn[] = []
  private fields: Record<FieldKey, FieldResult> = { practising: { status: 'not_asked' }, address: { status: 'not_asked' }, phone: { status: 'not_asked' }, accepting: { status: 'not_asked' }, inNetwork: { status: 'not_asked' } }
  private flags: string[] = []
  private gateCtx = newGateContext()

  /** both sides mixed onto one timeline, so row 41's clips play the visitor's own voice back */
  private tape = new Int16Array(RATE * 130)
  private tapeEnd = 0
  /** the mic is sent only around speech: a continuous stream makes the server fall behind (see voice-gate.ts) */
  private micGate: VoiceGate | null = null

  constructor(private office: Office, private plan: string) { this.gateCtx = newGateContext(office.listed) }

  on(fn: (e: CallEvent) => void) { this.fns.add(fn); return () => this.fns.delete(fn) }
  private emit(e: CallEvent) { this.fns.forEach((f) => f(e)) }
  private now() { return this.ctx ? this.ctx.currentTime - this.t0 : 0 }
  private fail(code: CallErrorCode) { if (this.ended) return; this.ended = true; this.emit({ type: 'error', code }); this.cleanup() }
  setMuted(m: boolean) { this.muted = m }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } })
    } catch { return this.fail('mic-denied') }

    const res = await fetch('/api/token', { method: 'POST' }).catch(() => null)
    if (!res?.ok) return this.fail(res?.status === 429 ? 'quota' : res?.status === 503 ? 'unavailable' : 'dropped')
    const { token } = (await res.json()) as { token: string }

    this.ctx = new AudioContext() // device rate: Safari ignores a requested rate, Firefox loses echo cancellation on one
    await this.ctx.resume()
    await this.ctx.audioWorklet.addModule('/pcm-processor.js')
    const mic = new AudioWorkletNode(this.ctx, 'pcm-processor', { processorOptions: { inputSampleRate: this.ctx.sampleRate, targetSampleRate: RATE } })
    this.ctx.createMediaStreamSource(this.stream).connect(mic)
    mic.port.onmessage = (e: MessageEvent<ArrayBuffer>) => this.onMic(new Int16Array(e.data))

    const url = new URL(WS_URL); url.searchParams.set('token', token)
    const ws = (this.ws = new WebSocket(url))
    ws.onopen = () => ws.send(JSON.stringify({ type: 'session.update', session: sessionFor(this.office, this.plan, { mode: 'live' }) }))
    ws.onmessage = (e) => this.onServer(JSON.parse(e.data as string))
    ws.onclose = () => { if (!this.ended) this.fail('dropped') }
    addEventListener('pagehide', this.onPageHide)
  }

  private onPageHide = () => { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'session.end' })) }

  private onMic(pcm: Int16Array) {
    if (!this.ready || this.ws?.readyState !== WebSocket.OPEN) return
    const frame = this.muted ? new Int16Array(pcm.length) : pcm
    this.micGate ??= new VoiceGate({ threshold: 500, frameMs: (pcm.length / RATE) * 1000 })
    for (const f of this.micGate.push(frame)) this.ws.send(JSON.stringify({ type: 'input.audio', audio: pcmToB64(f) }))
    this.record(frame, this.now())
    if (!this.muted) this.emit({ type: 'level', who: 'office', level: rms(frame) })
  }

  private record(pcm: Int16Array, at: number) {
    const start = Math.max(0, Math.round(at * RATE))
    for (let i = 0; i < pcm.length && start + i < this.tape.length; i++) this.tape[start + i] = Math.max(-32768, Math.min(32767, this.tape[start + i] + pcm[i]))
    this.tapeEnd = Math.max(this.tapeEnd, Math.min(this.tape.length, start + pcm.length))
  }

  private play(pcm: Int16Array) {
    const ctx = this.ctx!; const buf = ctx.createBuffer(1, pcm.length, RATE); const ch = buf.getChannelData(0)
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination)
    this.playAt = Math.max(this.playAt, ctx.currentTime)
    src.start(this.playAt); this.record(pcm, this.playAt - this.t0)
    this.playAt += buf.duration
    this.sources.add(src); src.onended = () => this.sources.delete(src)
  }

  private flushTools() {
    if (this.lastEvent !== 'reply.done' || !this.pending.length) return
    for (const p of this.pending) this.ws?.send(JSON.stringify({ type: 'tool.result', ...p }))
    this.pending = []
  }

  private onServer(m: Record<string, unknown> & { type: string }) {
    switch (m.type) {
      case 'session.ready':
        this.ready = true; this.t0 = this.ctx!.currentTime; this.emit({ type: 'voice', state: 'listening' })
        this.deadAir = setTimeout(() => this.ws?.send(JSON.stringify({ type: 'reply.create', instructions: 'The line picked up but nobody has spoken. Say "Hello?" and then your introduction.' })), DEAD_AIR_MS)
        break
      case 'input.speech.started':
        if (this.deadAir) clearTimeout(this.deadAir)
        this.lastEvent = m.type; this.speechStart = Math.max(0, this.now() - 0.3); this.emit({ type: 'voice', state: 'listening' })
        break
      case 'input.speech.stopped': this.emit({ type: 'voice', state: 'thinking' }); break
      case 'transcript.user.delta': this.emit({ type: 'partial', who: 'office', text: String(m.text ?? '') }); break
      case 'transcript.user': {
        const text = String(m.text ?? '').trim(); if (!text) break
        const turn: Turn = { who: 'office', t0: +this.speechStart.toFixed(1), t1: +this.now().toFixed(1), text }
        this.turns.push(turn); officeSaid(this.gateCtx, text); this.emit({ type: 'turn', turn })
        break
      }
      case 'reply.started':
        if (this.deadAir) clearTimeout(this.deadAir)
        this.lastEvent = m.type; this.agentText = ''; this.agentStart = Math.max(this.now(), this.playAt - this.t0); this.emit({ type: 'voice', state: 'agent' })
        break
      case 'reply.audio': { const pcm = b64ToPcm(String(m.data)); this.play(pcm); this.emit({ type: 'level', who: 'agent', level: rms(pcm) }); break }
      case 'transcript.agent.delta': this.agentText += (this.agentText ? ' ' : '') + String(m.delta ?? ''); this.emit({ type: 'partial', who: 'agent', text: this.agentText }); break
      case 'transcript.agent': {
        const text = String(m.text ?? '').trim()
        if (text) { const turn: Turn = { who: 'agent', t0: +this.agentStart.toFixed(1), t1: +Math.max(this.now(), this.playAt - this.t0).toFixed(1), text }; this.turns.push(turn); this.emit({ type: 'turn', turn }) }
        if (text) agentSaid(this.gateCtx, text)
        break
      }
      case 'reply.done':
        this.lastEvent = m.type
        if (m.status === 'interrupted') { this.sources.forEach((s) => { try { s.stop() } catch {} }); this.sources.clear(); this.playAt = this.ctx!.currentTime; this.pending = [] }
        else this.flushTools()
        this.emit({ type: 'voice', state: 'listening' })
        if (this.hangUpAfterReply && m.status !== 'interrupted') setTimeout(() => this.finish(), Math.max(0, (this.playAt - this.ctx!.currentTime) * 1000) + 300)
        break
      case 'tool.call': this.onTool(String(m.call_id), String(m.name), (m.arguments ?? {}) as Record<string, unknown>); break
      case 'session.error': {
        const code = String(m.code ?? '').toLowerCase()
        if (code === 'session_expired') { this.finish(); break } // the server's cap: keep what was captured
        this.fail(code === 'unauthorized' || code === 'forbidden' ? 'unavailable' : 'dropped')
        break
      }
      case 'session.ended': if (!this.ended) this.finish(); break
    }
  }

  private onTool(call_id: string, name: string, args: Record<string, unknown>) {
    const verdict = gate({ name, arguments: args }, this.gateCtx)
    const at = +this.now().toFixed(1)
    const answer = [...this.turns].reverse().find((t) => t.who === 'office')
    const clipOf = (quote?: string) => { const hit = [...this.turns].reverse().find((t) => t.who === 'office' && quote && (quote.includes(t.text) || t.text.includes(quote))) ?? answer; return hit ? ([hit.t0, hit.t1] as [number, number]) : undefined }
    this.turns.push({ who: 'tool', t0: at, t1: at + 0.1, text: verdict.ok ? name : `${name} ✕ refused`, tool: { name, args: args as Record<string, string> } })

    if (verdict.ok) {
      const writes = verdict.writes ?? (verdict.field && verdict.result ? [{ field: verdict.field, result: verdict.result }] : [])
      for (const w of writes) this.write(w.field, { ...w.result, at, clip: clipOf(w.result.quote) })
      if (verdict.flag && verdict.flag !== 'end') this.flags.push(verdict.flag)
      // no result for end_call: it would fire one more reply after the goodbye. Hang up once the goodbye has played.
      if (verdict.flag === 'end') this.hangUpAfterReply = true
      else this.answer(call_id, verdict.note ? { ok: true, note: verdict.note } : { ok: true }, false)
    } else {
      if (verdict.downgrade && verdict.field) this.write(verdict.field, { status: 'unconfirmed', quote: answer?.text, at, clip: answer ? [answer.t0, answer.t1] : undefined })
      this.answer(call_id, { error: verdict.error }, true)
    }
    // end_call comes after the goodbye; if no further reply arrives, hang up anyway
    if (verdict.ok && verdict.flag === 'end') setTimeout(() => this.finish(), Math.max(0, (this.playAt - this.ctx!.currentTime) * 1000) + 400)
  }

  /** live calls use interactive tools: the agent says "Got it." while the tool runs, and the result goes out once that reply is done (docs: tools/client-side-tools) */
  private answer(call_id: string, result: unknown, is_error: boolean) { this.pending.push({ call_id, result: JSON.stringify(result), is_error }); this.flushTools() }

  private write(key: FieldKey, result: FieldResult) { this.fields[key] = mergeWrite(this.fields[key], result); this.emit({ type: 'field', key, result: this.fields[key] }) }

  private wav(): string | undefined {
    if (!this.tapeEnd) return
    const pcm = this.tape.subarray(0, this.tapeEnd); const head = new DataView(new ArrayBuffer(44))
    const put = (o: number, s: string) => [...s].forEach((c, i) => head.setUint8(o + i, c.charCodeAt(0)))
    put(0, 'RIFF'); head.setUint32(4, 36 + pcm.byteLength, true); put(8, 'WAVEfmt '); head.setUint32(16, 16, true); head.setUint16(20, 1, true); head.setUint16(22, 1, true)
    head.setUint32(24, RATE, true); head.setUint32(28, RATE * 2, true); head.setUint16(32, 2, true); head.setUint16(34, 16, true); put(36, 'data'); head.setUint32(40, pcm.byteLength, true)
    return URL.createObjectURL(new Blob([head.buffer, pcm.slice().buffer], { type: 'audio/wav' }))
  }

  private finish() {
    if (this.ended) return
    this.ended = true
    const wrongNumber = this.flags.includes('wrong_number')
    const derived = deriveOutcome({ fields: this.fields, flags: this.flags, answeredBy: wrongNumber ? 'wrong_number' : 'person' })
    this.emit({ type: 'end', duration: +this.now().toFixed(1), turns: this.turns, audio: this.wav(), result: { ...derived, fields: this.fields } })
    this.cleanup()
  }

  wrapUp() { this.finish() }
  hurry() { if (!this.ended && this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'reply.create', instructions: 'You are almost out of time. Thank them in one short sentence and call end_call now. Do not ask anything else.' })) }

  /** Hang up from the UI. Sends session.end first: a bare close is billed for a 30s resume window. */
  stop() { if (!this.ended) { this.ended = true; this.cleanup() } }

  private cleanup() {
    if (this.deadAir) clearTimeout(this.deadAir)
    removeEventListener('pagehide', this.onPageHide)
    if (this.ws?.readyState === WebSocket.OPEN) { this.ws.send(JSON.stringify({ type: 'session.end' })); setTimeout(() => this.ws?.close(), 400) }
    this.stream?.getTracks().forEach((t) => t.stop())
    this.sources.forEach((s) => { try { s.stop() } catch {} })
    void this.ctx?.close().catch(() => {})
  }
}
