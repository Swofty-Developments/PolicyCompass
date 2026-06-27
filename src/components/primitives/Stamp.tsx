import type { ReactNode } from 'react'

export function Stamp({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`stamp ${className}`.trim()}>{children}</span>
}
