import type { ReactNode } from 'react'
import type { AxisId } from '../../types'
import { parties, zoneLabels } from '../../data'
import { partiesInZone } from '../../engine/scoring'
import { clamp } from '../../lib/format'
import { ZoneTooltip } from './ZoneTooltip'

export function SpectrumBar({
  axis,
  label,
  read,
  mean,
  std,
  headline,
  note,
}: {
  axis?: AxisId
  label: string
  read: string
  mean: number
  std: number
  headline?: boolean
  note?: ReactNode
}) {
  const pin = clamp(((mean + 1) / 2) * 100, 0, 100)
  const bandL = clamp(((mean - std + 1) / 2) * 100, 0, 100)
  const bandR = clamp(((mean + std + 1) / 2) * 100, 0, 100)

  return (
    <div className={'axisrow' + (headline ? ' headline' : '')}>
      <div className="axisname">
        <span>{label}</span>
        <span className="read">{read}</span>
      </div>
      <div className="spectrum">
        {Array.from({ length: 7 }).map((_, i) => {
          const left = (i / 7) * 100
          const width = 100 / 7
          if (!axis) return <div className="zone" key={i} style={{ left: `${left}%`, width: `${width}%` }} />
          const ps = partiesInZone(parties, axis, i).map((p) => `${p.name} (${p.country})`)
          return (
            <div className="zone hot" key={i} style={{ left: `${left}%`, width: `${width}%` }}>
              <ZoneTooltip ideology={zoneLabels[axis][i]} parties={ps} />
            </div>
          )
        })}
        <div className="band" style={{ left: `${bandL}%`, width: `${Math.max(bandR - bandL, 1.5)}%` }} />
        <div className="pin" style={{ left: `${pin}%` }} />
      </div>
      {note && <div className="axis-note">{note}</div>}
    </div>
  )
}
