// Generates seed/demo.json: 40 fictional listings, their scripted calls and a six-line schedule.
// Everything here is invented. Phone numbers stay inside 555-0100..0199, which is reserved for fiction.
// When the recorded sweep exists, scripts/import-sessions (build phase) overwrites `call` and clip times.
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// deterministic PRNG so the seed is stable between runs
let s = 20260921
const rnd = () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (a) => a[Math.floor(rnd() * a.length)]
const between = (a, b) => a + rnd() * (b - a)
const r1 = (n) => Math.round(n * 10) / 10

const PLAN = 'Cascadia Health Plan'

// ── map ───────────────────────────────────────────────────────────────────────
const W = 1000, H = 760
const DISTRICTS = {
  Northgate: [70, 400, 50, 210],
  'Quarry Heights': [590, 940, 50, 230],
  'Old Mill': [60, 340, 270, 470],
  Harbor: [360, 470, 300, 500],
  Eastbank: [690, 950, 300, 540],
  Fernhill: [90, 430, 550, 715],
  Saltmarsh: [650, 930, 590, 715],
}
// river centre line; keep pins off it
const RIVER = [[540, 0], [500, 120], [470, 250], [560, 380], [600, 470], [540, 600], [570, 760]]
const distToSeg = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
const nearRiver = (x, y) => RIVER.slice(1).some((p, i) => distToSeg(x, y, RIVER[i], p) < 44)
const placed = []
const place = (district) => {
  const [x0, x1, y0, y1] = DISTRICTS[district]
  for (let i = 0; i < 400; i++) {
    const x = Math.round(between(x0, x1)), y = Math.round(between(y0, y1))
    if (nearRiver(x, y)) continue
    if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < 40)) continue
    placed.push([x, y]); return [x, y]
  }
  throw new Error('could not place a pin in ' + district)
}
const gridRef = (x, y) => 'ABCDEF'[Math.min(5, Math.floor(x / (W / 6)))] + (Math.min(4, Math.floor(y / (H / 5))) + 1)

