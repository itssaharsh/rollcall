// Day-0 checks. Run once the key is in .env.local:  npm run check:keys
// Costs a few cents. Each check prints PASS/FAIL and the numbers that decide the build plan.
import { mkdirSync, readFileSync } from 'node:fs'
import { apiKey, Leg, mintToken, writeWav } from './lib/aai'
import { runCall } from './lib/bridge'

const results: [string, boolean, string][] = []
const onlyCheck = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null
const check = async (name: string, fn: () => Promise<string>) => { if (onlyCheck && !name.startsWith(onlyCheck + '.')) return; try { results.push([name, true, await fn()]) } catch (e) { results.push([name, false, (e as Error).message]) } ; const r = results[results.length - 1]; console.log(`${r[1] ? 'PASS' : 'FAIL'}  ${r[0]}  — ${r[2]}`) }

await check('1. key mints a Voice Agent token', async () => { const t0 = Date.now(); const t = await mintToken(60); return `${t.length}-char token in ${Date.now() - t0}ms` })

await check('2. a session opens, speaks a greeting, and ends cleanly', async () => {
  const t0 = Date.now(); let firstAudio = 0, text = ''
  const leg = new Leg('probe', { system_prompt: 'You are a line check. Say nothing after the greeting.', greeting: 'Line check, one two three.', output: { voice: 'jane' } }, (e) => { if (e.type === 'reply.audio' && !firstAudio) firstAudio = Date.now() - t0; if (e.type === 'transcript.agent') text = String(e.text) })
  await leg.open(60); await new Promise((r) => setTimeout(r, 3500)); await leg.close()
  if (!firstAudio) throw new Error('session.ready arrived but no reply.audio')
  return `first audio ${firstAudio}ms after connect · heard “${text}” · session ${leg.sessionId}`
})

await check('3. twelve sessions at once (six calls × two agents)', async () => {
  const legs = Array.from({ length: 12 }, (_, i) => new Leg(`c${i}`, { system_prompt: 'Stay silent.' }, () => {}))
  const opened = await Promise.allSettled(legs.map((l) => l.open(60)))
  await Promise.all(legs.map((l) => l.close()))
  const ok = opened.filter((o) => o.status === 'fulfilled').length
  if (ok < 12) throw new Error(`${ok}/12 opened: ${(opened.find((o) => o.status === 'rejected') as PromiseRejectedResult).reason}`)
  return '12/12 opened'
})

await check('4. two agents hold a phone call through the bridge', async () => {
  const { sessionFor } = await import('../lib/agent/session')
  const seed = JSON.parse(readFileSync('seed/demo.json', 'utf8')) as { listings: Parameters<typeof sessionFor>[0][]; meta: { plan: string } }
  const row = seed.listings[0]
  const r = await runCall({
    // BRIDGE_MODE=live rehearses the visitor's call: interactive tools, spoken acknowledgements, more patient turn detection
    callerSession: sessionFor(row, seed.meta.plan, { mode: process.env.BRIDGE_MODE === 'live' ? 'live' : 'recorded' }), interactiveTools: process.env.BRIDGE_MODE === 'live', answeredBy: 'person', maxSeconds: Number(process.env.BRIDGE_SECONDS ?? 110), log: console.log,
    officeSession: { system_prompt: `You answer the phone at ${row.practice}, a small medical office. Everything the caller has on file is correct. Answer in a few words. Never ask questions back.`, greeting: `${row.practice}, this is Dana.`, input: { transcription_mode: 'min_latency', turn_detection: { min_silence: 350, max_silence: 900 } }, output: { voice: 'mary' } },
  })
  mkdirSync('recordings', { recursive: true }); writeWav('recordings/bridge-test.wav', r.tape)
  const written = Object.values(r.fields).filter((f) => f.status !== 'not_asked').length
  if (written < 3) throw new Error(`only ${written}/5 fields written in ${r.duration}s. Listen to recordings/bridge-test.wav: talking over each other, or silence?`)
  return `${written}/5 fields in ${r.duration}s → ${r.outcome.outcome} · ${r.refusals.length} gate refusals · recordings/bridge-test.wav`
})

await check('5. the Sessions API returns a recording and a timeline', async () => {
  const res = await fetch('https://agents.assemblyai.com/v1/sessions?limit=3', { headers: { Authorization: `Bearer ${apiKey()}` } })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const body = JSON.stringify(await res.json())
  return `${res.status} · ${body.length} bytes · artifacts mentioned: ${/timeline|audio/.test(body) ? 'yes' : 'not yet (they appear after a session completes)'}`
})

const failed = results.filter((r) => !r[1])
console.log(failed.length ? `\n${failed.length} check(s) failed. See docs/PLAN.md for the fallback that goes with each.` : '\nAll five pass. Next: npm run record -- --only L-014, listen to it, then npm run record.')
process.exit(failed.length ? 1 : 0)
