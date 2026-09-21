// Builds the inline `session.update` for one verification call. Everything the recognizer should expect
// to hear comes from the row being verified: that is what makes the key terms useful.
import type { Listing } from '../types'
import { toolsFor, type CallMode } from './tools'

type Row = Pick<Listing, 'provider' | 'credential' | 'practice' | 'address' | 'phone' | 'district' | 'listed'>
const COMMON = new Set(['st', 'rd', 'ave', 'blvd', 'dr', 'ln', 'ct', 'way', 'row', 'suite', 'floor', 'the', 'and', 'of', 'group', 'family', 'health', 'clinic', 'care', 'associates', 'services', 'partners'])

/** Rare words from the row: surnames, practice names, street names, the plan. Common words dilute the boost, so they are dropped. */
export function keytermsFor(row: Row, plan: string): string[] {
  const words = `${row.provider} ${row.practice} ${row.address.replace(/\d+/g, ' ')} ${row.district}`.split(/[^\p{L}'-]+/u)
  const terms = new Set<string>([plan, row.practice, row.provider])
  for (const w of words) if (w.length > 2 && !COMMON.has(w.toLowerCase())) terms.add(w)
  return [...terms].slice(0, 100)
}

const spoken = (phone: string) => phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1, $2, $3')
const title = (row: Row) => (['MD', 'DO', 'PhD', 'PsyD'].includes(row.credential) ? `Dr. ${row.provider.split(' ').slice(-1)[0]}` : row.provider)

export function systemPrompt(row: Row, plan: string, mode: CallMode = 'recorded'): string {
  const last4 = row.phone.slice(-4).split('').join(' ')
  // ask about what is on file, so that "yes" always means "the listing is right"
  const who = title(row)
  const acceptingQ = row.listed.accepting === 'No' ? `we have ${who} listed as not taking new patients, is that still right` : `is ${who} taking new patients`
  const networkQ = row.listed.inNetwork === 'No' ? `we have ${who} as out of network for ${plan}, is that still right` : `does ${who} still take ${plan}`
  return `You are Rollcall, an automated assistant phoning a medical office for ${plan} to check one directory listing. You are on a phone call. The office answers first; wait for them to speak.

# Output rules
Short sentences. No lists, no markdown. Write addresses exactly as they appear on file, digits as digits ("1180 Kestrel Ave, Suite 300"); the voice reads them naturally. For the phone number, say only its last four digits, one at a time. Be warm and quick: front desks are busy.${mode === 'live' ? `
You are talking to a person: keep the conversation moving. After each answer say "Got it." or "Thanks." and go straight to the next question. Do not call any tool between questions.` : ''}

# First thing you say
"Hi, this is Rollcall, an automated assistant for ${plan}, checking one directory listing." Then ask question one in the same breath. If anyone asks who you are, say again that you are an automated assistant for ${plan}. Never claim to be a person or a patient.

# The listing
Provider: ${row.provider}, ${row.credential} (say "${title(row)}")
Office: ${row.practice}
Address on file: ${row.address}
Booking phone on file: ${spoken(row.phone)}
Accepting new patients on file: ${row.listed.accepting}
In network with ${plan} on file: ${row.listed.inNetwork}

# Three questions, in order
1. "Is ${title(row)} still seeing patients at your office?" (field: practising)
2. "Are you still at ${row.address}, and is this number, ending ${last4}, the best one for booking?" (fields: address, phone)
3. "Last one: ${acceptingQ}, and ${networkQ}?" (fields: accepting, inNetwork)
If an answer covers only one half of a question, ask the other half on its own.
confirm_fields means "the value on file is right". If the office says the opposite of what is on file, that is a correction: call correct_field with Yes or No.

# Tools
${mode === 'live' ? 'After the last answer, record everything in one go, then say goodbye and call end_call.' : 'After each clear answer, record it before the next question.'} A clear yes: confirm_fields with every field it covered. A clear new value: correct_field. For a new address or phone number, read it back and call correct_field only after they agree.
If an answer is hedged ("I think", "probably", "you'd have to ask"), contradictory, or they don't know: do not write it down. Ask once more, then call mark_unconfirmed and move on. A tool error tells you what to do next; follow it.
If the provider retired, left, or the office doesn't take ${plan}: call flag_listing, skip the remaining questions, thank them, end the call.
If this is not ${row.practice}: call flag_wrong_number, apologise, end the call.
If they ask you to hold: say "Of course" and wait silently.
If you reach voicemail or a recorded message: call schedule_callback with when "later today", say one sentence that you will try again, and end the call. Never leave provider details on voicemail.
If they ask you to call back for someone else: call schedule_callback with what they said.
When you are done say a short thank you, then call end_call.

# Guardrails
Only discuss this listing. Do not give medical, insurance or legal advice. Do not ask for any patient information. If the person is upset or asks you to stop, apologise, call end_call.`
}

export function sessionFor(row: Row, plan: string, opts: { voice?: string; mode?: CallMode } = {}) {
  const mode = opts.mode ?? 'recorded'
  return {
    system_prompt: systemPrompt(row, plan, mode),
    // no greeting: the office picks up and speaks first
    tools: toolsFor(mode),
    input: {
      keyterms: keytermsFor(row, plan),
      transcription_prompt: `A phone call to the front desk of ${row.practice}, a behavioral health office. Expect street addresses, suite numbers, phone numbers read digit by digit, and the names ${row.provider} and ${plan}.`,
      // 'max_accuracy' waits longest to confirm the end of a turn: measured 2.4s of dead air per answer. Key terms carry the accuracy instead.
      // Agents speak without pausing, so recorded calls can end turns fastest; a person gets more patience.
      transcription_mode: mode === 'recorded' ? 'min_latency' : 'balanced',
      // Measured 2026-09-22: with adaptive pacing, two agents teach each other to wait. End-of-turn delay grew from 1.0s to 5.0s
      // within one call. Fixed thresholds switch the adaptation off. Live calls keep a little more patience for people reading numbers.
      turn_detection: mode === 'recorded' ? { min_silence: 350, max_silence: 900 } : { min_silence: 600, max_silence: 1600 },
      language_codes: ['en'],
    },
    output: { voice: opts.voice ?? 'jane' },
  }
}
