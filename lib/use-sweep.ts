'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { META } from './seed'
import type { Mode } from './sweep-engine'

const SEEN = 'rollcall:seen'
/** UI ticks per second while the recorded sweep replays */
const TICK_HZ = 12

export type ViewState = 'ready' | 'loading' | 'error' | 'empty'

export function useSweep() {
  const [mode, setMode] = useState<Mode>('before')
  const [t, setT] = useState(-1)
  const [view, setView] = useState<ViewState>('ready')
  const [frozen, setFrozen] = useState(false)
  const raf = useRef(0)
  const clock = useRef({ t: -1, last: 0, shown: 0 })

  const stop = () => cancelAnimationFrame(raf.current)

  const embed = useRef(false)

  const finish = useCallback(() => {
    stop()
    clock.current.t = META.sweepDuration
    setT(META.sweepDuration)
    setMode('done')
    // the landing page's live preview must not spend the visitor's first-visit autoplay
    if (!embed.current) try { sessionStorage.setItem(SEEN, '1') } catch {}
  }, [])

  const start = useCallback(() => {
    stop()
    clock.current = { t: 0, last: performance.now(), shown: 0 }
    setT(0)
    setMode('running')
    const loop = (now: number) => {
      const c = clock.current
      const dt = Math.min(0.25, (now - c.last) / 1000)
      c.last = now
      if (!document.hidden) c.t += dt * META.speed
      if (c.t >= META.sweepDuration) return finish()
      if (now - c.shown > 1000 / TICK_HZ) { c.shown = now; setT(c.t) }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
  }, [finish])

  const reset = useCallback(() => {
    stop()
    try { sessionStorage.removeItem(SEEN) } catch {}
    clock.current.t = -1
    setT(-1)
    setMode('before')
  }, [])

  // first paint is always `before`; the URL, the session and the OS then decide what happens next
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    if (q.has('embed')) { embed.current = true; const id = setTimeout(start, 600); return () => { clearTimeout(id); stop() } }
    const state = q.get('state')
    const at = q.get('t')
    if (state === 'loading' || state === 'error' || state === 'empty') setView(state)
    if (at !== null) {
      const v = Number(at)
      setFrozen(true); setMode('running'); setT(v); clock.current.t = v
      return
    }
    if (state === 'before') { setFrozen(true); return }
    if (state === 'running') { setFrozen(true); setMode('running'); setT(118); return }
    if (state === 'done' || q.has('listing') || q.has('call') || q.has('tab')) { finish(); return }
    let seen = false
    try { seen = sessionStorage.getItem(SEEN) === '1' } catch {}
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (seen || reduced) { finish(); return }
    const id = setTimeout(start, 1200)
    return () => { clearTimeout(id); stop() }
  }, [finish, start])

  // in the preview the sweep loops: a pause on the finished register, then again
  useEffect(() => { if (!embed.current || mode !== 'done') return; const id = setTimeout(start, 6000); return () => clearTimeout(id) }, [mode, start])

  return { mode, t, view, frozen, start, skip: finish, reset }
}
