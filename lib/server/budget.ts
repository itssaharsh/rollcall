// Live calls cost real minutes, so the public demo is rate-limited twice: per visitor and per day.
// In-memory counters reset when a serverless instance recycles. That is acceptable here because the hard
// stops are elsewhere: tokens cap every session at 120s, and the account runs on prepaid credits.
const DAY = 24 * 60 * 60 * 1000
const perDay = Number(process.env.DAILY_CALL_BUDGET ?? 80)
const perVisitor = Number(process.env.VISITOR_CALL_BUDGET ?? 6)
let day = { start: Date.now(), calls: 0 }
const visitors = new Map<string, { start: number; calls: number }>()

export function budgetLeft(ip: string) {
  const now = Date.now()
  if (now - day.start > DAY) day = { start: now, calls: 0 }
  const v = visitors.get(ip)
  if (!v || now - v.start > DAY) visitors.set(ip, { start: now, calls: 0 })
  return { day: perDay - day.calls, visitor: perVisitor - visitors.get(ip)!.calls }
}

export function spend(ip: string) { day.calls++; visitors.get(ip)!.calls++ }
export const hasKey = () => Boolean(process.env.ASSEMBLYAI_API_KEY)