// ── people and places (all fictional) ─────────────────────────────────────────
const PROVIDERS = [
  ['Imani Okafor', 'PsyD', 'Clinical psychology', 'Alder Street Counseling', '412 Alder St, Suite 2', 'Old Mill'],
  ['Daniel Reyes-Whitlock', 'LCSW', 'Clinical social work', 'Harborlight Behavioral Health', '75 Wharf Rd', 'Harbor'],
  ['Priya Venkataraman', 'MD', 'Psychiatry', 'Northgate Psychiatry Associates', '1180 Kestrel Ave, Suite 300', 'Northgate'],
  ['Tomasz Kowalczyk', 'LMFT', 'Marriage and family therapy', 'Old Mill Family Therapy', '29 Foundry Rd', 'Old Mill'],
  ['Grace Oyelaran', 'PMHNP', 'Psychiatric nursing', 'Tamarack Wellness Group', '640 Tamarack Way', 'Fernhill'],
  ['Marcus Bellweather', 'PhD', 'Clinical psychology', 'Quarry Heights Psychology', '18 Overlook Dr, Suite 5', 'Quarry Heights'],
  ['Lucía Ferreira', 'LPC', 'Counseling', 'Eastbank Counseling Collective', '2203 Pruett St', 'Eastbank'],
  ['Hannah Lindqvist', 'LCSW', 'Clinical social work', 'Saltmarsh Community Clinic', '9 Heron Ln', 'Saltmarsh'],
  ['Arjun Mehta', 'MD', 'Child and adolescent psychiatry', 'Northgate Psychiatry Associates', '1180 Kestrel Ave, Suite 300', 'Northgate'],
  ['Naledi Dlamini', 'PsyD', 'Clinical psychology', 'Fernhill Psychological Services', '301 Bracken Ave', 'Fernhill'],
  ['Owen Gallagher', 'LMFT', 'Marriage and family therapy', 'Lantern Family Counseling', '57 Cooper St', 'Harbor'],
  ['Mei-Ling Zhou', 'MD', 'Psychiatry', 'Eastbank Mind & Mood Clinic', '1412 Varnum Blvd, Suite 210', 'Eastbank'],
  ['Rafael Quintero', 'LCSW', 'Addiction counseling', 'Second Tide Recovery', '88 Drydock Rd', 'Harbor'],
  ['Hector Alvarez', 'MD', 'Psychiatry', 'Quarry Heights Psychiatry', '44 Overlook Dr', 'Quarry Heights'],
  ['Sinéad Byrne', 'LPC', 'Counseling', 'Old Mill Family Therapy', '29 Foundry Rd', 'Old Mill'],
  ['Kwame Asante', 'PhD', 'Clinical psychology', 'Asante & Rowe Psychology', '730 Sycamore St, Suite 4', 'Northgate'],
  ['Elena Petrova', 'PMHNP', 'Psychiatric nursing', 'Tamarack Wellness Group', '640 Tamarack Way', 'Fernhill'],
  ['Jonah Feldman', 'PsyD', 'Clinical psychology', 'Feldman Psychological', '15 Gristmill Ct', 'Old Mill'],
  ['Amara Nwosu', 'LCSW', 'Clinical social work', 'Eastbank Counseling Collective', '2203 Pruett St', 'Eastbank'],
  ['Thanh Nguyen', 'MD', 'Psychiatry', 'Saltmarsh Community Clinic', '9 Heron Ln', 'Saltmarsh'],
  ['Beatriz Camacho', 'LMFT', 'Marriage and family therapy', 'Camacho Couples & Family', '516 Larkspur Rd', 'Fernhill'],
  ['Walter Huang', 'DO', 'Psychiatry', 'Kestrel Behavioral Medicine', '905 Kestrel Ave', 'Northgate'],
  ['Yasmin Haddad', 'PsyD', 'Clinical psychology', 'Harborlight Behavioral Health', '75 Wharf Rd', 'Harbor'],
  ['Colm Donnelly', 'LPC', 'Addiction counseling', 'Second Tide Recovery', '88 Drydock Rd', 'Harbor'],
  ['Ruth Abernathy', 'PhD', 'Clinical psychology', 'Abernathy Psychology', '62 Quarry Rim Rd', 'Quarry Heights'],
  ['Santiago Morales', 'LCSW', 'Clinical social work', 'Bracken Avenue Counseling', '347 Bracken Ave', 'Fernhill'],
  ['Ingrid Halvorsen', 'MD', 'Psychiatry', 'Eastbank Mind & Mood Clinic', '1412 Varnum Blvd, Suite 210', 'Eastbank'],
  ['Deshawn Carter', 'LMFT', 'Marriage and family therapy', 'Carter Family Therapy', '210 Millrace St', 'Old Mill'],
  ['Anjali Deshpande', 'PsyD', 'Clinical psychology', 'Saltmarsh Psychology Partners', '33 Tidewater Ave', 'Saltmarsh'],
  ['Viktor Novak', 'PMHNP', 'Psychiatric nursing', 'Kestrel Behavioral Medicine', '905 Kestrel Ave', 'Northgate'],
  ['Folasade Adeyemi', 'LPC', 'Counseling', 'Overlook Counseling', '120 Overlook Dr', 'Quarry Heights'],
  ['Peter Lindgren', 'PhD', 'Clinical psychology', 'Lindgren Psychology', '8 Cannery Row', 'Harbor'],
  ['Carmen Ibarra', 'LCSW', 'Clinical social work', 'Pruett Street Counseling', '1980 Pruett St', 'Eastbank'],
  ['Samuel Osei', 'MD', 'Psychiatry', 'Fernhill Psychiatric Care', '415 Larkspur Rd, Suite B', 'Fernhill'],
  ['Natalia Wójcik', 'LMFT', 'Marriage and family therapy', 'Sycamore Family Practice', '702 Sycamore St', 'Northgate'],
  ['Benedict Ashworth', 'PsyD', 'Clinical psychology', 'Quarry Heights Psychology', '18 Overlook Dr, Suite 5', 'Quarry Heights'],
  ['Leilani Kahale', 'LPC', 'Counseling', 'Tidewater Counseling', '71 Tidewater Ave', 'Saltmarsh'],
  ['Mohammed Rahimi', 'MD', 'Psychiatry', 'Varnum Psychiatry', '1350 Varnum Blvd', 'Eastbank'],
  ['Charlotte Dubois', 'LCSW', 'Clinical social work', 'Gristmill Counseling', '41 Gristmill Ct', 'Old Mill'],
  ['Isaac Thornbury', 'PhD', 'Clinical psychology', 'Thornbury & Associates', '266 Sycamore St, Suite 9', 'Northgate'],
]

