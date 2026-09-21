// Records the sweep: Rollcall phones each simulated front desk through the bridge.
//   npm run record -- --only L-014        one call, to listen to first
//   npm run record -- --lines 3           all 40, three at a time
// Each call writes recordings/<id>.json and recordings/<id>.wav. Re-running skips finished calls unless --force.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { sessionFor } from '../lib/agent/session'
import type { Seed } from '../lib/types'
import { writeWav } from './lib/aai'
import { runCall } from './lib/bridge'

const arg = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] ?? 'true' : undefined }
const seed = JSON.parse(readFileSync('seed/demo.json', 'utf8')) as Seed
const truth = JSON.parse(readFileSync('seed/truth.json', 'utf8')) as { id: string; kind: string; answeredBy: 'person' | 'voicemail' | 'intercept' | 'wrong_number'; voice: string; greeting: string; muteAfterGreeting: boolean; brief: string; truth: Record<string, string> }[]
const only = arg('only')?.split(','); const lines = Number(arg('lines') ?? 3); const force = arg('force') === 'true'
mkdirSync('recordings', { recursive: true })

const officePrompt = (t: (typeof truth)[number], practice: string) => `You answer the phone at ${t.kind.startsWith('wrong_number') ? 'a small business' : `${practice}, a medical office`}. You are a real, slightly busy person on a phone call. Speak in short, natural sentences. Never ask the caller questions back except "who is this?" once if confused. Never read out lists.

What is true at your office:
- Provider still practises here: ${t.truth.practising}
- Address: ${t.truth.address}
- Booking phone: ${t.truth.phone}
- Accepting new patients: ${t.truth.accepting}
- Takes Cascadia Health Plan: ${t.truth.inNetwork}

How you behave on this call: ${t.brief}
If the caller says goodbye, say a short goodbye and stop talking.`

const queue = seed.listings.filter((l) => (!only || only.includes(l.id)) && (force || !existsSync(`recordings/${l.id}.json`)))
console.log(`${queue.length} call(s) to record on ${lines} line(s). Roughly $${((queue.length * 2 * 50) / 3600 * 4.5).toFixed(2)} of credits.`)

async function worker() {
  for (let l = queue.shift(); l; l = queue.shift()) {
    const t = truth.find((x) => x.id === l!.id)!
    console.log(`\n${l.id}  ${l.provider} · ${t.kind}`)
    try {
      const r = await runCall({
        callerSession: sessionFor(l, seed.meta.plan), answeredBy: t.answeredBy, listed: l.listed, muteOfficeAfterGreeting: t.muteAfterGreeting, log: lines === 1 ? console.log : undefined,
        officeSession: { system_prompt: officePrompt(t, l.practice), greeting: t.greeting, input: { transcription_mode: 'min_latency', turn_detection: { min_silence: 350, max_silence: 900 } }, output: { voice: t.voice } },
      })
      writeWav(`recordings/${l.id}.wav`, r.tape)
      writeFileSync(`recordings/${l.id}.json`, JSON.stringify({ id: l.id, kind: t.kind, answeredBy: t.answeredBy, duration: r.duration, turns: r.turns, fields: r.fields, flags: r.flags, outcome: r.outcome, said: r.said, refusals: r.refusals, sessions: r.sessions }, null, 1))
      console.log(`${l.id}  → ${r.outcome.outcome} in ${r.duration}s, ${r.refusals.length} refusal(s)`)
    } catch (e) { console.error(`${l.id}  FAILED: ${(e as Error).message}`) }
  }
}
await Promise.all(Array.from({ length: lines }, worker))
console.log('\nDone. Next: npm run import:recordings, then npm run eval.')
