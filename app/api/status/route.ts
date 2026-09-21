import { NextResponse, type NextRequest } from 'next/server'
import { budgetLeft, hasKey } from '@/lib/server/budget'

export const dynamic = 'force-dynamic'

/** Tells the call sheet whether the live line is open, without spending anything. */
export function GET(req: NextRequest) {
  if (!hasKey()) return NextResponse.json({ live: false, reason: 'unavailable' })
  const left = budgetLeft(req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local')
  return NextResponse.json(left.day > 0 && left.visitor > 0 ? { live: true } : { live: false, reason: 'quota' })
}