// outcome plan, by row number (1-based)
const PLAN_BY_ROW = {
  corrected: {
    3: 'accepting_no', 7: 'address', 10: 'phone', 12: 'accepting_no', 17: 'address_accepting', 19: 'accepting_no',
    23: 'phone', 26: 'accepting_yes', 29: 'address', 33: 'accepting_no', 38: 'address',
  },
  ghost: { 5: 'left', 14: 'retired', 16: 'not_in_network', 22: 'wrong_number', 25: 'retired', 30: 'left', 34: 'disconnected', 37: 'wrong_number_2' },
  review: { 9: 'evasive', 21: 'conflict', 32: 'manager' },
  retry: { 28: 'voicemail' },
}

const CONTACTS = ['Dana', 'Marisol', 'Trevor', 'Aisha', 'Bev', 'Kenji', 'Paula', 'Rob', 'Nadia', 'Glenn', 'Tasha', 'Lin']
const NEW_ADDR = {
  7: '2310 Pruett St, Suite 1', 17: '655 Tamarack Way, Suite 12', 29: '40 Tidewater Ave, Floor 2', 38: '1365 Varnum Blvd, Suite 400',
}

// ── call scripting ────────────────────────────────────────────────────────────
const dr = (p) => (['MD', 'DO', 'PhD', 'PsyD'].includes(p.credential) ? 'Dr. ' + p.provider.split(' ').slice(-1)[0] : p.provider)
const sayPhone = (ph) => ph.replace(/[()]/g, '').replace(/\s+/g, ' ')

function buildCall(script) {
  // script: array of [who, text, tool?] ; returns timed turns and duration
  let t = 0.8
  const turns = []
  for (const [who, text, tool, fixed] of script) {
    if (who === 'tool') {
      t += 0.25
      turns.push({ who, t0: r1(t), t1: r1(t + 0.1), text: tool.name, tool })
      t += 0.15
      continue
    }
    const words = text.split(/\s+/)
    const rate = who === 'agent' ? 0.3 : who === 'office' ? 0.33 : 0
    const dur = fixed ?? Math.max(0.9, words.length * rate)
    const t0 = t
    const turn = { who, t0: r1(t0), t1: r1(t0 + dur), text }
    turns.push(turn)
    t += dur + (who === 'agent' ? between(0.5, 0.9) : between(0.35, 0.7))
  }
  return { turns, duration: r1(t + 0.4) }
}

