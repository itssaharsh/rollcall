// The write gate. The model proposes; this code decides what reaches the directory.
// Guarantee, enforced here and not in the prompt: no value is written unless the office's own words support it.
import type { FieldKey, FieldResult } from '../types'
import { FIELDS, GHOST_REASONS } from './tools'

export interface ToolCall { name: string; arguments: Record<string, unknown> }
/** One question from the agent and everything the office said in reply. One answer often arrives as several utterances. */
export interface Exchange { asked: string; heard: string[] }
export interface GateContext {
  /** the call so far, oldest first. Live calls record every field at the end, so each field is judged against the answer to its own question. */
  exchanges: Exchange[]
  /** the current exchange's utterances; kept in step with `exchanges` by the helpers below */
  heard: string[]
  /** the values on file; a "correction" to the value already on file is a confirmation */
  listed?: Partial<Record<FieldKey, string>>
  /** fields that were already rejected once in this call */
  strikes: Partial<Record<FieldKey, number>>
}
export type GateVerdict =
  | { ok: true; field?: FieldKey; result?: FieldResult; /** confirm_fields writes several at once */ writes?: { field: FieldKey; result: FieldResult }[]; flag?: string; /** goes back to the model with the result */ note?: string }
  | { ok: false; error: string; field?: FieldKey; downgrade?: boolean }

export const newGateContext = (listed?: Partial<Record<FieldKey, string>>): GateContext => { const heard: string[] = []; return { exchanges: [{ asked: '', heard }], heard, strikes: {}, listed } }

const sameValue = (a: string, b: string) => { const n = (x: string) => x.toLowerCase().replace(/\bstreet\b/g, 'st').replace(/\bavenue\b/g, 'ave').replace(/\broad\b/g, 'rd').replace(/\bboulevard\b/g, 'blvd').replace(/\bdrive\b/g, 'dr').replace(/[^a-z0-9]/g, ''); return n(a) === n(b) }

