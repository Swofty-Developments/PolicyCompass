import type { ReactNode } from 'react'

/** The parchment "Exhibit" frame: stamp label, the chart, an optional pointing
 *  note, and the source/unit line. */
export function ChartFrame({
  label,
  note,
  unitNote,
  children,
}: {
  label: string
  note?: string
  unitNote?: string
  children: ReactNode
}) {
  return (
    <div className="b-exhibit">
      <span className="lbl">{label}</span>
      {children}
      {note && <div className="chart-note">↑ {note}</div>}
      {unitNote && <div className="axisnote">{unitNote}</div>}
    </div>
  )
}
