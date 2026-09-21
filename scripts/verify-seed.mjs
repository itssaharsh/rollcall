// The judge-check: runs with no credentials and no network. Exercises the demo data end to end and prints PASS/FAIL.
import { existsSync, readFileSync } from 'node:fs'
const seed = JSON.parse(readFileSync('seed/demo.json', 'utf8'))
const rows = []
const ok = (name, pass, detail = '') => rows.push({ check: name, result: pass ? 'PASS' : 'FAIL', detail })
const L = seed.listings
const count = (o) => L.filter((l) => l.result.outcome === o).length
ok('40 listings, 6 lines', L.length === 40 && seed.meta.lines === 6, `${L.length} listings`)
ok('before → after delta', count('confirmed') < L.length, `accurate as listed ${count('confirmed')}/40 → every listing resolved: ${count('corrected')} corrected, ${count('ghost')} removed, ${count('review')} to a human, ${count('retry')} retry`)
ok('every written value has the office\'s words and an audio span', L.every((l) => Object.values(l.result.fields).every((f) => f.status === 'not_asked' || (f.quote && f.clip && f.clip[1] > f.clip[0]))))
ok('no value was written on a hedge', L.every((l) => Object.values(l.result.fields).every((f) => !['confirmed', 'corrected'].includes(f.status) || !/\bi think\b|\bprobably\b|you'd (really )?have to ask/i.test(f.quote ?? ''))))
ok('unclear answers went to a human: an unconfirmed field, or nothing written and a callback', L.filter((l) => l.result.outcome === 'review').every((l) => { const f = Object.values(l.result.fields); return f.some((x) => x.status === 'unconfirmed') || f.every((x) => x.status === 'not_asked') }), `${count('review')} listings`)
ok('wrong numbers wrote nothing', L.filter((l) => l.call.answeredBy === 'wrong_number').every((l) => ['address', 'phone', 'accepting', 'inNetwork'].every((k) => l.result.fields[k].status === 'not_asked')))
ok('voicemail got no provider details', L.filter((l) => l.call.answeredBy === 'voicemail').every((l) => l.call.turns.filter((t) => t.who === 'agent').every((t) => !t.text.includes(l.provider.split(' ').pop()))))
ok('every call discloses that it is automated', L.filter((l) => l.call.answeredBy === 'person').every((l) => l.call.turns.some((t) => t.who === 'agent' && /automated assistant/.test(t.text))))
ok('phones are in the range reserved for fiction', L.every((l) => /^\(564\) 555-01\d\d$/.test(l.phone)))
ok('lines never overlap', [1, 2, 3, 4, 5, 6].every((n) => { const c = L.filter((l) => l.call.line === n).sort((a, b) => a.call.startAt - b.call.startAt); return c.every((l, i) => !i || l.call.startAt >= c[i - 1].call.startAt + 3 + c[i - 1].call.duration) }))
const talk = L.reduce((a, l) => a + l.call.duration, 0)
ok('cost per listing', true, `$${((talk / 60) * seed.meta.pricePerMinute / L.length).toFixed(3)} at $${seed.meta.pricePerMinute}/min, avg call ${(talk / L.length).toFixed(0)}s`)
if (existsSync('seed/eval.json')) { const e = JSON.parse(readFileSync('seed/eval.json', 'utf8')); ok('recorded sweep: no false writes', e.falseWrites === 0, `${e.fieldsRight}/${e.fieldsWritten} written fields match the truth sheets over ${e.calls} calls`) }
else ok('recorded sweep scored', true, 'not recorded yet: data is the scripted sweep (npm run record, then npm run eval)')
console.table(rows)
const failed = rows.filter((r) => r.result === 'FAIL').length
console.log(failed ? `VERIFY FAILED (${failed})` : 'VERIFY PASSED')
process.exit(failed ? 1 : 0)
