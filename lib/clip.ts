'use client'
import { useSyncExternalStore } from 'react'
import type { Listing } from './types'

// One clip plays at a time, app-wide. With recorded audio it follows the <audio> clock;
// without it, it steps through the same word timings silently so the quote still inks in.
interface ClipState { key: string | null; time: number; silent: boolean }
let state: ClipState = { key: null, time: 0, silent: false }
const listeners = new Set<() => void>()
let el: HTMLAudioElement | null = null
let raf = 0
const emit = (next: ClipState) => { state = next; listeners.forEach((l) => l()) }

export function stopClip() {
  cancelAnimationFrame(raf)
  el?.pause()
  if (state.key) emit({ key: null, time: 0, silent: false })
}

export function playClip(listing: Listing, [t0, t1]: [number, number], key: string) {
  stopClip()
  const src = listing.call.audio
  if (src) {
    el ??= new Audio()
    if (!el.src.endsWith(src)) el.src = src
    el.currentTime = t0
    void el.play().catch(() => playSilently(t0, t1, key))
    const loop = () => {
      if (!el || el.currentTime >= t1 || el.ended) return stopClip()
      emit({ key, time: el.currentTime, silent: false })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return
  }
  playSilently(t0, t1, key)
}

function playSilently(t0: number, t1: number, key: string) {
  const began = performance.now()
  const loop = (now: number) => {
    const time = t0 + (now - began) / 1000
    if (time >= t1 + 0.3) return stopClip()
    emit({ key, time, silent: true })
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }
const server: ClipState = { key: null, time: 0, silent: false }

/** Subscribes only while `key` is the active clip, so a playing clip doesn't re-render the table. */
export function useClip(key: string) {
  const playing = useSyncExternalStore(subscribe, () => state.key === key, () => false)
  const time = useSyncExternalStore(subscribe, () => (state.key === key ? state.time : -1), () => -1)
  return { playing, time, silent: playing && state.silent }
}
export const useActiveClipKey = () => useSyncExternalStore(subscribe, () => state.key, () => server.key)
