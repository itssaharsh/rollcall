import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { mono, sans } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Rollcall — phones every office in the directory', template: '%s · Rollcall' },
  description: 'A voice agent that calls every doctor’s office in a health plan’s directory, fixes the list, and keeps the audio behind every change. Built on AssemblyAI.',
}
export const viewport: Viewport = { themeColor: '#E8ECE6', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <Toaster position="bottom-right" duration={4000} />
      </body>
    </html>
  )
}
