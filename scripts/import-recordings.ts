// Folds recordings/*.json into seed/demo.json so the console replays what actually happened, then re-plans the six lines.
// Audio: converts each WAV to a small file in public/calls/ when ffmpeg is installed, otherwise copies the WAV.
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { formatPhone } from '../lib/agent/gate'
import type { Seed } from '../lib/types'

const seed = JSON.parse(readFileSync('seed/demo.json', 'utf8')) as Seed
mkdirSync('public/calls', { recursive: true })
let ffmpeg = true; try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }) } catch { ffmpeg = false }
const r1 = (n: number) => Math.round(n * 10) / 10
let n = 0
for (const file of readdirSync('recordings').filter((f) => /^L-\d+\.json$/.test(f))) {
  const rec = JSON.parse(readFileSync(`recordings/${file}`, 'utf8'))
  const l = seed.listings.find((x) => x.id === rec.id); if (!l) continue
  const wav = `recordings/${rec.id}.wav`
  let audio: string | undefined
  if (existsSync(wav)) {
    if (ffmpeg) { execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', '16000', '-b:a', '24k', `public/calls/${rec.id}.mp3`]); audio = `/calls/${rec.id}.mp3` }
    else { copyFileSync(wav, `public/calls/${rec.id}.wav`); audio = `/calls/${rec.id}.wav` }
  }
  if (rec.fields.phone?.value) rec.fields.phone.value = formatPhone(rec.fields.phone.value)
  l.result = { ...l.result, outcome: rec.outcome.outcome, stamp: rec.outcome.stamp, reason: rec.outcome.reason, fields: rec.fields }
  l.call = { ...l.call, duration: rec.duration, answeredBy: rec.answeredBy, turns: rec.turns, audio, sessionId: rec.sessions?.caller }
  n++
}
// same scheduler as make-seed: next free line, 3s dialing, 7s flash
const free = Array(seed.meta.lines).fill(1.5)
for (const l of seed.listings) { let line = 0; for (let i = 1; i < free.length; i++) if (free[i] < free[line]) line = i; l.call.line = line + 1; l.call.startAt = r1(free[line]); free[line] = l.call.startAt + 3 + l.call.duration + 7 }
seed.meta.sweepDuration = r1(Math.max(...free))
// real calls run longer than the scripted ones; keep the replay at about 45 seconds of wall time
seed.meta.speed = Math.max(8, Math.round(seed.meta.sweepDuration / 45))
writeFileSync('seed/demo.json', JSON.stringify(seed))
console.log(`${n} recorded call(s) imported${ffmpeg ? ' as 24kbps mp3' : ' as WAV (install ffmpeg to shrink them ~20×)'}. Sweep is now ${seed.meta.sweepDuration}s.`)
