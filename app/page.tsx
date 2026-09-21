import Image from 'next/image'
import Link from 'next/link'
import { Lockup } from '@/components/brand/Logo'
import { Clips, LegacyRedirect } from '@/components/landing/Clips'
import { LiveEmbed } from '@/components/landing/LiveEmbed'
import { NoticeStrip } from '@/components/console/TopBar'
import { LISTINGS } from '@/lib/seed'
import scored from '@/seed/eval.json'

const primary = 'inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 text-[15px] font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover active:bg-accent-press'
const secondary = 'inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface-1 px-5 text-[15px] font-semibold transition-colors duration-150 hover:bg-surface-2'

const FIGURES: [string, string, string, string?][] = [
  ['18%', 'of listed mental-health providers could actually be booked when US Senate staff called 120 of them.', 'Senate Finance Committee, 2023', 'https://www.finance.senate.gov/chairmans-news/wyden-calls-for-action-to-get-rid-of-ghost-networks-releases-secret-shopper-study'],
  ['90 days', 'is how often the law says a health plan must re-check every listing. Today that is a room of people making the same phone call.', 'No Surprises Act'],
  [`$${scored.costPerListing.toFixed(2)}`, 'is what one recorded verification call cost here. Vendors put the manual call at “several dollars”.', 'computed from the 40 calls on the console'],
]
const STEPS: [string, string, string, string][] = [
  ['/shot-console.png', 'One click, forty calls', 'Six lines dial every office on the list. Cells fill in, pins drop, and a tally counts what was right, what changed, and who should not be listed at all.', 'The console after a sweep'],
  ['/shot-drawer.png', 'Click any cell, hear the proof', 'Each answer is one tool call with the office’s own words attached. A write gate in code, not in the prompt, decides what reaches the directory.', 'A listing with two corrections and its transcript'],
  ['/shot-call.png', 'Then it calls you', 'Play the front desk in your browser. Be vague, change the suite number, interrupt it. What you say becomes row 41.', 'The call sheet during a live call'],
]

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <LegacyRedirect />
      <header className="sticky top-0 z-30 flex h-14 items-center gap-6 border-b border-line bg-surface-1 px-4 sm:px-8">
        <Lockup size={20} />
        <nav className="ml-auto flex items-center gap-1 text-[14px] font-medium text-ink-muted">
          <a href="#how" className="hidden rounded-sm px-3 py-2 hover:text-ink sm:block">How it works</a>
          <a href="#scored" className="hidden rounded-sm px-3 py-2 hover:text-ink sm:block">The numbers</a>
          <a href="https://github.com/itssaharsh/rollcall" className="hidden rounded-sm px-3 py-2 hover:text-ink sm:block">GitHub</a>
          <Link href="/console" className="ml-2 inline-flex h-9 items-center rounded-md bg-ink px-4 font-semibold text-canvas transition-colors duration-150 hover:bg-accent">Open the console</Link>
        </nav>
      </header>
      <NoticeStrip />

      <main>
        <section className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[5fr_7fr] lg:py-20">
          <div>
            <h1 className="t-display text-[clamp(2.75rem,1.6rem+4.4vw,5.25rem)] leading-[1.0]">It phones every doctor’s office on the list.</h1>
            <p className="mt-6 max-w-[46ch] text-[18px] leading-relaxed text-ink-muted">Ever picked a doctor from your insurer’s website, called, and heard “he retired” or “we don’t take that plan”? Insurers have to re-check every listing every 90 days. Rollcall makes those calls, fixes the list, and keeps the receptionist’s own words behind every change.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/console" className={primary}>Watch it make 40 calls</Link><Link href="/console?call=1" className={secondary}>Be the front desk</Link></div>
            <p className="t-label mt-5 text-ink-muted">No signup · built on the AssemblyAI Voice Agent API</p>
          </div>
          <LiveEmbed />
        </section>

        <section aria-label="The problem in three numbers" className="border-y border-line bg-surface-1">
          <dl className="mx-auto grid max-w-[1400px] divide-y divide-line px-4 sm:px-8 lg:grid-cols-[1.15fr_1fr_1fr] lg:divide-x lg:divide-y-0">
            {FIGURES.map(([n, body, source, href], i) => (
              <div key={n} className={`py-8 lg:py-12 ${i ? 'lg:pl-10' : ''} ${i < 2 ? 'lg:pr-10' : ''}`}>
                <dt className="t-display tnum text-[clamp(3.25rem,2rem+4vw,5.5rem)] leading-none">{n}</dt>
                <dd className="mt-4 max-w-[38ch] text-[16px]">{body}<span className="t-label mt-3 block text-ink-muted">{href ? <a className="underline underline-offset-2 hover:text-ink" href={href}>{source}</a> : source}</span></dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-8 lg:py-20">
          <h2 className="t-display max-w-[18ch] text-[clamp(2rem,1.3rem+2.6vw,3.5rem)]">Two phone calls, exactly as they happened.</h2>
          <p className="mt-4 max-w-[60ch] text-[17px] text-ink-muted">These are recordings from the sweep on the console. Press play.</p>
          <div className="mt-8"><Clips /></div>
        </section>

        <section id="how" className="border-t border-line bg-surface-1">
          <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-8 lg:py-20">
            <h2 className="t-display text-[clamp(2rem,1.3rem+2.6vw,3.5rem)]">How it works</h2>
            <ol className="mt-10 flex flex-col gap-14">
              {STEPS.map(([src, title, body, alt], i) => (
                <li key={title} className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 ? 'lg:[&>div:first-child]:order-2' : ''}`}>
                  <div><span className="t-mono text-ink-muted">{String(i + 1).padStart(2, '0')}</span><h3 className="t-display mt-2 text-[30px]">{title}</h3><p className="mt-3 max-w-[48ch] text-[17px] text-ink-muted">{body}</p></div>
                  <Image src={src} alt={alt} width={1440} height={900} loading="eager" className="w-full rounded-lg border border-line-strong" sizes="(min-width: 1024px) 640px, 100vw" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="scored" className="mx-auto max-w-[1400px] px-4 py-14 sm:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className="t-display text-[clamp(2rem,1.3rem+2.6vw,3.5rem)]">Scored, not claimed.</h2>
              <p className="mt-4 max-w-[52ch] text-[17px] text-ink-muted">Every simulated office has a hidden truth sheet. After the sweep, every value the agent wrote is compared with it. Three of the forty calls were re-recorded after the bug they exposed was fixed in code; the other thirty-seven are first takes.</p>
              <p className="mt-4 text-[15px]"><a className="font-semibold text-accent underline underline-offset-2" href="https://github.com/itssaharsh/rollcall">Read the code and the recordings on GitHub</a> · <Link className="font-semibold text-accent underline underline-offset-2" href="/about">the longer version</Link></p>
            </div>
            <div>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
                {[[`${scored.outcomesRight}/${scored.calls}`, 'calls ended with the right outcome'], [`${scored.fieldsRight}/${scored.fieldsWritten}`, 'written fields match the truth'], [String(scored.falseWrites), 'false writes'], [String(scored.gateRefusals), 'writes the gate refused']].map(([n, l]) => (
                  <div key={l} className="bg-surface-1 p-5"><dt className="t-display tnum text-[44px] leading-none">{n}</dt><dd className="t-label mt-2 text-ink-muted">{l}</dd></div>
                ))}
              </dl>
              <div className="mt-3 grid grid-cols-[repeat(40,minmax(0,1fr))] gap-[3px]" aria-hidden>{LISTINGS.map((l) => <span key={l.id} data-outcome={l.result.outcome} className="h-3 rounded-[1px] bg-[var(--oc)]" />)}</div>
            </div>
          </div>
        </section>

        <section className="bg-ink text-canvas">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-8">
            <h2 className="t-display max-w-[16ch] text-[clamp(2rem,1.3rem+2.6vw,3.5rem)]">Now you be the front desk.</h2>
            <Link href="/console?call=1" className="inline-flex h-12 items-center rounded-md bg-canvas px-6 text-[16px] font-semibold text-ink transition-colors duration-150 hover:bg-lamp-ringing">Answer a call</Link>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-ink-muted sm:px-8">
        <span>Every office, provider and phone number here is simulated. No real clinic was called.</span>
        <span>Built for the AssemblyAI Voice Agent Hackathon · MIT · <Link href="/about" className="underline underline-offset-2">About</Link></span>
      </footer>
    </div>
  )
}
