// The register tick. Variant 1 (the R whose leg is a tick) is the chosen mark; 2 and 3 stay for the kit.
export function Mark({ size = 24, variant = 1, title = 'Rollcall' }: { size?: number; variant?: 1 | 2 | 3; title?: string }) {
  const common = { width: size, height: size, viewBox: '0 0 48 48', role: 'img' as const, 'aria-label': title }
  if (variant === 2)
    return (
      <svg {...common} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="5" width="38" height="38" rx="5" stroke="var(--ink)" strokeWidth="6" />
        <path d="M13 19l4.5 5L27 13" stroke="var(--accent)" strokeWidth="6" />
        <path d="M13 34h22" stroke="var(--ink)" strokeWidth="6" />
      </svg>
    )
  if (variant === 3)
    return (
      <svg {...common}>
        <path fillRule="evenodd" fill="var(--ink)" d="M24 3a17 17 0 0 1 17 17c0 10-11 19-17 25C18 39 7 30 7 20A17 17 0 0 1 24 3zm-9.5 17.5l3.5-3.5 4.5 4.5 8-9 3.8 3.3L22.8 29z" />
      </svg>
    )
  return (
    <svg {...common} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 40V9h11a8.5 8.5 0 0 1 0 17H11" stroke="var(--ink)" strokeWidth="6.5" />
      <path d="M21 27.5l7 11.5 13-21" stroke="var(--accent)" strokeWidth="6.5" />
    </svg>
  )
}

export function Lockup({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.4 }}>
      <Mark size={size * 1.25} />
      <span className="t-display text-ink" style={{ fontSize: size }}>Rollcall</span>
    </span>
  )
}
