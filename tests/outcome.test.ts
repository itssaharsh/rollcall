import { describe, expect, it } from 'vitest'
import seed from '../seed/demo.json'
import { deriveOutcome } from '../lib/agent/outcome'
import type { Seed } from '../lib/types'

const { listings, yourCall } = seed as unknown as Seed
const FLAG: Record<string, string> = { 'Provider retired': 'provider_retired', 'Left the practice': 'left_practice', "Doesn't take this plan": 'not_in_network', 'Wrong number': 'wrong_number' }

describe('outcome is derived from what was written, not from the model', () => {
  it.each(listings.map((l) => [l.id, l] as const))('%s', (_id, l) => {
    const flags = l.call.turns.filter((t) => t.who === 'tool' && t.text === 'schedule_callback').map(() => 'callback')
    if (l.result.reason && FLAG[l.result.reason]) flags.push(FLAG[l.result.reason])
    const got = deriveOutcome({ fields: l.result.fields, flags, answeredBy: l.call.answeredBy })
    expect(got.outcome).toBe(l.result.outcome)
  })

  it('the sample call derives the same way', () => {
    // the sample is a real recorded rehearsal, so the expectation comes from the data: a suite corrected, a hedge sent to a person
    expect(deriveOutcome({ fields: yourCall.sample.result.fields, flags: [], answeredBy: 'person' })).toMatchObject({ outcome: yourCall.sample.result.outcome, stamp: yourCall.sample.result.stamp })
    expect(yourCall.sample.result.fields.address.status).toBe('corrected')
    expect(yourCall.sample.result.fields.accepting.status).toBe('unconfirmed')
  })

  it('a call that ends with questions unanswered goes to a person', () => {
    const fields = { ...listings[0].result.fields, inNetwork: { status: 'not_asked' as const } }
    expect(deriveOutcome({ fields, flags: [], answeredBy: 'person' }).outcome).toBe('review')
  })
})
