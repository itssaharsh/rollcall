import Link from 'next/link'
import { Lockup } from '@/components/brand/Logo'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
      <Lockup size={20} />
      <p className="t-label -rotate-[4deg] rounded-sm border-2 border-danger px-3 py-2 text-[13px] text-danger">Not in the directory</p>
      <h1 className="t-display text-[32px]">This listing isn’t in the directory</h1>
      <p className="max-w-[44ch] text-ink-muted">The page you asked for was never listed, or it was removed. The console has all forty.</p>
      <Link href="/console" className="inline-flex h-10 items-center rounded-md bg-accent px-4 font-semibold text-accent-ink transition-colors duration-150 hover:bg-accent-hover">Back to the console</Link>
    </main>
  )
}
