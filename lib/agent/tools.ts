// The caller agent's tools, as the JSON-schema function tools the Voice Agent API expects in `session.tools`.
// AssemblyAI does not validate `parameters` at session.update time, so tests/tools.test.ts does.
import type { FieldKey } from '../types'

export const FIELDS: FieldKey[] = ['practising', 'address', 'phone', 'accepting', 'inNetwork']
export const GHOST_REASONS = ['provider_retired', 'left_practice', 'not_in_network', 'provider_deceased', 'practice_closed'] as const
export type GhostReason = (typeof GHOST_REASONS)[number]

const field = { type: 'string', enum: FIELDS, description: "Which listing field the office just answered about. 'practising' = the provider still sees patients at this office." }

export interface FunctionTool { type: 'function'; name: string; description: string; parameters: { type: 'object'; properties: Record<string, unknown>; required: string[] }; execution_mode?: 'interactive' | 'hold' }

const RAW: FunctionTool[] = [
  {
    type: 'function', name: 'confirm_fields',
    description: 'Record that the office clearly confirmed one or more listed values are still correct. Call it right after a clear yes, with every field that answer covered. Never call it for a hedged answer such as "I think so".',
    parameters: { type: 'object', properties: { fields: { type: 'array', items: { type: 'string', enum: FIELDS }, minItems: 1, description: "Every field the answer confirmed, e.g. ['address','phone'] for a yes to both." } }, required: ['fields'] },
  },
  {
    type: 'function', name: 'correct_field',
    description: 'Record a new value the office clearly stated. For address and phone, read the new value back to the office first and call this only after they agree.',
    parameters: {
      type: 'object',
      properties: { field, value: { type: 'string', description: "The new value exactly as the office said it. Yes or No for practising, accepting and inNetwork. A street address (e.g. '2310 Pruett St, Suite 1') or a phone number (e.g. '(564) 555-0160') otherwise." } },
      required: ['field', 'value'],
    },
  },
  {
    type: 'function', name: 'mark_unconfirmed',
    description: 'Use when the answer was hedged, contradictory, or the person said they do not know. The field goes to a human reviewer. Prefer this over guessing.',
    parameters: { type: 'object', properties: { field, reason: { type: 'string', enum: ['hedged_answer', 'conflicting_answers', 'does_not_know', 'refused'], description: 'Why the answer could not be written down.' } }, required: ['field', 'reason'] },
  },
  {
    type: 'function', name: 'flag_listing',
    description: 'Use when the provider should not be in the directory at all: retired, left this practice, the practice closed, or the office does not take the plan.',
    parameters: { type: 'object', properties: { reason: { type: 'string', enum: [...GHOST_REASONS], description: 'Why the listing should be removed.' } }, required: ['reason'] },
  },
  {
    type: 'function', name: 'flag_wrong_number',
    description: 'Use when the number reaches a different business or person, or is not in service.',
    parameters: { type: 'object', properties: { reached: { type: 'string', description: "Who answered, in their words (e.g. 'a pizza place')." } }, required: [] },
  },
  {
    type: 'function', name: 'schedule_callback',
    description: 'Use for voicemail, a closed office, or when asked to call back for a specific person. Never leave provider details on voicemail.',
    parameters: { type: 'object', properties: { when: { type: 'string', description: "When to call back, as the office said it (e.g. 'Tuesday after two'). Use 'later today' for voicemail." }, ask_for: { type: 'string', description: 'Who to ask for, if they named someone.' } }, required: ['when'] },
  },
  {
    type: 'function', name: 'end_call',
    description: 'Call this after saying goodbye, once every question has an answer, a flag, or a callback. It hangs up.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
]

export type CallMode = 'live' | 'recorded'

/**
 * Measured on 2026-09-22: a tool call costs a second model pass, 2 to 3 seconds before the next question is audible.
 * - recorded: `hold`. The call is silent and its result auto-fires the next reply, about a second faster per answer.
 * - live: `interactive`. The agent says "Got it." in the same turn as the tool call, so a person never hears dead air.
 */
export const toolsFor = (mode: CallMode): FunctionTool[] => RAW.map((t) => ({ ...t, execution_mode: mode === 'recorded' ? ('hold' as const) : ('interactive' as const) }))
export const TOOLS = toolsFor('recorded')
