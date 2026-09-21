// Shared plumbing for the scripts that talk to AssemblyAI's Voice Agent API from Node 22 (global WebSocket, global fetch).
import { readFileSync, writeFileSync } from 'node:fs'

export const RATE = 24000
export const FRAME = 480 // 20ms
const HOST = 'agents.assemblyai.com'

export function apiKey(): string {
  if (process.env.ASSEMBLYAI_API_KEY) return process.env.ASSEMBLYAI_API_KEY
  try { const m = readFileSync('.env.local', 'utf8').match(/^ASSEMBLYAI_API_KEY=(.+)$/m); if (m) return m[1].trim() } catch {}
  console.error('No key. Put ASSEMBLYAI_API_KEY=... in .env.local (it is git-ignored) and run again.'); process.exit(2)
}

export async function mintToken(maxSessionSeconds = 180): Promise<string> {
  const url = new URL(`https://${HOST}/v1/token`)
  url.searchParams.set('expires_in_seconds', '120'); url.searchParams.set('max_session_duration_seconds', String(maxSessionSeconds))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey()}` } })
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`)
  return ((await res.json()) as { token: string }).token
}

export type ServerEvent = Record<string, unknown> & { type: string }

/** One agent session. Node's WebSocket cannot set headers, so it connects with a single-use token like a browser does. */
export class Leg {
  ws!: WebSocket
  ready = false
  sessionId = ''
  /** audio this agent produced, waiting to be delivered in real time */
  out: Int16Array[] = []
  private lastEvent = ''
  private replyAt = 0
  private awaitingAudio = false
  private pending: { call_id: string; result: string; is_error: boolean }[] = []
  constructor(public name: string, private session: Record<string, unknown>, private onEvent: (e: ServerEvent, leg: Leg) => void) {}

  async open(maxSessionSeconds = 180) {
    const token = await mintToken(maxSessionSeconds)
    this.ws = new WebSocket(`wss://${HOST}/v1/ws?token=${token}`)
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${this.name}: no session.ready in 15s`)), 15000)
      this.ws.onopen = () => this.ws.send(JSON.stringify({ type: 'session.update', session: this.session }))
      this.ws.onerror = () => reject(new Error(`${this.name}: socket error`))
      this.ws.onmessage = (m) => {
        const e = JSON.parse(String(m.data)) as ServerEvent
        if (e.type === 'session.ready') { this.ready = true; this.sessionId = String(e.session_id); clearTimeout(timer); resolve() }
        if (e.type === 'session.error') { clearTimeout(timer); reject(new Error(`${this.name}: ${e.code} ${e.message}`)) }
        if (e.type === 'reply.audio') { if (process.env.BRIDGE_DEBUG === '1' && this.awaitingAudio) { console.log(`           ${this.name} first audio ${Date.now() - this.replyAt}ms after reply.started`); this.awaitingAudio = false } this.out.push(pcmFromB64(String(e.data))) }
        if (e.type === 'reply.started') { this.replyAt = Date.now(); this.awaitingAudio = true }
        if (e.type === 'reply.started' || e.type === 'input.speech.started') this.lastEvent = e.type
        if (e.type === 'reply.done') { this.lastEvent = e.type; if (e.status === 'interrupted') { this.out = []; this.pending = [] } else this.flush() }
        this.onEvent(e, this)
      }
    })
  }
  hear(pcm: Int16Array) { if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'input.audio', audio: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength).toString('base64') })) }
  /** our tools run in hold mode: the agent is silent until the result arrives, so it goes out at once and auto-fires the next reply */
  answerTool(call_id: string, result: unknown, is_error = false) {
    if (!this.interactive) return this.ws.send(JSON.stringify({ type: 'tool.result', call_id, result: JSON.stringify(result), is_error }))
    // interactive tools (live-call mode): the agent is saying "Got it."; the result waits for that reply to finish
    this.pending.push({ call_id, result: JSON.stringify(result), is_error }); this.flush()
  }
  /** set for live-mode sessions, whose tools run in interactive mode */
  interactive = false
  private flush() { if (this.lastEvent !== 'reply.done') return; for (const p of this.pending) this.ws.send(JSON.stringify({ type: 'tool.result', ...p })); this.pending = [] }
  /** session.end first: a bare close is billed for a 30s resume window */
  async close() { if (this.ws?.readyState === WebSocket.OPEN) { this.ws.send(JSON.stringify({ type: 'session.end' })); await new Promise((r) => setTimeout(r, 400)); this.ws.close() } }
}

export const pcmFromB64 = (b64: string) => { const buf = Buffer.from(b64, 'base64'); return new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2).slice() }

/** Pulls exactly one 20ms frame from a queue of chunks; silence when the agent isn't speaking. */
export function takeFrame(queue: Int16Array[]): { pcm: Int16Array; speaking: boolean } {
  const frame = new Int16Array(FRAME); let filled = 0
  while (filled < FRAME && queue.length) {
    const head = queue[0]; const n = Math.min(FRAME - filled, head.length)
    frame.set(head.subarray(0, n), filled); filled += n
    if (n === head.length) queue.shift(); else queue[0] = head.subarray(n)
  }
  return { pcm: frame, speaking: filled > 0 }
}

/** Runs `tick` every 20ms of wall time, catching up after a late timer so the audio clock never drifts. */
export function pace(tick: (n: number) => boolean) {
  return new Promise<void>((resolve) => {
    const began = performance.now(); let n = 0
    const timer = setInterval(() => { const due = Math.floor((performance.now() - began) / 20); while (n < due) if (!tick(n++)) { clearInterval(timer); return resolve() } }, 5)
  })
}

export function writeWav(path: string, pcm: Int16Array, rate = RATE) {
  const head = Buffer.alloc(44)
  head.write('RIFF', 0); head.writeUInt32LE(36 + pcm.byteLength, 4); head.write('WAVEfmt ', 8); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22)
  head.writeUInt32LE(rate, 24); head.writeUInt32LE(rate * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(pcm.byteLength, 40)
  writeFileSync(path, Buffer.concat([head, Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength)]))
}