function scriptFor(p, kind, contact) {
  const D = dr(p)
  const she = pick(['they', 'they'])
  const greet = pick([
    `${p.practice}, this is ${contact}.`,
    `Thanks for calling ${p.practice}, ${contact} speaking.`,
    `${p.practice}, how can I help?`,
    `Good morning, ${p.practice}.`,
  ])
  const intro = `Hi, this is Rollcall, an automated assistant calling for ${PLAN} to check one directory listing. It takes under a minute. Is ${D} still seeing patients at your office?`
  const askAddr = `Thanks. We list the office at ${p.address}. Is that still right?`
  const askPhone = `And is ${sayPhone(p.phone)} the best number for patients to book?`
  const askAcc = `Is ${D} accepting new patients right now?`
  const askNet = `Last one. Does ${D} still take ${PLAN}?`
  const bye = pick([`That's everything. Thanks for your time.`, `That's all I needed. Thank you, have a good day.`, `All set. Thanks for the help.`])
  const T = (name, args) => ['tool', '', { name, args }]
  const ok = {
    practising: pick(['Yes, still here.', `Yep, ${she}'re here Monday through Thursday.`, 'Yes.', `Yes, ${D} is still with us.`]),
    address: pick(["Yes, that's us.", "That's correct.", 'Yep, same place.', "Right, that hasn't changed."]),
    phone: pick(["Yes, that's the front desk.", 'Yes.', "That's the one.", 'Yes, this line.']),
    accepting: pick(["Yes, there's about a three week wait.", 'Yes, we have openings.', 'Yes, taking new patients.', 'Yes, new patients are welcome.']),
    inNetwork: pick(["Yes, we're in network.", 'Yes, we take Cascadia.', 'We do, yes.', "Yes, that hasn't changed."]),
  }
  const confirmAll = (skip = {}) => {
    const out = []
    const add = (field, ask, answer) => {
      if (skip[field]) { out.push(...skip[field]); return }
      out.push(['agent', ask], ['office', answer], T('confirm_field', { field }))
    }
    add('address', askAddr, ok.address)
    add('phone', askPhone, ok.phone)
    add('accepting', askAcc, ok.accepting)
    add('inNetwork', askNet, ok.inNetwork)
    return out
  }
  const open = [['office', greet], ['agent', intro]]
  const present = [['office', ok.practising], T('confirm_field', { field: 'practising' })]

  switch (kind) {
    case 'confirmed':
      return { answeredBy: 'person', script: [...open, ...present, ...confirmAll(), ['agent', bye], T('end_call', { outcome: 'confirmed' })] }
    case 'confirmed_hold':
      return {
        answeredBy: 'person',
        script: [
          ['office', `${p.practice}, can you hold please?`], ['agent', 'Of course.'], ['system', 'On hold', null, between(14, 24)],
          ['office', `Thanks for holding, this is ${contact}.`], ['agent', intro], ...present, ...confirmAll(), ['agent', bye], T('end_call', { outcome: 'confirmed' }),
        ],
      }
    case 'accepting_no': {
      const a = pick([
        `No, ${D} isn't taking new patients right now. The waitlist is closed until January.`,
        `Not at the moment. ${D} is only seeing existing patients.`,
        `No, the panel is full. We're not adding anyone new this year.`,
        `No, we stopped taking new patients for ${D} back in the spring.`,
      ])
      return {
        answeredBy: 'person', changed: { accepting: ['No', a] },
        script: [...open, ...present, ...confirmAll({ accepting: [['agent', askAcc], ['office', a], T('correct_field', { field: 'accepting', value: 'No' })] }), ['agent', bye], T('end_call', { outcome: 'corrected' })],
      }
    }
    case 'accepting_yes': {
      const a = `Actually yes, ${D} opened up again last month. We can usually get someone in within two weeks.`
      return {
        answeredBy: 'person', changed: { accepting: ['Yes', a] },
        script: [...open, ...present, ...confirmAll({ accepting: [['agent', `We have ${D} listed as not accepting new patients. Is that still the case?`], ['office', a], T('correct_field', { field: 'accepting', value: 'Yes' })] }), ['agent', bye], T('end_call', { outcome: 'corrected' })],
      }
    }
    case 'address': {
      const na = NEW_ADDR[p.n]
      const a = `No, we moved in June. We're at ${na} now.`
      return {
        answeredBy: 'person', changed: { address: [na, a] },
        script: [...open, ...present, ...confirmAll({ address: [['agent', askAddr], ['office', a], ['agent', `Got it, ${na}. Thank you.`], T('correct_field', { field: 'address', value: na })] }), ['agent', bye], T('end_call', { outcome: 'corrected' })],
      }
    }
    case 'address_accepting': {
      const na = NEW_ADDR[p.n]
      const a1 = `That's the old building. We're at ${na}.`
      const a2 = `No, ${D} has a full caseload. Not taking anyone new.`
      return {
        answeredBy: 'person', changed: { address: [na, a1], accepting: ['No', a2] },
        script: [...open, ...present, ...confirmAll({
          address: [['agent', askAddr], ['office', a1], ['agent', `Thanks, I have ${na}.`], T('correct_field', { field: 'address', value: na })],
          accepting: [['agent', askAcc], ['office', a2], T('correct_field', { field: 'accepting', value: 'No' })],
        }), ['agent', bye], T('end_call', { outcome: 'corrected' })],
      }
    }
    case 'phone': {
      const np = p.phone.replace(/\d{4}$/, (m) => String(Number(m) + 50).padStart(4, '0'))
      const a = `This is the billing line. For appointments patients should call ${sayPhone(np)}.`
      return {
        answeredBy: 'person', changed: { phone: [np, a] },
        script: [...open, ...present, ...confirmAll({ phone: [['agent', askPhone], ['office', a], ['agent', `Thank you. I have ${sayPhone(np)} for booking.`], T('correct_field', { field: 'phone', value: np })] }), ['agent', bye], T('end_call', { outcome: 'corrected' })],
      }
    }
    case 'retired': {
      const a = pick([`${D} retired last spring. We've been telling the plans for months.`, `Oh, ${D} retired at the end of last year.`])
      return { answeredBy: 'person', reason: 'Provider retired', gone: a, script: [...open, ['office', a], T('flag_listing', { reason: 'provider_retired' }), ['agent', `Understood. I'll mark the listing for removal so patients stop calling. Thank you.`], T('end_call', { outcome: 'ghost' })] }
    }
    case 'left': {
      const a = pick([`${p.provider.split(' ')[0]} left the practice in March. I don't know where they went.`, `${D} hasn't been here for over a year.`])
      return { answeredBy: 'person', reason: 'Left the practice', gone: a, script: [...open, ['office', a], T('flag_listing', { reason: 'left_practice' }), ['agent', `Thanks for letting me know. I'll mark this listing for removal.`], T('end_call', { outcome: 'ghost' })] }
    }
    case 'not_in_network': {
      const a = `No, we dropped Cascadia two years ago. We're out of network for all their plans.`
      return {
        answeredBy: 'person', reason: "Doesn't take this plan", changed: { inNetwork: ['No', a] },
        script: [...open, ...present, ['agent', askNet], ['office', a], T('correct_field', { field: 'inNetwork', value: 'No' }), T('flag_listing', { reason: 'not_in_network' }), ['agent', `Understood. I'll mark the listing for removal from the Cascadia directory. Thank you.`], T('end_call', { outcome: 'ghost' })],
      }
    }
    case 'wrong_number':
    case 'wrong_number_2': {
      const biz = kind === 'wrong_number' ? "Tony's Pizza, pickup or delivery?" : 'Spin Cycle Laundry.'
      const a = kind === 'wrong_number' ? `No, this is a pizza place. You've got the wrong number.` : `A doctor? No. This is a laundromat, hon.`
      return {
        answeredBy: 'wrong_number', reason: 'Wrong number', gone: a,
        script: [['office', biz], ['agent', `Hi, this is Rollcall, an automated assistant calling for ${PLAN}. I'm trying to reach ${p.practice}. Is this the right number?`], ['office', a], T('flag_wrong_number', { dialed: p.phone }), ['agent', `Sorry to bother you. I'll make sure this number is taken off the listing.`], T('end_call', { outcome: 'ghost' })],
      }
    }
    case 'disconnected':
      return { answeredBy: 'intercept', reason: 'Number disconnected', script: [['system', "Three-tone intercept: “The number you have dialed is not in service.”", null, 5.5], T('flag_wrong_number', { dialed: p.phone, intercept: true }), T('end_call', { outcome: 'ghost' })] }
    case 'evasive': {
      const a = `Um, I think ${D} is still taking some patients? You'd really have to ask the doctor.`
      return {
        answeredBy: 'person', reason: 'Couldn’t confirm: accepting new patients', hedge: ['I think', 'some', "You'd really have to ask"], unconfirmed: { accepting: a },
        script: [...open, ...present, ...confirmAll({ accepting: [['agent', askAcc], ['office', a], ['agent', `No problem. I won't write that down as a yes. Someone from the plan will follow up.`], T('mark_unconfirmed', { field: 'accepting', reason: 'hedged_answer' })] }), ['agent', bye], T('end_call', { outcome: 'review' })],
      }
    }
    case 'conflict': {
      const a = `Yes, that's right. Well, the mail goes there. Patients are seen at the Larkspur annex now, I think it's 530?`
      return {
        answeredBy: 'person', reason: 'Two different answers about the address', hedge: ["Yes, that's right", 'I think it’s 530?'], unconfirmed: { address: a },
        script: [...open, ...present, ...confirmAll({ address: [['agent', askAddr], ['office', a], ['agent', `Thanks. I heard two addresses, so I'll leave this for a person to confirm.`], T('mark_unconfirmed', { field: 'address', reason: 'conflicting_answers' })] }), ['agent', bye], T('end_call', { outcome: 'review' })],
      }
    }
    case 'manager': {
      const a = `I'm just covering the desk today. You'd need the office manager, she's in Tuesday after two.`
      return {
        answeredBy: 'person', reason: 'Asked to call the office manager', hedge: ["I'm just covering", 'Tuesday after two'], unconfirmed: { practising: a },
        script: [['office', greet], ['agent', intro], ['office', a], T('schedule_callback', { when: 'Tue 14:00', ask_for: 'office manager' }), ['agent', `Understood. I'll call back Tuesday after two and ask for the office manager. Thank you.`], T('end_call', { outcome: 'review' })],
      }
    }
    case 'voicemail':
      return {
        answeredBy: 'voicemail', reason: 'Voicemail',
        script: [['system', `Voicemail greeting: “You've reached ${p.practice}. Our office is closed for lunch from twelve to one…”`, null, 9], T('schedule_callback', { when: 'Today 14:00', reason: 'voicemail' }), ['agent', `This is Rollcall calling for ${PLAN} about a directory listing. No reply needed. We'll try again this afternoon.`], T('end_call', { outcome: 'retry' })],
      }
  }
  throw new Error('unknown kind ' + kind)
}

