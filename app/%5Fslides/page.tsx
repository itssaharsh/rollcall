import type { Metadata } from 'next'
import { Mark } from '@/components/brand/Logo'
import { LISTINGS, META } from '@/lib/seed'
import scored from '@/seed/eval.json'

// Source for docs/submission/slides.pdf and cover.png: `npm run kit` prints this page. One idea per slide, ten words or fewer.
export const metadata: Metadata = { robots: { index: false } }
const Slide = ({ children, n, dark }: { children: React.ReactNode; n: number; dark?: boolean }) => (
  <section className={`relative flex h-[1080px] w-[1920px] flex-col justify-center overflow-hidden p-[120px] [break-after:page] ${dark ? 'bg-ink text-canvas' : 'bg-canvas text-ink'}`} id={`s${n}`}>
    {children}
    <span className="t-label absolute bottom-[56px] left-[120px] flex items-center gap-3 text-[16px] opacity-60"><Mark size={28} /> Rollcall · {n}</span>
  </section>
)
const H = ({ children }: { children: React.ReactNode }) => <h2 className="t-display max-w-[20ch] text-[120px] leading-[1.02]">{children}</h2>
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-10 max-w-[44ch] text-[40px] leading-snug opacity-80">{children}</p>

export default function Slides() {
  return (
    <main className="w-[1920px]">
      <Slide n={1}>
        <div className="grid grid-cols-[1fr_900px] items-center gap-[80px]">
          <div><div className="mb-10 flex items-center gap-5"><Mark size={84} /><span className="t-display text-[72px]">Rollcall</span></div>
            <h1 className="t-display text-[104px] leading-[1.02]">It phones every doctor’s office on the list.</h1>
            <p className="mt-8 text-[36px] text-ink-muted">Then fixes the list, and keeps the clip behind every change.</p>
            <p className="t-label mt-12 text-[18px] text-ink-muted">Built on the AssemblyAI Voice Agent API</p></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/shot-console.png" alt="" className="w-[900px] rounded-lg border border-line shadow-float" />
        </div>
      </Slide>
      <Slide n={2} dark><H>Call ten listed therapists. Eight are ghosts.</H><P>Senate Finance staff called 120 listings and booked 18%.</P></Slide>
      <Slide n={3}><H>The law says re-check every 90 days.</H><P>Today that is a call centre asking five questions.</P></Slide>
      <Slide n={4}><H>One click. Forty calls. The register fills itself.</H>
        <div className="mt-12 grid max-w-[1500px] grid-cols-[repeat(40,minmax(0,1fr))] gap-[8px]">{LISTINGS.map((l) => <span key={l.id} data-outcome={l.result.outcome} className="h-[44px] rounded-[2px] bg-[var(--oc)]" />)}</div></Slide>
      <Slide n={5}>
        <div className="grid grid-cols-[1fr_760px] items-center gap-[80px]"><div><H>Every change has a clip.</H><P>Click a struck-through cell. Hear the receptionist say it.</P></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/shot-drawer.png" alt="" className="h-[760px] w-[760px] rounded-lg border border-line object-cover object-right-top shadow-float" /></div>
      </Slide>
      <Slide n={6} dark><H>It refuses to guess.</H><P>“I think so?” is not written down. A gate in code decides, not the prompt.</P></Slide>
      <Slide n={7}><H>{scored.fieldsRight} of {scored.fieldsWritten} fields right. {scored.falseWrites} false writes.</H><P>{scored.calls} recorded calls scored against hidden truth sheets. The gate refused {scored.gateRefusals} writes. About ${scored.costPerListing.toFixed(2)} per listing.</P></Slide>
      <Slide n={8}><H>How it uses AssemblyAI</H>
        <ul className="mt-10 grid max-w-[1500px] grid-cols-2 gap-x-16 gap-y-6 text-[34px] leading-snug">
          {['Voice Agent API on both ends of every call', 'Key terms built from the row being verified', 'Seven JSON-schema tools, one write per clear answer', 'Refusals return as tool errors the agent follows', 'Temporary tokens: the key never reaches the browser', 'Audio sent only around speech, for steady turn-taking'].map((x) => <li key={x} className="border-t-2 border-ink pt-4">{x}</li>)}
        </ul></Slide>
      <Slide n={9}><H>Who pays, and for what</H>
        <ul className="mt-10 grid max-w-[1560px] grid-cols-2 gap-x-16 gap-y-6 text-[32px] leading-snug">
          {['Buyer: the provider-data team at a US health plan. The work is mandated every 90 days.', 'Practices already spend $2.76B a year answering directory requests (CAQH survey, 2019).', 'A manual verification call costs “several dollars” (vendor benchmark). Ours cost $0.08 in API time.', 'Price per verified listing, with the audio evidence included. Our assumption: well under half the manual cost.', 'From 2028 Medicare Advantage plans must re-verify and publish accuracy scores; states must run secret-shopper calls.', 'Same engine, next markets: any fact that only a phone call can answer.'].map((x) => <li key={x} className="border-t-2 border-ink pt-4">{x}</li>)}
        </ul></Slide>
      <Slide n={10} dark><H>What exists, and what is different</H>
        <ul className="mt-10 grid max-w-[1560px] grid-cols-3 gap-x-12 text-[30px] leading-snug">
          <li className="border-t-2 border-canvas pt-4"><b>Call centres.</b> Today’s default. Slow, several dollars a call, no evidence kept.</li>
          <li className="border-t-2 border-canvas pt-4"><b>Enterprise vendors.</b> Voice outreach sold to large plans. Validates the buyer. Closed, no public proof.</li>
          <li className="border-t-2 border-canvas pt-4"><b>Rollcall.</b> Every written value carries its audio. A gate in code refuses guesses. Scored in public against truth sheets.</li>
        </ul></Slide>
      <Slide n={11}><H>What comes next</H>
        <ol className="mt-10 grid max-w-[1560px] grid-cols-3 gap-x-12 text-[30px] leading-snug">
          <li className="border-t-2 border-ink pt-4"><span className="t-label text-[18px] text-ink-muted">Next</span><br />Real phone lines over SIP. Phone menus, hold queues, voicemail.</li>
          <li className="border-t-2 border-ink pt-4"><span className="t-label text-[18px] text-ink-muted">Then</span><br />A pilot sweep with one plan’s real directory, offices told in advance.</li>
          <li className="border-t-2 border-ink pt-4"><span className="t-label text-[18px] text-ink-muted">Later</span><br />The 2028 audits: accuracy reports a plan can file, with evidence per listing.</li>
        </ol></Slide>
      <Slide n={12} dark><H>Now you be the front desk.</H><P>rollcall-sage.vercel.app → Answer a call. What you say becomes row 41.</P><p className="t-label mt-16 text-[20px] opacity-70">{META.plan} and every office are simulated. No real clinic was called.</p></Slide>
    </main>
  )
}
