import type { AnalystPoint } from '../../types'
import { Cite } from './Cite'

function AnalystColumn({
  tone,
  title,
  points,
  citeNumber,
}: {
  tone: 'for' | 'against'
  title: string
  points: AnalystPoint[]
  citeNumber: (url: string) => number
}) {
  return (
    <div className={`col ${tone}`}>
      <h5>{title}</h5>
      {points.map((p, i) => (
        <p className="pt" key={i}>
          <span className="ministat">{p.stat}</span>
          {p.text}
          <Cite n={citeNumber(p.source.url)} url={p.source.url} />
        </p>
      ))}
    </div>
  )
}

export function AnalystColumns({
  forPoints,
  againstPoints,
  citeNumber,
}: {
  forPoints: AnalystPoint[]
  againstPoints: AnalystPoint[]
  citeNumber: (url: string) => number
}) {
  return (
    <div className="cols">
      <AnalystColumn tone="for" title="✓ In favour" points={forPoints} citeNumber={citeNumber} />
      <AnalystColumn tone="against" title="✕ Against" points={againstPoints} citeNumber={citeNumber} />
    </div>
  )
}