// ── assemble ──────────────────────────────────────────────────────────────────
const kindOf = (n) => {
  for (const [outcome, rows] of Object.entries(PLAN_BY_ROW)) if (rows[n]) return [outcome, rows[n]]
  return ['confirmed', [4, 13, 27, 36].includes(n) ? 'confirmed_hold' : 'confirmed']
}
const STAMP = { confirmed: 'Confirmed', ghost: 'Remove', review: 'Needs a human', retry: 'Retry 2PM' }
const truths = []
const VOICES = ['alba', 'eve', 'george', 'jean', 'mary', 'michael', 'anna', 'charles', 'paul', 'vera']
const BRIEF = {
  confirmed: 'Everything the caller has on file is correct. Answer briefly and helpfully. You are busy.',
  confirmed_hold: 'Everything the caller has on file is correct. You are very busy: sound rushed, keep answers to a few words.',
  accepting_no: 'The provider is NOT accepting new patients; say so plainly and give a short reason. Everything else on file is correct.',
  accepting_yes: 'The provider IS accepting new patients again, since last month. Everything else on file is correct.',
  address: 'The office moved in June. Give the new address clearly when asked and say yes when it is read back. Everything else is correct.',
  address_accepting: 'The office moved; give the new address clearly. The provider is NOT accepting new patients. Everything else is correct.',
  phone: 'This line is billing. Patients should book on the new number; say it digit by digit and say yes when it is read back. Everything else is correct.',
  retired: 'The provider retired. Say so as soon as you are asked about them. You have told the insurance plans before and are a little tired of it.',
  left: 'The provider left this practice and you do not know where they went. Say so as soon as you are asked about them.',
  not_in_network: 'The provider is here, but the practice dropped this health plan two years ago and is out of network. Say so clearly when asked.',
  wrong_number: "You are NOT a medical office. You have never heard of the practice. Tell them they have the wrong number.",
  wrong_number_2: "You are NOT a medical office. You have never heard of the practice. Tell them they have the wrong number.",
  evasive: "You do not know whether the provider is accepting new patients. Hedge every time that question comes up: 'I think so?', 'you would have to ask the doctor'. Never give a clear yes or no to it, even if asked twice. Answer every other question clearly.",
  conflict: "When asked about the address, first say it is right, then add that patients are actually seen at the Larkspur annex, 'I think it is 530?'. Stay unsure if pressed. Answer every other question clearly.",
  manager: 'You are covering the desk today and cannot answer anything about the listing. Tell them to call back Tuesday after two and ask for the office manager.',
}

