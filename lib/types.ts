export type FieldKey = 'practising' | 'address' | 'phone' | 'accepting' | 'inNetwork'
export type Outcome = 'confirmed' | 'corrected' | 'ghost' | 'review' | 'retry'
export type FieldStatus = 'confirmed' | 'corrected' | 'unconfirmed' | 'not_asked'
export type Speaker = 'agent' | 'office' | 'system' | 'tool'
export type AnsweredBy = 'person' | 'voicemail' | 'intercept' | 'wrong_number'

export interface Word {
  w: string
  t0: number
  t1: number
}

export interface Turn {
  who: Speaker
  /** seconds from the start of the call */
  t0: number
  t1: number
  text: string
  words?: Word[]
  tool?: { name: string; args: Record<string, string | boolean | number> }
}

export interface FieldResult {
  status: FieldStatus
  /** display value after the call; undefined means unchanged */
  value?: string
  quote?: string
  /** second in the call at which the tool call landed */
  at?: number
  /** [t0, t1] of the office's answer inside the call audio */
  clip?: [number, number]
}

export interface Listing {
  id: string
  n: number
  provider: string
  credential: string
  specialty: string
  practice: string
  address: string
  district: string
  grid: string
  x: number
  y: number
  phone: string
  listed: Record<FieldKey, string>
  lastVerifiedDays: number
  result: {
    outcome: Outcome
    reason?: string
    /** phrases in the office's answer that made the agent refuse to write it down */
    hedge?: string[]
    stamp: string
    fields: Record<FieldKey, FieldResult>
  }
  call: {
    line: number
    /** seconds from the start of the sweep */
    startAt: number
    duration: number
    answeredBy: AnsweredBy
    contact?: string
    turns: Turn[]
    audio?: string
    sessionId?: string
  }
  /** true for rows added by a visitor's own call */
  yours?: boolean
  /** label on a visitor's row: "Your call" or "Sample call" */
  tag?: string
}

export interface Seed {
  meta: {
    plan: string
    network: string
    county: string
    sweepDate: string
    lines: number
    speed: number
    pricePerMinute: number
    sweepDuration: number
    simulated: true
  }
  listings: Listing[]
  yourCall: {
    listing: Omit<Listing, 'result' | 'call'>
    sample: { duration: number; answeredBy: AnsweredBy; turns: Turn[]; result: Listing['result'] }
  }
}

export const FIELD_ORDER: FieldKey[] = ['practising', 'address', 'phone', 'accepting', 'inNetwork']

export const FIELD_LABEL: Record<FieldKey, string> = {
  practising: 'Still practising here',
  address: 'Address',
  phone: 'Booking phone',
  accepting: 'New patients',
  inNetwork: 'In network',
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  confirmed: 'Accurate as listed',
  corrected: 'Corrected',
  ghost: "Shouldn't be listed",
  review: 'Needs a human',
  retry: 'Retry scheduled',
}

export const OUTCOME_ORDER: Outcome[] = ['confirmed', 'corrected', 'ghost', 'review', 'retry']