const NEGATIVE = /\b(not|isn'?t|aren'?t|no longer|closed|full|stopped|doesn'?t|don'?t|dropped|out of network|retired|left)\b|^no\b/
const AFFIRMS = /\b(yes|yep|yeah|correct|that'?s right|still|does take|do take|we do|she does|he does|they do)\b/
const POSITIVE_TOPIC = /\b(taking|accepting|opened|openings?|welcome|in[- ]network|we do|does take|do take|still (here|with us|seeing))\b/

/**
 * Recorded 2026-09-22 (listing L-026): on file "not accepting", the office said "yes, she opened up again", and the model
 * "confirmed" the old No. For yes/no fields a confirmation must not contradict the polarity of what the office said.
 */
export function contradictsListed(field: FieldKey, listed: string | undefined, evidence: string): boolean {
  if (!listed || !['practising', 'accepting', 'inNetwork'].includes(field)) return false
  // One sentence often answers two questions ("She is not accepting new patients, but she does take Cascadia"; caught by
  // tests/replay.test.ts on listing L-017). Polarity is judged on the clause about this field when there is one.
  const clauses = evidence.toLowerCase().split(/\bbut\b|\band\b|[,;.]/).map((c) => c.trim()).filter(Boolean)
  const e = clauses.filter((c) => TOPIC[field].test(c)).join(' ') || evidence.toLowerCase().trim()
  if (listed === 'No') return !NEGATIVE.test(e) && POSITIVE_TOPIC.test(e)
  return NEGATIVE.test(e) && !AFFIRMS.test(e)
}

/**
 * At hang-up, fields the model never recorded. Live calls record everything at the end and the model sometimes drops one
 * (rehearsal, 2026-09-22: four fields written, the first forgotten). A forgotten field is confirmed only when the office gave a
 * clear yes to the question that was about that field: affirmative, not negative, not hedged. Anything else stays unwritten.
 */
export function sweepUp(ctx: GateContext, fields: Record<FieldKey, FieldResult>): { field: FieldKey; result: FieldResult }[] {
  return FIELDS.filter((f) => fields[f].status === 'not_asked').flatMap((field) => {
    const asked = [...ctx.exchanges].reverse().find((x) => x.heard.length && ASKED[field].test(x.asked.toLowerCase()))
    if (!asked || asked.heard.some(isHedged)) return []
    const clauses = asked.heard.join('. ').toLowerCase().split(/\bbut\b|\band\b|[,;.]/).map((c) => c.trim()).filter(Boolean)
    const about = clauses.filter((c) => TOPIC[field].test(c))
    const judged = (about.length ? about : clauses).join(' ')
    if (!AFFIRMS.test(asked.heard.join(' ').toLowerCase()) || NEGATIVE.test(judged) || /\b(instead|moved|new (address|number)|changed)\b/.test(judged)) return []
    if (contradictsListed(field, ctx.listed?.[field], judged)) return []
    return [{ field, result: { status: 'confirmed' as const, quote: asked.heard.join(' ') } }]
  })
}

/**
 * What a field holds after a new write. Recorded 2026-09-22 (listing L-010): the model corrected the booking phone, then
 * swept it up in a later confirm_fields and the correction was lost. A confirmation never overwrites a correction.
 */
export function mergeWrite(prev: FieldResult | undefined, next: FieldResult): FieldResult {
  return prev?.status === 'corrected' && next.status === 'confirmed' ? prev : next
}
/** a new question opens a new exchange; "Got it." does not */
export function agentSaid(ctx: GateContext, text: string) { if (text.includes('?')) { ctx.heard = []; ctx.exchanges.push({ asked: text, heard: ctx.heard }) } }
export function officeSaid(ctx: GateContext, text: string) { ctx.heard.push(text) }

/** which of the agent's questions was about this field */
const ASKED: Record<FieldKey, RegExp> = {
  practising: /still (seeing patients|practi[cs]|with you|at your office)/, address: /\b(still at|address|located|moved)\b/, phone: /\b(number|booking|to book)\b/,
  accepting: /\b(new patients?|accepting)\b/, inNetwork: /\b(still take|takes?\b.*\bplan|in[- ]network|accepts?\b.*\bplan)/,
}
/** what the office said in reply to the question about `field`; falls back to the current exchange */
export function answerTo(field: FieldKey, ctx: GateContext): string[] {
  const hit = [...ctx.exchanges].reverse().find((x) => x.heard.length && ASKED[field].test(x.asked.toLowerCase()))
  return (hit ?? [...ctx.exchanges].reverse().find((x) => x.heard.length))?.heard ?? ctx.heard
}

/** everything the office said in any exchange about `field`, plus the current one: numbers may be given once and read back later */
export function allSaidAbout(field: FieldKey, ctx: GateContext): string[] {
  const about = ctx.exchanges.filter((x) => ASKED[field].test(x.asked.toLowerCase())).flatMap((x) => x.heard)
  return [...new Set([...about, ...ctx.heard])]
}

const HEDGES = [/\bi think\b/, /\bi guess\b/, /\bmaybe\b/, /\bprobably\b/, /\bnot sure\b/, /\bi believe\b/, /\bas far as i know\b/, /\bmight\b/, /\byou(?:'?d| would) (really )?have to ask\b/, /\bdon'?t quote me\b/, /\bpossibly\b/, /\bi don'?t know\b/,
  /\balmost\b/, /\bperhaps\b/, /\b(kind|sort) of\b/, /\bi suppose\b/, /\bshould be\b/, /\b(pretty|fairly|quite) sure\b/, /\bnot (certain|positive|100)\b/, /\bcould be\b/,
  /\bmore or less\b/, /\blast i (heard|checked|knew)\b/, /\bi assume\b/, /\bi'?d (guess|say)\b/, /\bsupposed(ly)? to\b|\bsupposedly\b/, /\bi want to say\b/, /\bif i (remember|recall)\b/]
const NUMBER_WORDS: Record<string, string> = { zero: '0', oh: '0', o: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20', thirty: '30', forty: '40', fifty: '50', sixty: '60', seventy: '70', eighty: '80', ninety: '90' }

/** what an office says when it is talking about each field */
const TOPIC: Record<FieldKey, RegExp> = {
  practising: /\b(still|here|practic|seeing patients|with us|works?)\b/, address: /\b(address|street|st|ave|avenue|road|rd|suite|located|building|moved)\b/,
  phone: /\b(number|line|phone|call|booking|book)\b/, accepting: /\b(new patients?|accepting|taking|waitlist|panel|openings?)\b/, inNetwork: /\b(plan|network|insurance|cascadia|take|accept)\b/,
}

/**
 * The sentence that supports writing `field`, or null. A fully clear answer supports every field it was asked about.
 * If any part of the answer was hedged, a field is supported only by a clear sentence about that field:
 * "I think so. You'd have to ask the doctor. But yes, we do take Cascadia." supports inNetwork and nothing else.
 */
export function evidenceFor(field: FieldKey, heard: string[]): string | null {
  const said = heard.filter((u) => u.trim())
  if (!said.length) return null
  if (!said.some(isHedged)) return said.join(' ')
  return said.find((u) => !isHedged(u) && TOPIC[field].test(u.toLowerCase())) ?? null
}

export const isHedged = (text: string) => { const t = text.toLowerCase(); return HEDGES.some((h) => h.test(t)) || /\?\s*$/.test(t.trim()) }

/** Every way the digits in a sentence could be read: "twenty-three ten", "2 3 1 0" and "2310" all contain 2310. */
export function digitsHeard(text: string): string {
  const tokens = text.toLowerCase().replace(/[-–]/g, ' ').split(/[^a-z0-9]+/).filter(Boolean)
  let out = ''
  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i]
    if (/^\d+$/.test(w)) { out += w; continue }
    const v = NUMBER_WORDS[w]
    if (v === undefined) { out += ' '; continue }
    // "twenty three" → 23, "twenty" alone → 20
    const next = NUMBER_WORDS[tokens[i + 1] ?? '']
    if (v.length === 2 && v.endsWith('0') && v !== '10' && next !== undefined && next.length === 1 && next !== '0') { out += v[0] + next; i++ } else out += v
  }
  return out
}

/** the directory's phone format, however the model wrote it */
export const formatPhone = (v: string) => { const d = v.replace(/\D/g, '').slice(-10); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : v }

const numbersIn = (value: string) => value.match(/\d+/g) ?? []

export function gate(call: ToolCall, ctx: GateContext): GateVerdict {
  const a = call.arguments
  const field = a.field as FieldKey | undefined
  if (call.name === 'confirm_fields') {
    const list = Array.isArray(a.fields) ? (a.fields as unknown[]) : []
    const bad = list.filter((f) => !FIELDS.includes(f as FieldKey))
    if (!list.length || bad.length) return { ok: false, error: `confirm_fields needs a list of fields from: ${FIELDS.join(', ')}.${bad.length ? ` Unknown: ${bad.join(', ')}.` : ''}` }
    if (!ctx.exchanges.some((x) => x.heard.some((u) => u.trim()))) return { ok: false, error: 'Nothing was heard from the office yet. Ask the question again.' }
    const fields = list as FieldKey[]
    const supported = fields.flatMap((field) => { const quote = evidenceFor(field, answerTo(field, ctx)); return quote ? [{ field, result: { status: 'confirmed' as const, quote } }] : [] })
    const clash = supported.filter((w) => contradictsListed(w.field, ctx.listed?.[w.field], w.result.quote!))
    const writes = supported.filter((w) => !clash.includes(w))
    if (clash.length) {
      const note = clash.map((w) => `${w.field} is "${ctx.listed![w.field]}" on file, but the office's answer ("${w.result.quote!.slice(0, 70)}") says otherwise. If they clearly said the opposite, call correct_field for ${w.field} with value ${ctx.listed![w.field] === 'No' ? 'Yes' : 'No'}; if unsure, ask once more.`).join(' ')
      return writes.length ? { ok: true, writes, note } : { ok: false, error: note }
    }
    const refused = fields.filter((f) => !writes.some((w) => w.field === f))
    if (!refused.length) return { ok: true, writes }
    const second = refused.filter((f) => (ctx.strikes[f] = (ctx.strikes[f] ?? 0) + 1) >= 2)
    const hedge = answerTo(refused[0], ctx).find(isHedged) ?? ''
    const msg = second.length
      ? `Still unclear about ${second.join(' and ')}. Sent to a human reviewer. Do not ask again; move on.`
      : `The answer about ${refused.join(' and ')} was hedged ("${hedge.slice(0, 80)}"). Not written down. Ask about ${refused.join(' and ')} once more for a clear yes or no; if it is still unclear call mark_unconfirmed.`
    if (writes.length) return { ok: true, writes, note: msg, ...(second.length ? {} : {}) }
    return second.length ? { ok: false, downgrade: true, field: second[0], error: msg } : { ok: false, error: msg }
  }
  const needsField = ['confirm_field', 'correct_field', 'mark_unconfirmed'].includes(call.name)
  if (needsField && (!field || !FIELDS.includes(field))) return { ok: false, error: `Unknown field '${String(a.field)}'. Use one of: ${FIELDS.join(', ')}.` }

  const reply = field && FIELDS.includes(field) ? answerTo(field, ctx) : ctx.heard
  const said = reply.join(' ')
  const latest = reply[reply.length - 1] ?? ''
  const strike = (msg: string): GateVerdict => {
    const n = (ctx.strikes[field!] = (ctx.strikes[field!] ?? 0) + 1)
    return n >= 2 ? { ok: false, field, downgrade: true, error: `${msg} This is the second unclear answer for ${field}. It has been sent to a human reviewer. Do not ask again; move on to the next question.` } : { ok: false, field, error: msg }
  }

  switch (call.name) {
    case 'confirm_field':
    case 'correct_field': {
      if (!latest.trim()) return strike(`Nothing was heard from the office for ${field}. Ask the question again.`)
      const support = evidenceFor(field!, reply)
      if (!support) return strike(`The office's answer for ${field} was hedged ("${(reply.find(isHedged) ?? latest).slice(0, 80)}"). Do not write it down. Ask once more for a clear yes or no, and if it is still unclear call mark_unconfirmed.`)
      if (call.name === 'confirm_field') return { ok: true, field, result: { status: 'confirmed', quote: support } }

      const value = String(a.value ?? '').trim()
      if (!value) return { ok: false, field, error: `correct_field needs the new value for ${field}.` }
      if (ctx.listed?.[field!] !== undefined && sameValue(value, ctx.listed[field!]!)) return { ok: true, field, result: { status: 'confirmed', quote: support } }
      if (field === 'practising' || field === 'accepting' || field === 'inNetwork') {
        if (!/^(yes|no)$/i.test(value)) return { ok: false, field, error: `The value for ${field} must be Yes or No.` }
        return { ok: true, field, result: { status: 'corrected', value: value[0].toUpperCase() + value.slice(1).toLowerCase(), quote: support } }
      }
      // address and phone: every number in the new value must have been spoken by the office, in any exchange about this field
      // (recorded, listing L-038: the office gave the new address, the agent read it back, and the reply to the read-back had no digits)
      const spoken = allSaidAbout(field!, ctx)
      const heardDigits = digitsHeard(spoken.join(' ')).replace(/\s+/g, ' ')
      const compact = heardDigits.replace(/\s/g, '')
      // Reported by Saharsh, 2026-09-22: "we're in suite 4 instead of 3" went to a human, because '88' (the unchanged street number)
      // was never spoken. Only the numbers that differ from the value on file need to have been heard.
      const onFile = new Set(numbersIn(ctx.listed?.[field!] ?? ''))
      const wanted = field === 'phone' ? [value.replace(/\D/g, '').slice(-4)] : numbersIn(value).filter((n) => !onFile.has(n))
      const tokens = heardDigits.split(' ')
      // a short number ("4") must be heard on its own, not found inside a longer one ("564")
      const missing = wanted.filter((n) => n && !(n.length >= 3 ? compact.includes(n) : tokens.includes(n)) && !tokens.includes(n))
      if (missing.length) return strike(`Could not verify ${field!.toUpperCase()}: ${missing.map((m) => `'${m}'`).join(', ')} was not heard in the office's words. Ask them to repeat the ${field === 'phone' ? 'number' : 'street number and suite'} slowly, read it back, then call correct_field again.`)
      // quote the sentence that actually carried the numbers
      const carrier = (wanted.length ? [...spoken].reverse().find((u) => { const d = digitsHeard(u); return wanted.every((n) => d.replace(/\s/g, '').includes(n)) }) : undefined) ?? support
      return { ok: true, field, result: { status: 'corrected', value: field === 'phone' ? formatPhone(value) : value, quote: carrier } }
    }
    case 'mark_unconfirmed':
      // quote the hedge itself: that is what the reviewer needs to hear
      return { ok: true, field, result: { status: 'unconfirmed', quote: [...reply].reverse().find(isHedged) ?? (latest || undefined) } }
    case 'flag_listing': {
      const reason = String(a.reason ?? '')
      if (!(GHOST_REASONS as readonly string[]).includes(reason)) return { ok: false, error: `Unknown reason '${reason}'. Use one of: ${GHOST_REASONS.join(', ')}.` }
      if (!latest.trim()) return { ok: false, error: 'Nothing was heard from the office yet. Ask before flagging the listing.' }
      if (isHedged(latest)) return { ok: false, error: `That answer was hedged ("${latest.slice(0, 80)}"). Ask once more whether the provider still practises here before flagging.` }
      return { ok: true, flag: reason, field: reason === 'not_in_network' ? 'inNetwork' : 'practising', result: { status: 'corrected', value: 'No', quote: latest } }
    }
    case 'flag_wrong_number':
      return { ok: true, flag: 'wrong_number' }
    case 'schedule_callback':
      return a.when ? { ok: true, flag: 'callback' } : { ok: false, error: "schedule_callback needs 'when'. Use 'later today' for voicemail." }
    case 'end_call':
      return { ok: true, flag: 'end' }
  }
  return { ok: false, error: `Unknown tool '${call.name}'.` }
}