const listings = PROVIDERS.map(([provider, credential, specialty, practice, address, district], i) => {
  const n = i + 1
  const [x, y] = place(district)
  const phone = `(564) 555-01${String(n).padStart(2, '0')}`
  const base = { n, provider, credential, specialty, practice, address, district, phone }
  const [outcome, kind] = kindOf(n)
  const listedAccepting = kind === 'accepting_yes' ? 'No' : 'Yes'
  const listed = { practising: 'Yes', address, phone, accepting: listedAccepting, inNetwork: 'Yes' }
  const sc = scriptFor(base, kind, pick(CONTACTS))
  const { turns, duration } = buildCall(sc.script)

  // field results from the tool turns
  const fields = Object.fromEntries(['practising', 'address', 'phone', 'accepting', 'inNetwork'].map((f) => [f, { status: 'not_asked' }]))
  turns.forEach((turn, idx) => {
    if (turn.who !== 'tool') return
    const f = turn.tool.args.field
    if (!f) return
    // the answer is the last office turn before this tool call
    const ans = [...turns.slice(0, idx)].reverse().find((t) => t.who === 'office')
    const status = turn.tool.name === 'confirm_field' ? 'confirmed' : turn.tool.name === 'correct_field' ? 'corrected' : 'unconfirmed'
    fields[f] = { status, at: turn.t0, quote: ans?.text, clip: ans ? [ans.t0, ans.t1] : undefined, ...(status === 'corrected' ? { value: String(turn.tool.args.value) } : {}) }
  })
  if (sc.gone) {
    const ans = turns.find((t) => t.who === 'office' && t.text === sc.gone)
    fields.practising = { status: 'corrected', value: 'No', at: r1(ans.t1 + 0.3), quote: ans.text, clip: [ans.t0, ans.t1] }
  }
  if (kind === 'manager') {
    const ans = turns.filter((t) => t.who === 'office')[1]
    fields.practising = { status: 'unconfirmed', at: r1(ans.t1 + 0.3), quote: ans.text, clip: [ans.t0, ans.t1] }
  }
  const nCorrected = Object.values(fields).filter((f) => f.status === 'corrected').length
  const stamp = outcome === 'corrected' ? `Corrected ·${nCorrected}` : STAMP[outcome]

  const truth = { ...listed }
  for (const [f, r] of Object.entries(fields)) if (r.status === 'corrected' && r.value) truth[f] = r.value
  const firstLine = turns.find((t) => t.who === 'office' || t.who === 'system')?.text ?? ''
  truths.push({
    id: `L-${String(n).padStart(3, '0')}`, kind, outcome, answeredBy: sc.answeredBy, truth,
    expect: Object.fromEntries(Object.entries(fields).map(([f, r]) => [f, r.status])),
    voice: VOICES[n % VOICES.length],
    greeting: sc.answeredBy === 'intercept' ? 'The number you have dialed is not in service. Please check the number and try again.' : sc.answeredBy === 'voicemail' ? `You've reached ${practice}. Our office is closed for lunch from twelve to one. Please leave a message after the tone.` : firstLine,
    muteAfterGreeting: sc.answeredBy === 'intercept' || sc.answeredBy === 'voicemail',
    brief: BRIEF[kind] ?? '',
  })

  return {
    id: `L-${String(n).padStart(3, '0')}`, ...base, grid: gridRef(x, y), x, y, listed,
    lastVerifiedDays: Math.round(between(372, 540)),
    result: { outcome, ...(sc.reason ? { reason: sc.reason } : {}), ...(sc.hedge ? { hedge: sc.hedge } : {}), stamp, fields },
    call: { line: 0, startAt: 0, duration, answeredBy: sc.answeredBy, turns },
  }
})

