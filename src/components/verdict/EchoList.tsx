import { pad2 } from '../../lib/format'

export interface EchoItem {
  name: string
  sub: string
  pct: number
}

/** Ranked alignment list — reused for both parties and leaders. */
export function EchoList({ title, items }: { title: string; items: EchoItem[] }) {
  return (
    <div className="echo">
      <div className="sec">{title}</div>
      <div className="rowlist">
        {items.map((it, i) => (
          <div className="erow" key={i}>
            <span className="rank">{pad2(i + 1)}</span>
            <div>
              <div className="nm">{it.name}</div>
              <div className="ctry">{it.sub}</div>
            </div>
            <span className="pct">{it.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
