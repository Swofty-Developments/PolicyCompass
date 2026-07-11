import type { AppliedDeltas, AxisId, Bloc } from '../../types'
import { axisMeta } from '../../../engine/axes'
import { signed } from '../../../lib/format'

/** Fallback display names for the pinned bloc ids when no Bloc list is at hand. */
const BLOC_LABELS: Record<string, string> = {
  'bloc-labour': 'Labour',
  'bloc-national': 'National',
  'bloc-reform': 'Reform',
  'bloc-vanguard': 'Vanguard',
  'bloc-ironleague': 'Iron League',
}

export function blocLabel(id: string, blocs?: Bloc[]): string {
  const bloc = blocs?.find((b) => b.id === id)
  return bloc?.short ?? BLOC_LABELS[id] ?? id.replace(/^bloc-/, '')
}

export const signedFine = (d: number): string => (d > 0 ? '+' : '') + d.toFixed(2)

export function driftLine(axis: AxisId, delta: number): string {
  const verb = Math.abs(delta) >= 0.08 ? 'lurches' : 'drifts'
  const dir = delta > 0 ? 'rightward' : 'leftward'
  return `The country ${verb} ${dir} on the ${axisMeta(axis).name.toLowerCase()} question.`
}

function DeltaRow({ k, delta }: { k: string; delta: number }) {
  return (
    <div className="t-delta-row">
      <span>{k}</span>
      <span className={'n ' + (delta > 0 ? 'up' : 'down')}>{signed(delta)}</span>
    </div>
  )
}

/** The printed ledger of what an outcome moved, with its attribution lines. */
export function DeltaLines({ deltas, blocs }: { deltas: AppliedDeltas; blocs?: Bloc[] }) {
  const rows: { k: string; delta: number }[] = []
  if (deltas.trust !== 0) rows.push({ k: 'Standing', delta: deltas.trust })
  if (deltas.conviction !== 0) rows.push({ k: 'Conviction', delta: deltas.conviction })
  if (deltas.treasury !== 0) rows.push({ k: 'Exchequer', delta: deltas.treasury })
  for (const r of deltas.relations) {
    if (r.delta !== 0) rows.push({ k: blocLabel(r.blocId, blocs), delta: r.delta })
  }
  if (!rows.length && !deltas.zeitgeist.length && !deltas.lines.length) return null
  return (
    <div className="t-delta-ledger">
      {rows.map((r) => (
        <DeltaRow key={r.k} k={r.k} delta={r.delta} />
      ))}
      {deltas.zeitgeist.map((z) => (
        <div className="t-delta-row" key={z.axis}>
          <span>{axisMeta(z.axis).name} mood</span>
          <span className="n">{signedFine(z.delta)}</span>
        </div>
      ))}
      {deltas.lines.map((line, i) => (
        <p className="t-sketch" key={i}>{line}</p>
      ))}
    </div>
  )
}
