import type { Metadata } from 'next'
import { Kit } from './Kit'

export const metadata: Metadata = { title: 'Kit', robots: { index: false } }
export default function Page() { return <Kit /> }
