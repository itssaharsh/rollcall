// Rehearses the visitor's live call without a microphone: the live-mode agent phones a simulated front desk that behaves
// the way you describe.   npm run rehearse -- "You are in suite 4 now, not suite 3. Everything else on file is right."
import { readFileSync } from 'node:fs'
import { sessionFor } from '../lib/agent/session'
import type { Seed } from '../lib/types'
import { runCall } from './lib/bridge'

const behaviour = process.argv.slice(2).join(' ') || 'Everything on file is correct.'
const seed = JSON.parse(readFileSync('seed/demo.json', 'utf8')) as Seed
const row = seed.yourCall.listing
const r = await runCall({
  callerSession: sessionFor(row, seed.meta.plan, { mode: 'live' }), interactiveTools: true, answeredBy: 'person', listed: row.listed, maxSeconds: 150, log: console.log,
  officeSession: {
    system_prompt: `You answer the phone at ${row.practice}, a small counseling office. On file: ${row.provider} practises here, address ${row.address}, booking phone ${row.phone}, accepting new patients, takes Cascadia Health Plan. You are a real, slightly busy person. Short natural sentences. Never ask questions back. How you behave on this call: ${behaviour} If the caller says goodbye, say goodbye and stop.`,
    greeting: `${row.practice}.`, input: { transcription_mode: 'min_latency', turn_detection: { min_silence: 350, max_silence: 900 } }, output: { voice: 'mary' },
  },
})
console.log(`\n→ ${r.outcome.outcome} (${r.outcome.stamp}) in ${r.duration}s`)
for (const [k, f] of Object.entries(r.fields)) console.log(`  ${k.padEnd(11)} ${f.status.padEnd(12)} ${f.value ?? ''}  ${f.quote ? '“' + f.quote.slice(0, 90) + '”' : ''}`)
if (r.refusals.length) console.log('gate refusals:\n  ' + r.refusals.join('\n  '))
