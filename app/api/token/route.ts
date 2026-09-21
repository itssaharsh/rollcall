import { NextResponse, type NextRequest } from 'next/server'
import { budgetLeft, hasKey, spend } from '@/lib/server/budget'

export const dynamic = 'force-dynamic'
/** server-side cap on one visitor call; the UI asks the agent to finish at 125s and wraps up at 150s */
const MAX_SESSION_SECONDS = 180

/** Mints a single-use Voice Agent token. The API key never leaves the server. */
export async function POST(req: NextRequest) {
  if (!hasKey()) return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
  const left = budgetLeft(ip)
  if (left.day <= 0 || left.visitor <= 0) return NextResponse.json({ error: 'quota' }, { status: 429 })

  const url = new URL('https://agents.assemblyai.com/v1/token')
  url.searchParams.set('expires_in_seconds', '60')
  url.searchParams.set('max_session_duration_seconds', String(MAX_SESSION_SECONDS))
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.ASSEMBLYAI_API_KEY}` }, cache: 'no-store' })
  if (!res.ok) return NextResponse.json({ error: res.status === 401 || res.status === 403 ? 'unavailable' : 'dropped', detail: await res.text() }, { status: 502 })
  const { token } = (await res.json()) as { token: string }
  spend(ip)
  return NextResponse.json({ token })
}