// six-line schedule
const LINES = 6
const free = Array(LINES).fill(1.5)
for (const l of listings) {
  let line = 0
  for (let i = 1; i < LINES; i++) if (free[i] < free[line]) line = i
  l.call.line = line + 1
  l.call.startAt = r1(free[line])
  free[line] = l.call.startAt + 3 /* dialing */ + l.call.duration + 7 /* outcome flash at 8x */
}
// the call clock starts when the office picks up, 3s after dialing begins
const sweepDuration = r1(Math.max(...free))

// the visitor's own call (row 41)
const [yx, yy] = place('Fernhill')
const your = {
  id: 'L-041', n: 41, provider: 'Salome Reyes', credential: 'LMFT', specialty: 'Marriage and family therapy', practice: 'Juniper Row Counseling',
  address: '88 Juniper Row, Suite 3', district: 'Fernhill', grid: gridRef(yx, yy), x: yx, y: yy, phone: '(564) 555-0141',
  listed: { practising: 'Yes', address: '88 Juniper Row, Suite 3', phone: '(564) 555-0141', accepting: 'Yes', inNetwork: 'Yes' },
  lastVerifiedDays: 431, yours: true,
}
const T = (name, args) => ['tool', '', { name, args }]
const sample = buildCall([
  ['office', 'Juniper Row Counseling.'],
  ['agent', `Hi, this is Rollcall, an automated assistant calling for ${PLAN} to check one directory listing. It takes under a minute. Is Salome Reyes still seeing patients at your office?`],
  ['office', 'Sorry, who is this again?'],
  ['agent', `No problem. I'm an automated assistant for ${PLAN}. I'm only checking that your directory listing is right. Is Salome Reyes still at your office?`],
  ['office', "Oh, okay. Yes, she's here."], T('confirm_field', { field: 'practising' }),
  ['agent', 'Thanks. We list the office at 88 Juniper Row, Suite 3. Is that still right?'],
  ['office', 'Yep.'], T('confirm_field', { field: 'address' }),
  ['agent', 'And is 564 555-0141 the best number for patients to book?'],
  ['office', "That's this line, yes."], T('confirm_field', { field: 'phone' }),
  ['agent', 'Is she accepting new patients right now?'],
  ['office', "No, not until spring. She's completely full."], T('correct_field', { field: 'accepting', value: 'No' }),
  ['agent', `Got it, not accepting until spring. Last one. Does she still take ${PLAN}?`],
  ['office', 'Yes, still in network.'], T('confirm_field', { field: 'inNetwork' }),
  ['agent', "That's everything. Thanks for your time."], T('end_call', { outcome: 'corrected' }),
])
const sampleFields = Object.fromEntries(['practising', 'address', 'phone', 'accepting', 'inNetwork'].map((f) => [f, { status: 'not_asked' }]))
sample.turns.forEach((turn, idx) => {
  if (turn.who !== 'tool' || !turn.tool.args.field) return
  const ans = [...sample.turns.slice(0, idx)].reverse().find((t) => t.who === 'office')
  const status = turn.tool.name === 'confirm_field' ? 'confirmed' : 'corrected'
  sampleFields[turn.tool.args.field] = { status, at: turn.t0, quote: ans.text, clip: [ans.t0, ans.t1], ...(status === 'corrected' ? { value: String(turn.tool.args.value) } : {}) }
})

const seed = {
  meta: { plan: PLAN, network: 'Behavioral health', county: 'Marlow County', sweepDate: '2026-09-21', lines: LINES, speed: 8, pricePerMinute: 0.075, sweepDuration, simulated: true },
  listings,
  yourCall: { listing: your, sample: { duration: sample.duration, answeredBy: 'person', turns: sample.turns, result: { outcome: 'corrected', stamp: 'Corrected ·1', fields: sampleFields } } },
}

mkdirSync(join(root, 'seed'), { recursive: true })
writeFileSync(join(root, 'seed/demo.json'), JSON.stringify(seed))
writeFileSync(join(root, 'seed/truth.json'), JSON.stringify(truths, null, 1))
const counts = listings.reduce((a, l) => ((a[l.result.outcome] = (a[l.result.outcome] || 0) + 1), a), {})
console.log('listings', listings.length, counts, 'sweep', sweepDuration + 's', 'avg call', r1(listings.reduce((a, l) => a + l.call.duration, 0) / listings.length) + 's')
