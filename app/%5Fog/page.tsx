import type { Metadata } from 'next'
import { Mark } from '@/components/brand/Logo'
import { LISTINGS } from '@/lib/seed'

// Source for app/opengraph-image.png: `node scripts/brand.mjs` screenshots this page at 1200×630.
export const metadata: Metadata = { robots: { index: false } }

export default function Og() {
  return (
    <main className="flex h-[630px] w-[1200px] flex-col justify-between overflow-hidden bg-canvas p-[64px]">
      <div className="flex items-center gap-4"><Mark size={56} /><span className="t-display text-[44px]">Rollcall</span></div>
      <div>
        <h1 className="t-display max-w-[19ch] text-[84px] leading-[1.02]">It phones every doctor’s office on the list.</h1>
        <p className="mt-5 text-[28px] text-ink-muted">Then it fixes the list, and keeps the clip behind every change.</p>
      </div>
      <div>
        <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] gap-[5px]">
          {LISTINGS.map((l) => <span key={l.id} data-outcome={l.result.outcome} className="h-[22px] rounded-[1px] bg-[var(--oc)]" />)}
        </div>
        <p className="t-label mt-4 text-[15px] text-ink-muted">40 listings · 17 accurate · 11 corrected · 8 shouldn’t be listed · 3 need a human · simulated offices</p>
      </div>
    </main>
  )
}
