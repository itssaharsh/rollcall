import type { Metadata } from 'next'
import Link from 'next/link'
import { ReportPage } from './ReportPage'

export const metadata: Metadata = { title: 'Sweep report' }

export default function Page() {
  return (
    <main className="min-h-dvh p-4 sm:p-8">
      <p className="no-print mx-auto mb-4 flex max-w-[840px] items-center justify-between text-[13px]">
        <Link href="/?tab=report" className="font-medium text-accent hover:underline">← Back to the console</Link>
        <span className="t-label text-ink-muted">Simulated offices — no real clinics were called</span>
      </p>
      <ReportPage />
    </main>
  )
}
