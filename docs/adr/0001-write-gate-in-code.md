# 1. The write gate is code, not prompt

**Decision.** Every tool call passes through `lib/agent/gate.ts` before anything is written. Numbers in a new address or phone must appear in what the recognizer heard from the office; hedged answers are refused; a second refusal sends the field to a person. Outcomes are derived in `lib/agent/outcome.ts`.

**Why.** A false "confirmed" is worse than a missed call: it keeps a ghost listing alive with a fresh date on it. A prompt can ask the model not to guess; only code can make it impossible. Refusals return as `tool.result` errors that name what failed and what to ask next, which is the recovery pattern AssemblyAI's tool docs recommend.

**Cost.** The hedge list is small and English-only. A blunt answer with "might" in it is refused and re-asked once.
