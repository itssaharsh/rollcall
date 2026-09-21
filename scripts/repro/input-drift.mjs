// Repro: with a continuous real-time input.audio stream, server-side speech detection falls further behind the longer the
// session runs. Node 22+, no dependencies.   ASSEMBLYAI_API_KEY=... node input-drift.mjs [gated]     (costs about $0.12)
//   1. Synthesises a 3s speech clip with the API's own TTS (a session whose greeting is the clip).
//   2. Opens a second session, streams PCM16/24kHz in exact real time (20ms frames), and inserts the same clip at t=2s and t=60s.
//   3. Prints how long after each clip's onset the server emitted input.speech.started / input.speech.stopped.
// Pass "gated" to send audio only around the clips (1.5s tail) instead of continuous silence: the delay then stays constant.
const KEY = process.env.ASSEMBLYAI_API_KEY, GATED = process.argv.includes('gated'), RATE = 24000, FRAME = 480
const SECOND = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 60) // when the second clip plays; pass e.g. 120 for a longer session
const open = async (session, onEvent) => {
  const u = new URL('https://agents.assemblyai.com/v1/token'); u.searchParams.set('expires_in_seconds', '120')
  const { token } = await (await fetch(u, { headers: { Authorization: `Bearer ${KEY}` } })).json()
  const ws = new WebSocket(`wss://agents.assemblyai.com/v1/ws?token=${token}`)
  await new Promise((ok, no) => { ws.onopen = () => ws.send(JSON.stringify({ type: 'session.update', session })); ws.onerror = no
    ws.onmessage = (m) => { const e = JSON.parse(m.data); if (e.type === 'session.ready') { console.log('session', e.session_id); ok() } onEvent(e) } })
  return ws
}
const end = (ws) => new Promise((r) => { ws.send(JSON.stringify({ type: 'session.end' })); setTimeout(() => { ws.close(); r() }, 500) })

// 1. the clip
const chunks = []; let ttsDone = false
const tts = await open({ system_prompt: 'Say nothing after the greeting.', greeting: 'Alder Street Counseling, this is Dana speaking.' }, (e) => { if (e.type === 'reply.audio') chunks.push(Buffer.from(e.data, 'base64')); if (e.type === 'reply.done') ttsDone = true })
while (!ttsDone) await new Promise((r) => setTimeout(r, 100))
await end(tts)
const raw = Buffer.concat(chunks); const all = new Int16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2)
let first = 0; while (first < all.length && Math.abs(all[first]) < 500) first++   // trim the silent lead-in
const clip = all.slice(Math.max(0, first - 2400)); const clipSec = clip.length / RATE
console.log(`clip: ${clipSec.toFixed(2)}s of speech`)

// 2. the stream
const marks = []; let now = 0
const ws = await open({ system_prompt: 'You are silent. Never reply.' }, (e) => { if (e.type === 'input.speech.started' || e.type === 'input.speech.stopped') marks.push([now, e.type]) })
const starts = [2, SECOND], began = performance.now(); let n = 0, sent = 0
await new Promise((done) => { const timer = setInterval(() => {
  const due = Math.floor((performance.now() - began) / 20)
  while (n < due) {
    now = n * 0.02; const frame = new Int16Array(FRAME)
    for (const s of starts) { const off = Math.round((now - s) * RATE); if (off >= 0 && off < clip.length) frame.set(clip.subarray(off, Math.min(clip.length, off + FRAME))) }
    const nearClip = starts.some((s) => now >= s - 0.2 && now <= s + clipSec + 1.5)
    if (!GATED || nearClip) { ws.send(JSON.stringify({ type: 'input.audio', audio: Buffer.from(frame.buffer).toString('base64') })); sent += FRAME }
    n++; if (now > SECOND + clipSec + 6) { clearInterval(timer); return done() }
  } }, 5) })
console.log(`${GATED ? 'gated' : 'continuous'}: sent ${(sent / RATE).toFixed(2)}s of audio in ${((performance.now() - began) / 1000).toFixed(2)}s wall, socket backlog ${ws.bufferedAmount} bytes`)
await end(ws)
for (const s of starts) { const a = marks.find(([t, k]) => t >= s && k === 'input.speech.started'), b = marks.find(([t, k]) => t >= s && k === 'input.speech.stopped')
  console.log(`clip at t=${s}s: speech.started ${a ? (a[0] - s).toFixed(2) + 's after onset' : 'never'}, speech.stopped ${b ? (b[0] - s - clipSec).toFixed(2) + 's after the clip ended' : 'never'}`) }
