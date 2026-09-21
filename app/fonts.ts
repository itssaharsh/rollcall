import { Instrument_Sans, Martian_Mono } from 'next/font/google'

// One sans in three widths (75% display, 85% listings, 100% body) plus a mono for anything a machine produced.
export const sans = Instrument_Sans({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--ff-body', display: 'swap' })
export const mono = Martian_Mono({ subsets: ['latin', 'latin-ext'], variable: '--ff-mono', display: 'swap' })
