'use client'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const base = 'relative inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap select-none transition-[background-color,border-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[.97] active:duration-[120ms] disabled:opacity-40 disabled:active:scale-100'
const variants: Record<Variant, string> = {
  primary: 'h-10 px-4 text-[14px] bg-accent text-accent-ink hover:bg-accent-hover active:bg-accent-press',
  secondary: 'h-9 px-3 text-[13px] bg-surface-1 text-ink border border-line hover:border-line-strong hover:bg-surface-2',
  ghost: 'h-8 px-2 text-[13px] text-ink-muted hover:bg-surface-2 hover:text-ink',
  danger: 'h-9 px-3 text-[13px] text-danger hover:bg-[color-mix(in_oklch,var(--danger)_10%,transparent)]',
}

export function Button({ variant = 'secondary', busy, icon, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean; icon?: ReactNode }) {
  return (
    <button type="button" aria-busy={busy || undefined} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {busy ? <Spinner /> : icon}
      <span>{children}</span>
    </button>
  )
}

export function IconButton({ label, children, className = '', size = 32, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: number }) {
  return (
    <button type="button" aria-label={label} title={label} style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-md text-ink-muted transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-[.94] disabled:opacity-40 ${className}`} {...rest}>
      {children}
    </button>
  )
}

export const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="animate-spin" aria-hidden>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
)

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="t-mono inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm border border-line bg-surface-1 px-1 text-[10px] text-ink-muted">{children}</kbd>
)
