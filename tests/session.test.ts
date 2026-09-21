import { describe, expect, it } from 'vitest'
import seed from '../seed/demo.json'
import { keytermsFor, sessionFor, systemPrompt } from '../lib/agent/session'
import { FIELDS, TOOLS, toolsFor } from '../lib/agent/tools'
import type { Seed } from '../lib/types'

const { listings, meta } = seed as unknown as Seed

describe('session config', () => {
  it('every tool schema is an object schema with its required keys defined (the API does not validate this)', () => {
    for (const t of TOOLS) {
      expect(t.type).toBe('function'); expect(t.name).toMatch(/^[a-z_]+$/); expect(t.description.length).toBeGreaterThan(20)
      expect(t.parameters.type).toBe('object')
      for (const r of t.parameters.required) expect(Object.keys(t.parameters.properties)).toContain(r)
    }
    expect((TOOLS[0].parameters.properties.fields as { items: { enum: string[] } }).items.enum).toEqual(FIELDS)
    expect(toolsFor('live').every((t) => t.execution_mode === 'interactive')).toBe(true)
    expect(toolsFor('recorded').every((t) => t.execution_mode === 'hold')).toBe(true)
  })

  it('key terms come from the row, stay under 100, and skip common words', () => {
    for (const l of listings) {
      const terms = keytermsFor(l, meta.plan)
      expect(terms.length).toBeLessThanOrEqual(100)
      expect(terms).toContain(l.practice)
      expect(terms.map((t) => t.toLowerCase())).not.toContain('suite')
    }
    expect(keytermsFor(listings[2], meta.plan)).toEqual(expect.arrayContaining(['Venkataraman', 'Kestrel']))
  })

  it('the agent always says it is automated, and never greets first', () => {
    const s = sessionFor(listings[0], meta.plan)
    expect(systemPrompt(listings[0], meta.plan)).toMatch(/automated assistant for Cascadia Health Plan/)
    expect(systemPrompt(listings[0], meta.plan, 'live')).toMatch(/Got it/)
    expect(systemPrompt(listings[0], meta.plan)).toMatch(/Never claim to be a person/)
    expect(s).not.toHaveProperty('greeting')
    expect(s.input.transcription_prompt.length).toBeLessThanOrEqual(1750)
  })
})

describe('seed integrity', () => {
  it('every phone number is in the range reserved for fiction', () => {
    for (const l of listings) expect(l.phone).toMatch(/^\(564\) 555-01\d\d$/)
  })
  it('every written value keeps the words and the audio span it came from', () => {
    for (const l of listings) for (const f of Object.values(l.result.fields)) if (f.status !== 'not_asked') { expect(f.quote).toBeTruthy(); expect(f.clip?.[1]).toBeGreaterThan(f.clip![0]) }
  })
})
