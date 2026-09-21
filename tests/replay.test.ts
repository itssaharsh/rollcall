import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agentSaid, gate, newGateContext, officeSaid } from '../lib/agent/gate'
import type { Seed, Turn } from '../lib/types'

// Every recorded call is replayed through the current gate. A rule change must not start refusing a write that was
// legitimately accepted when the call was recorded (accepting more is fine; the eval scores those against the truth sheets).
const files = existsSync('recordings') ? readdirSync('recordings').filter((f) => /^L-\d+\.json$/.test(f)) : []
const seed = JSON.parse(readFileSync('seed/demo.json', 'utf8')) as Seed

describe.skipIf(!files.length)('recorded calls replayed through the gate', () => {
  it.each(files)('%s', (file) => {
    const rec = JSON.parse(readFileSync(`recordings/${file}`, 'utf8')) as { id: string; turns: Turn[] }
    const ctx = newGateContext(seed.listings.find((l) => l.id === rec.id)?.listed)
    const newlyRefused: string[] = []
    for (const t of rec.turns) {
      if (t.who === 'office') officeSaid(ctx, t.text)
      if (t.who === 'agent') agentSaid(ctx, t.text)
      if (t.who === 'tool' && t.tool) {
        const v = gate({ name: t.tool.name, arguments: t.tool.args }, ctx)
        if (!t.text.includes('refused') && !v.ok) newlyRefused.push(`${t.tool.name} ${JSON.stringify(t.tool.args)}: ${v.error}`)
      }
    }
    expect(newlyRefused).toEqual([])
  })
})
