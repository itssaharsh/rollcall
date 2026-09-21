// Does the server fall behind a real-time audio stream? Plays the same 3s clip into one session at t=2s and t=60s
// and times how long the server takes to report speech start / end for each.  ~$0.09
import { readFileSync } from 'node:fs'
import { FRAME, Leg, pace, RATE } from './lib/aai'

const wav = readFileSync('recordings/bridge-test.wav')
const pcm = new Int16Array(wav.buffer, wav.byteOffset + 44, Math.floor((wav.byteLength - 44) / 2))
const clip = pcm.slice(0, RATE * 3.2) // the office greeting
const chunk = Number(process.env.CHUNK_MS ?? 20)
const per = (FRAME * chunk) / 20
const marks: string[] = []
let now = 0
const leg = new Leg('probe', { system_prompt: 'You are silent. Never reply.', input: { turn_detection: { min_silence: 350, max_silence: 900 } } }, (e) => {
  if (e.type === 'input.speech.started' || e.type === 'input.speech.stopped' || e.type === 'transcript.user') marks.push(`${now.toFixed(2)}s ${e.type} ${e.text ?? ''}`)
})
await leg.open(120)
const began = performance.now(); let sent = 0
const starts = [2, 60]
await new Promise<void>((resolve) => {
  let n = 0
  const timer = setInterval(() => {
    const due = Math.floor((performance.now() - began) / chunk)
    while (n < due) {
      now = (n * chunk) / 1000
      const frame = new Int16Array(per)
      // NOISE=1: a real microphone never sends exact zeros. Fill silence with a whisper of noise (about -70 dBFS).
      if (process.env.NOISE === '1') for (let i = 0; i < per; i++) frame[i] = Math.round((Math.random() - 0.5) * 16)
      for (const s of starts) { const off = Math.round((now - s) * RATE); if (off >= 0 && off < clip.length) frame.set(clip.subarray(off, Math.min(clip.length, off + per))) }
      // GATE=1: send only the clip plus a 1.5s silent tail, nothing in between
      const inClip = starts.some((st) => now >= st - 0.2 && now <= st + 3.2 + 1.5)
      if (process.env.GATE !== '1' || inClip) { leg.hear(frame); sent += per }
      n++
      if (n % Math.round(10000 / chunk) === 0) console.log(`t=${now.toFixed(0)}s socket backlog ${(leg.ws.bufferedAmount / 1024).toFixed(0)} KB (${(leg.ws.bufferedAmount / 70000).toFixed(1)}s of audio waiting to leave this machine)`)
      if (now > 68) { clearInterval(timer); return resolve() }
    }
  }, 5)
})
const wall = (performance.now() - began) / 1000
await leg.close()
console.log(`chunk ${chunk}ms · sent ${(sent / RATE).toFixed(2)}s of audio in ${wall.toFixed(2)}s wall`)
console.log(`clip plays 2.00–5.20s and 60.00–63.20s (speech itself starts ~0.2s in, ends ~3.0s in)`)
console.log(marks.join('\n'))
