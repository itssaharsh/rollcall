'use client'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { forwardRef } from 'react'
import { Glyph } from '@/components/brand/glyphs'
import { OUTCOME_LABEL, OUTCOME_ORDER, type Outcome } from '@/lib/types'

export const FilterBar = forwardRef<HTMLInputElement, { q: string; onQ: (v: string) => void; filter: Outcome | null; onFilter: (o: Outcome | null) => void }>(
  function FilterBar({ q, onQ, filter, onFilter }, ref) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden items-center gap-1 xl:flex">
          {OUTCOME_ORDER.map((o) => (
            <button key={o} type="button" data-outcome={o} aria-pressed={filter === o} onClick={() => onFilter(filter === o ? null : o)} title={OUTCOME_LABEL[o]}
              className={`inline-flex size-7 items-center justify-center rounded-sm border text-[var(--oc)] transition-colors duration-150 ${filter === o ? 'border-[var(--oc)] bg-[color-mix(in_oklch,var(--oc)_12%,transparent)]' : 'border-line hover:bg-surface-2'}`}>
              <Glyph name={o} size={14} /><span className="sr-only">{OUTCOME_LABEL[o]}</span>
            </button>
          ))}
        </div>
        <label className="flex h-8 w-[220px] items-center gap-2 rounded-md border border-line bg-surface-1 px-2 transition-colors duration-150 focus-within:border-accent hover:border-line-strong max-sm:w-full">
          <MagnifyingGlass size={14} className="shrink-0 text-ink-muted" />
          <input ref={ref} value={q} onChange={(e) => onQ(e.target.value)} placeholder="Search name, practice, district" aria-label="Search listings"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-muted max-sm:text-[16px]" />
        </label>
      </div>
    )
  },
)

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex items-end gap-1">
      {tabs.map((tab) => {
        const on = tab.id === value
        return (
          <button key={tab.id} role="tab" aria-selected={on} type="button" onClick={() => onChange(tab.id)}
            className={`relative flex h-10 items-center gap-2 px-3 text-[14px] font-medium transition-colors duration-150 ${on ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}>
            {tab.label}
            {tab.count !== undefined && <span className="t-mono text-ink-muted">{tab.count}</span>}
            {on && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-accent" />}
          </button>
        )
      })}
    </div>
  )
}
