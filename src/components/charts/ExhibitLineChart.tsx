import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ExhibitChart } from '../../types'
import { seriesColor, tickStyle, tooltipProps, CHART } from './theme'

export function ExhibitLineChart({ chart }: { chart: ExhibitChart }) {
  const series = chart.series ?? []
  const len = series.reduce((m, s) => Math.max(m, s.points.length), 0)
  const data = Array.from({ length: len }, (_, i) => {
    const row: Record<string, string | number> = {
      x: series.map((s) => s.points[i]?.x).find((v) => v !== undefined) ?? String(i),
    }
    for (const s of series) {
      const y = s.points[i]?.y
      if (y !== undefined) row[s.label] = y
    }
    return row
  })

  return (
    <div className="chart-host">
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={data} margin={{ top: 14, right: 14, bottom: 2, left: 2 }}>
          <CartesianGrid stroke={CHART.rule} strokeOpacity={0.45} strokeDasharray="2 3" />
          <XAxis dataKey="x" tick={tickStyle} tickLine={{ stroke: CHART.rule }} axisLine={{ stroke: CHART.sepia }} height={24} />
          <YAxis tick={tickStyle} tickLine={{ stroke: CHART.rule }} axisLine={{ stroke: CHART.sepia }} width={36} tickCount={4} />
          <Tooltip {...tooltipProps} />
          <Legend wrapperStyle={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }} />
          {series.map((s, si) => (
            <Line key={si} type="monotone" dataKey={s.label} stroke={seriesColor(s.tone)} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} isAnimationActive={false} />
          ))}
        </RLineChart>
      </ResponsiveContainer>
    </div>
  )
}
