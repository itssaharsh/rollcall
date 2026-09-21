'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const W = 1440, H = 960

/** The real console, running the recorded sweep on a loop, scaled to fit. One click opens it full size. */
export function LiveEmbed() {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const el = box.current!; const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W)); ro.observe(el); return () => ro.disconnect()
  }, [])
  return (
    <Link href="/console" aria-label="Open the console" className="group relative block overflow-hidden rounded-lg border border-line-strong bg-surface-1 shadow-float">
      <div ref={box} className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        {/* small screens get a still; the live console is for screens that can show it */}
        <Image src="/shot-console.png" alt="The Rollcall console after a sweep: a register of forty listings, a tally and a map of pins" width={W} height={H} priority className="absolute inset-0 size-full object-cover object-top lg:hidden" />
        {scale > 0 && (
          <iframe src="/console?embed=1" title="Live preview of the Rollcall console" tabIndex={-1} aria-hidden loading="eager"
            className="pointer-events-none absolute left-0 top-0 hidden origin-top-left border-0 lg:block" style={{ width: W, height: H, transform: `scale(${scale})` }} />
        )}
      </div>
      <span className="t-label absolute left-3 top-3 flex items-center gap-2 rounded-sm bg-ink px-2 py-1 text-canvas"><span className="lamp-blink size-2 rounded-full bg-lamp-ringing" />Live · recorded sweep on a loop</span>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/90 px-4 py-2.5 text-[14px] font-semibold text-canvas transition-colors duration-150 group-hover:bg-accent">Open the console<span aria-hidden>→</span></span>
    </Link>
  )
}
