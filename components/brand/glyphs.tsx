'use client'
import { motion } from 'motion/react'
import type { Outcome } from '@/lib/types'

// Custom glyphs on a 24 grid, 2px round strokes, to sit beside Phosphor Regular.
const PATHS: Record<Outcome | 'register', string[]> = {
  confirmed: ['M5 12.5l4.5 4.5L19 7.5'],
  corrected: ['M4 20h4l11-11-4-4L4 16z', 'M13 7l4 4'],
  ghost: ['M6 6l12 12', 'M18 6L6 18'],
  review: ['M6 21V4', 'M6 5h11l-2.5 4 2.5 4H6'],
  retry: ['M19 12a7 7 0 1 1-2.05-4.95', 'M19 4v4h-4'],
  register: ['M5 4h14v16H5z', 'M8 9h2', 'M12 9h4', 'M8 13h2', 'M12 13h4', 'M8 17h2'],
}

export function Glyph({ name, size = 16, draw = false, className }: { name: Outcome | 'register'; size?: number; draw?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {PATHS[name].map((d, i) =>
        draw ? (
          <motion.path key={d} d={d} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }} />
        ) : (
          <path key={d} d={d} />
        ),
      )}
    </svg>
  )
}
