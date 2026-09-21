// Scores the recorded sweep against the offices' hidden truth sheets. This is the proof number: npm run eval
// The number that matters most is false writes: a value written into the directory that the office never said.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type { FieldKey, FieldResult } from '../lib/types'

const truth = JSON.parse(readFileSync('seed/truth.json', 'utf8')) as { id: string; outcome: string; truth: Record<FieldKey, string>; expect: Record<FieldKey, string> }[]
const listed = Object.fromEntries((JSON.parse(readFileSync('seed/demo.json', 'utf8')).listings as { id: string; listed: Record<FieldKey, string> }[]).map((l) => [l.id, l.listed]))
const norm = (s: string) => s.toLowerCase().replace(/\b(street)\b/g, 'st').replace(/\b(road)\b/g, 'rd').replace(/\b(avenue)\b/g, 'ave').replace(/[^a-z0-9]/g, '')

let calls = 0, fieldsWritten = 0, fieldsRight = 0, falseWrites = 0, outcomesRight = 0, refusals = 0, seconds = 0
const misses: string[] = []
for (const t of truth) {
  const file = `recordings/${t.id}.json`; if (!existsSync(file)) continue
  const rec = JSON.parse(readFileSync(file, 'utf8')) as { fields: Record<FieldKey, FieldResult>; outcome: { outcome: string }; refusals: string[]; duration: number }
  calls++; seconds += rec.duration; refusals += rec.refusals.length
  if (rec.outcome.outcome === t.outcome) outcomesRight++; else misses.push(`${t.id}: outcome ${rec.outcome.outcome}, expected ${t.outcome}`)
  for (const [k, f] of Object.entries(rec.fields) as [FieldKey, FieldResult][]) {
    if (f.status !== 'confirmed' && f.status !== 'corrected') continue
    fieldsWritten++
    const written = f.status === 'corrected' ? f.value ?? '' : listed[t.id][k]
    if (norm(written) === norm(t.truth[k])) fieldsRight++; else { falseWrites++; misses.push(`${t.id}.${k}: wrote “${written}”, truth “${t.truth[k]}”`) }
  }
}
if (!calls) { console.log('No recordings yet. Run npm run record first.'); process.exit(0) }
const out = { scoredAt: new Date().toISOString(), calls, fieldsWritten, fieldsRight, falseWrites, outcomesRight, gateRefusals: refusals, avgCallSeconds: +(seconds / calls).toFixed(1), costPerListing: +(((seconds / calls) / 60) * 0.075).toFixed(3) }
writeFileSync('seed/eval.json', JSON.stringify(out, null, 1))
console.table(out); if (misses.length) console.log(misses.join('\n'))
const pass = falseWrites === 0 && outcomesRight / calls >= 0.9
console.log(pass ? 'PASS  no false writes, outcomes ≥ 90%' : 'FAIL  see the lines above')
process.exit(pass ? 0 : 1)
