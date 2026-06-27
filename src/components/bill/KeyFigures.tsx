import type { StatChip as StatChipData } from '../../types'
import { StatChip } from '../primitives'

export function KeyFigures({ stats }: { stats: StatChipData[] }) {
  return (
    <div className="b-stats">
      {stats.map((s, i) => (
        <StatChip key={i} value={s.value} label={s.label} />
      ))}
    </div>
  )
}
