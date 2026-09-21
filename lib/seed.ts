import raw from '@/seed/demo.json'
import type { Seed } from './types'

export const seed = raw as unknown as Seed
export const LISTINGS = seed.listings
export const META = seed.meta
