import { existsSync, readFileSync } from 'node:fs'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Lockup } from '@/components/brand/Logo'
import { clock, money } from '@/lib/format'
import { LISTINGS, META } from '@/lib/seed'
import { sweepStats } from '@/lib/sweep-engine'

export const metadata: Metadata = { title: 'About' }

const STEPS: [string, string][] = [
  ['Listing', 'One row of the directory: provider, office, phone, two yes/no facts.'],
  ['Key terms', 'The row’s own names and street become the recognizer’s key terms for that call.'],
  ['Call', 'AssemblyAI’s Voice Agent API holds the conversation: speech in, speech out, turn-taking, barge-in.'],
  ['Tool calls', 'Each clear answer is one JSON-schema tool call: confirm, correct, flag, or refuse to write.'],
  ['Cell + clip', 'The value lands in the register with the audio span it came from.'],
  ['Person', 'Hedged or conflicting answers go to a human. The agent never guesses.'],
]

export default function About() {
  const s = sweepStats(LISTINGS, META.pricePerMinute)
  // written by `npm run eval` once the sweep has been recorded and scored against the truth sheets
  const scored = existsSync('seed/eval.json') ? (JSON.parse(readFileSync('seed/eval.json', 'utf8')) as { calls: number; fieldsWritten: number; fieldsRight: number; falseWrites: number; gateRefusals: number }) : null
  return (
    <main className="mx-auto max-w-[720px] px-5 py-10 sm:py-16">
      <Link href="/" aria-label="Rollcall console"><Lockup size={20} /></Link>
      <h1 className="t-display mt-8 text-[clamp(2rem,1.4rem+3vw,3.25rem)]">Your insurer’s doctor list is wrong. By law, someone has to phone every office to fix it.</h1>
      <p className="mt-5 text-[17px] text-ink-muted">Rollcall makes those calls. It phones every listing, asks five questions, corrects the directory, and keeps the receptionist’s own words behind every change.</p>
      <p className="mt-6"><Link href="/" className="inline-flex h-10 items-center rounded-md bg-accent px-4 font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover">Open the console</Link></p>

      <h2 className="t-display mt-14 text-[24px]">The problem</h2>
      <p className="mt-3">US Senate Finance Committee staff called 120 mental-health listings across 12 Medicare Advantage plans. A third were wrong numbers, inaccurate or never answered, and they could book an appointment <strong>18% of the time</strong>. Patients call the list, hear “he retired” or “we don’t take that plan,” and give up.</p>
      <p className="mt-3 text-[13px] text-ink-muted">Source: <a className="text-accent underline underline-offset-2" href="https://www.finance.senate.gov/chairmans-news/wyden-calls-for-action-to-get-rid-of-ghost-networks-releases-secret-shopper-study">Senate Finance Committee secret-shopper study, May 2023</a>.</p>

      <h2 className="t-display mt-12 text-[24px]">The 90-day rule</h2>
      <p className="mt-3">The No Surprises Act already requires plans to verify directory data every 90 days. The REAL Health Providers Act makes that verification proactive for every record from plan year 2028, and CMS requires states to run annual secret-shopper surveys of Medicaid managed-care directories from July 2028. Today that work is a call centre asking the same five questions.</p>

      <h2 className="t-display mt-12 text-[24px]">How one call works</h2>
      <ol className="mt-4 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="bg-surface-1 p-4">
            <span className="t-mono text-ink-muted">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-1 font-semibold">{title}</h3>
            <p className="mt-1 text-[13px] text-ink-muted">{body}</p>
          </li>
        ))}
      </ol>

      <h2 className="t-display mt-12 text-[24px]">What is measured, and what isn’t yet</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>The sweep on the console is {LISTINGS.length} calls on {META.lines} lines: {clock(META.sweepDuration)} of wall time, {clock(s.avgCall)} per call, <strong>{money(s.costPerListing)} per listing</strong> at AssemblyAI’s ${META.pricePerMinute}/min Voice Agent rate. Those numbers are computed from the calls themselves.</li>
        <li>Every office is simulated. No real clinic was called, and every phone number is in the 555-01xx range reserved for fiction.</li>
        {scored ? (
          <li>Scored against the offices’ hidden truth sheets over {scored.calls} recorded calls: <strong>{scored.fieldsRight} of {scored.fieldsWritten} written fields correct, {scored.falseWrites} false writes</strong>. The write gate refused {scored.gateRefusals} tool calls the model wanted to make. Reproduce it with <code className="t-mono">npm run eval</code>.</li>
        ) : (
          <li>Field-level accuracy against the offices’ hidden truth sheets is published here once the recorded sweep has been scored. Until then there is no accuracy number, on purpose.</li>
        )}
        <li>A value reaches the directory only through a write gate in code: the office must have said it, numbers must have been heard, and a hedge (“I think so”) is refused and sent to a person. <code className="t-mono">npm run verify</code> checks this with no credentials.</li>
      </ul>
      <p className="mt-12 border-t border-line pt-4 text-[13px] text-ink-muted">Built for the AssemblyAI Voice Agent Hackathon on lablab.ai, September 2026. MIT licensed.</p>
    </main>
  )
}
