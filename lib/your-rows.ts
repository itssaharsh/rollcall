'use client'
import { useSyncExternalStore } from 'react'
import type { Listing } from './types'

// Rows written by a visitor's own call. Local for now; the build phase moves this behind /api/rows.
const KEY = 'rollcall:rows'
const listeners = new Set<() => void>()
let cache: Listing[] | null = null
const EMPTY: Listing[] = []

const read = (): Listing[] => {
  if (cache) return cache
  // a recorded call's audio is an object URL, which does not survive a page load
  try { cache = (JSON.parse(localStorage.getItem(KEY) || '[]') as Listing[]).map((r) => (r.call.audio?.startsWith('blob:') ? { ...r, call: { ...r.call, audio: undefined } } : r)) } catch { cache = [] }
  return cache!
}
const write = (rows: Listing[]) => {
  cache = rows
  try { localStorage.setItem(KEY, JSON.stringify(rows)) } catch {}
  listeners.forEach((l) => l())
}

export const addYourRow = (row: Listing) => {
  const rows = read()
  const n = 41 + rows.length
  write([...rows, { ...row, n, id: `L-${String(n).padStart(3, '0')}`, yours: true }])
  return n
}
export const clearYourRows = () => write([])

export function useYourRows() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    read,
    () => EMPTY,
  )
}
