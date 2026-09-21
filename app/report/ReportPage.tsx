'use client'
import { ReportSheet } from '@/components/console/ReportSheet'
import { LISTINGS } from '@/lib/seed'
import { useYourRows } from '@/lib/your-rows'

export function ReportPage() {
  const yours = useYourRows()
  return <ReportSheet page swept listings={[...LISTINGS, ...yours]} />
}
