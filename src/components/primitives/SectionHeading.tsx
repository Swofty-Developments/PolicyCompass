import type { ReactNode } from 'react'

export function SectionHeading({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="secname b-secname">
      {icon}
      {children}
    </div>
  )
}
