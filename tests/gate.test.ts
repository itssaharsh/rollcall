import { describe, expect, it } from 'vitest'
import { agentSaid, digitsHeard, gate, isHedged, mergeWrite, newGateContext, officeSaid, type GateContext } from '../lib/agent/gate'

const ctx = (...heard: string[]): GateContext => { const c = newGateContext(); heard.forEach((h) => officeSaid(c, h)); return c }

describe('write gate: no value is written unless the office said it', () => {
  it('writes a clear confirmation with the quote as evidence', () => {
    const v = gate({ name: 'confirm_fields', arguments: { fields: ['address', 'phone'] } }, ctx("Yes to both, that's us."))
    expect(v).toMatchObject({ ok: true, writes: [{ field: 'address', result: { status: 'confirmed', quote: "Yes to both, that's us." } }, { field: 'phone', result: { status: 'confirmed' } }] })
  })

  it('refuses a hedged yes, and tells the agent what to do next', () => {
    const v = gate({ name: 'confirm_fields', arguments: { fields: ['accepting', 'inNetwork'] } }, ctx("Um, I think he's still taking some patients? You'd have to ask the doctor."))
    expect(v.ok).toBe(false)
    if (!v.ok) { expect(v.error).toMatch(/hedged/); expect(v.error).toMatch(/mark_unconfirmed/) }
  })

  it('judges the whole answer, not its last sentence (recorded 2026-09-22, listing L-009)', () => {
    const heard = ['I think so.', 'You would have to ask the doctor about that.', 'But yes, we do take Cascadia Health Plan.']
    const both = gate({ name: 'confirm_fields', arguments: { fields: ['accepting', 'inNetwork'] } }, ctx(...heard))
    expect(both).toMatchObject({ ok: true, writes: [{ field: 'inNetwork', result: { quote: 'But yes, we do take Cascadia Health Plan.' } }] })
    if (both.ok) { expect(both.writes).toHaveLength(1); expect(both.note).toMatch(/accepting was hedged|about accepting/) }
    expect(gate({ name: 'mark_unconfirmed', arguments: { field: 'accepting', reason: 'hedged_answer' } }, ctx(...heard))).toMatchObject({ ok: true, result: { status: 'unconfirmed', quote: 'You would have to ask the doctor about that.' } })
  })

  it('when everything is recorded at the end, each field is judged against the answer to its own question', () => {
    const c = newGateContext()
    officeSaid(c, 'Juniper Row Counseling.')
    agentSaid(c, 'Hi, this is Rollcall, an automated assistant for Cascadia Health Plan. Is Salome Reyes still seeing patients at your office?'); officeSaid(c, "Yes, she's here.")
    agentSaid(c, 'Got it. Are you still at 88 Juniper Row, Suite 3, and is this number, ending 0 1 4 1, the best one for booking?'); officeSaid(c, 'Um, I think we might be moving?'); officeSaid(c, 'The number is right though.')
    agentSaid(c, 'Thanks. Last one: is she taking new patients, and does she still take Cascadia Health Plan?'); officeSaid(c, 'Yes to both.')
    const v = gate({ name: 'confirm_fields', arguments: { fields: ['practising', 'address', 'phone', 'accepting', 'inNetwork'] } }, c)
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.writes!.map((w) => w.field)).toEqual(['practising', 'phone', 'accepting', 'inNetwork']) // the hedged address is not written
      expect(v.writes!.find((w) => w.field === 'practising')!.result.quote).toBe("Yes, she's here.")
      expect(v.writes!.find((w) => w.field === 'phone')!.result.quote).toBe('The number is right though.')
      expect(v.note).toMatch(/address/)
    }
  })

  it('a confirmation never overwrites a correction, and a correction to the value on file is a confirmation (recorded, listing L-010)', () => {
    const corrected = { status: 'corrected' as const, value: '(564) 555-0160', quote: 'The booking number is 564-555-0160.' }
    expect(mergeWrite(corrected, { status: 'confirmed', quote: 'Yes.' })).toBe(corrected)
    expect(mergeWrite({ status: 'confirmed', quote: 'Yes.' }, corrected)).toBe(corrected)
    const c = newGateContext({ address: '301 Bracken Ave' }); officeSaid(c, 'We are still at 301 Bracken Avenue.')
    expect(gate({ name: 'correct_field', arguments: { field: 'address', value: '301 Bracken Avenue' } }, c)).toMatchObject({ ok: true, result: { status: 'confirmed' } })
  })

  it('a confirmation cannot contradict what the office said (recorded, listing L-026)', () => {
    const c = newGateContext({ accepting: 'No', inNetwork: 'Yes' }); officeSaid(c, 'Yes, Dr. Morales is taking new patients again, and we do take Cascadia.')
    const v = gate({ name: 'confirm_fields', arguments: { fields: ['accepting', 'inNetwork'] } }, c)
    expect(v).toMatchObject({ ok: true, writes: [{ field: 'inNetwork' }] })
    if (v.ok) { expect(v.writes).toHaveLength(1); expect(v.note).toMatch(/correct_field for accepting with value Yes/) }
    const d = newGateContext({ accepting: 'Yes' }); officeSaid(d, "No, the panel is full. We're not adding anyone.")
    expect(gate({ name: 'confirm_fields', arguments: { fields: ['accepting'] } }, d).ok).toBe(false)
    const e = newGateContext({ accepting: 'No' }); officeSaid(e, "Yes, that's right, she isn't taking anyone new.")
    expect(gate({ name: 'confirm_fields', arguments: { fields: ['accepting'] } }, e)).toMatchObject({ ok: true })
  })

  it('accepts numbers given in an earlier exchange about the same field (recorded, listing L-038)', () => {
    const c = newGateContext({ address: '1350 Varnum Blvd' })
    agentSaid(c, 'Are you still at 1350 Varnum Blvd, and is this number, ending 0 1 3 8, the best one for booking?'); officeSaid(c, 'No, we moved in June. We are at 1365 Varnum Blvd, Suite 400.')
    agentSaid(c, 'So the new address is 1365 Varnum Blvd, Suite 400. Is that right?'); officeSaid(c, 'Yes.')
    expect(gate({ name: 'correct_field', arguments: { field: 'address', value: '1365 Varnum Blvd, Suite 400' } }, c)).toMatchObject({ ok: true, result: { status: 'corrected', quote: 'No, we moved in June. We are at 1365 Varnum Blvd, Suite 400.' } })
  })

  it('a changed suite is a correction, even though the street number was never spoken (reported by Saharsh)', () => {
    const c = newGateContext({ address: '88 Juniper Row, Suite 3' })
    agentSaid(c, 'Are you still at 88 Juniper Row, Suite 3, and is this number, ending 0 1 4 1, the best one for booking?'); officeSaid(c, "We're in suite 4 instead of 3. The number is right.")
    expect(gate({ name: 'correct_field', arguments: { field: 'address', value: '88 Juniper Row, Suite 4' } }, c)).toMatchObject({ ok: true, result: { status: 'corrected', value: '88 Juniper Row, Suite 4' } })
    // but a number nobody said is still refused, and a lone digit is not found inside a longer number
    expect(gate({ name: 'correct_field', arguments: { field: 'address', value: '88 Juniper Row, Suite 7' } }, c).ok).toBe(false)
    const d = newGateContext({ address: '88 Juniper Row, Suite 3' }); officeSaid(d, 'Call us on 564 555 0141 about the suite.')
    expect(gate({ name: 'correct_field', arguments: { field: 'address', value: '88 Juniper Row, Suite 4' } }, d).ok).toBe(false)
  })

  it.each(['Almost, yeah.', 'Maybe.', "She's kind of taking new patients.", 'That should be right.', "I'm pretty sure she is.", 'Last I checked, yes.', 'More or less.', 'Perhaps, yes.', "I'd say so."])('"%s" is not written down', (said) => {
    const v = gate({ name: 'confirm_fields', arguments: { fields: ['accepting'] } }, ctx(said))
    expect(v.ok).toBe(false)
  })

  it.each(["Yes, she's taking new patients.", 'Yep, same suite.', "That's correct.", 'We do, yes.'])('"%s" is a clear answer', (said) => {
    expect(gate({ name: 'confirm_fields', arguments: { fields: ['accepting'] } }, ctx(said)).ok).toBe(true)
  })

  it('sends the field to a human on the second unclear answer', () => {
    const c = ctx('Probably?')
    gate({ name: 'confirm_fields', arguments: { fields: ['accepting'] } }, c)
    const second = gate({ name: 'correct_field', arguments: { field: 'accepting', value: 'No' } }, c)
    expect(second).toMatchObject({ ok: false, downgrade: true, field: 'accepting' })
  })

  it('refuses an address whose street number the office never said', () => {
    const v = gate({ name: 'correct_field', arguments: { field: 'address', value: '2310 Pruett St, Suite 1' } }, ctx('No, we moved in June. We are on Pruett Street now.'))
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.error).toMatch(/'2310'/)
  })

  it('accepts the same address once the numbers were heard, however they were spoken', () => {
    for (const heard of ["We're at 2310 Pruett Street, Suite 1.", "It's twenty-three ten Pruett Street, suite one.", 'Two three one zero Pruett, suite one.'])
      expect(gate({ name: 'correct_field', arguments: { field: 'address', value: '2310 Pruett St, Suite 1' } }, ctx(heard)).ok).toBe(true)
  })

  it('checks the last four digits of a new phone number', () => {
    const call = { name: 'correct_field', arguments: { field: 'phone', value: '(564) 555-0160' } }
    expect(gate(call, ctx('Patients should call five six four, five five five, oh one six oh.')).ok).toBe(true)
    expect(gate(call, ctx('Patients should call the other line.')).ok).toBe(false)
  })

  it('only takes yes or no for the yes/no fields', () => {
    expect(gate({ name: 'correct_field', arguments: { field: 'inNetwork', value: 'sometimes' } }, ctx('We dropped that plan.')).ok).toBe(false)
    expect(gate({ name: 'correct_field', arguments: { field: 'inNetwork', value: 'no' } }, ctx('We dropped that plan.'))).toMatchObject({ ok: true, result: { value: 'No' } })
  })

  it('will not remove a listing on a hedge, or before anyone has spoken', () => {
    expect(gate({ name: 'flag_listing', arguments: { reason: 'provider_retired' } }, ctx('I think he might have retired?')).ok).toBe(false)
    expect(gate({ name: 'flag_listing', arguments: { reason: 'provider_retired' } }, ctx()).ok).toBe(false)
    expect(gate({ name: 'flag_listing', arguments: { reason: 'provider_retired' } }, ctx('Dr. Alvarez retired last spring.'))).toMatchObject({ ok: true, flag: 'provider_retired', result: { value: 'No' } })
  })

  it('rejects fields and tools it does not know', () => {
    expect(gate({ name: 'confirm_fields', arguments: { fields: ['fax'] } }, ctx('Yes.')).ok).toBe(false)
    expect(gate({ name: 'confirm_fields', arguments: { fields: [] } }, ctx('Yes.')).ok).toBe(false)
    expect(gate({ name: 'delete_everything', arguments: {} }, ctx('Yes.')).ok).toBe(false)
  })
})

describe('helpers', () => {
  it('hears digits in every spoken form', () => {
    expect(digitsHeard('twenty-three ten')).toContain('2310')
    expect(digitsHeard('suite four hundred')).toContain('4')
    expect(digitsHeard('oh one six oh').replace(/\s/g, '')).toBe('0160')
  })
  it('knows a hedge from an answer', () => {
    expect(isHedged("Yes, she's here Monday through Thursday.")).toBe(false)
    expect(isHedged('As far as I know, yes.')).toBe(true)
    expect(isHedged('Is that the old building?')).toBe(true)
  })
})
