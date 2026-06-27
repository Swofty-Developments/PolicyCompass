import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ExhibitChart } from '../../types'
import { CHART, tickStyle, tooltipProps } from './theme'

interface TickProps {
  x?: number
  y?: number
  payload?: { value?: string | number }
}

/** Angled, truncated category labels so long bar names don't overlap or clip. */
function CategoryTick({ x = 0, y = 0, payload }: TickProps) {
  const full = String(payload?.value ?? '')
  const short = full.length > 16 ? full.slice(0, 15) + '…' : full
  return (
    <text x={x} y={y + 9} textAnchor="end" transform={`rotate(-24, ${x}, ${y + 9})`} fontFamily="Courier Prime, monospace" fontSize={9} fill={CHART.sepia}>
      {short}
    </text>
  )
}

export function ExhibitBarChart({ chart }: { chart: ExhibitChart }) {
  const bars = (chart.bars ?? []).map((b) => ({
    name: b.label,
    value: b.value,
    display: b.display,
    highlight: !!b.highlight,
  }))
  const vals = bars.map((b) => b.value)
  const max = vals.length ? Math.max(...vals) : 1
  const min = vals.length ? Math.min(...vals) : 0
  const spread = max - min
  // Anchor non-negative data at 0 (honest baseline); only extend below 0 when data is actually negative.
  const floor = min < 0 ? min - spread * 0.25 : 0
  const top = max <= 0 ? (min < 0 ? 0 : 1) : max + Math.max(spread * 0.18, Math.abs(max) * 0.05, 0.5)

  return (
    <div className="chart-host">
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={bars} margin={{ top: 20, right: 12, bottom: 8, left: 2 }}>
          <CartesianGrid stroke={CHART.rule} strokeOpacity={0.45} strokeDasharray="2 3" vertical={false} />
          <XAxis dataKey="name" interval={0} height={52} tick={<CategoryTick />} tickLine={{ stroke: CHART.rule }} axisLine={{ stroke: CHART.sepia }} />
          <YAxis domain={[floor, top]} tick={tickStyle} tickLine={{ stroke: CHART.rule }} axisLine={{ stroke: CHART.sepia }} width={46} tickCount={4} allowDecimals={false} />
          <Tooltip {...tooltipProps} formatter={(value: unknown, _n: unknown, item: { payload?: { display?: string } }) => [item?.payload?.display ?? String(value), '']} />
          {chart.annotation && bars.some((b) => b.name === chart.annotation!.target) && (
            <ReferenceLine x={chart.annotation.target} stroke={CHART.red} strokeDasharray="3 3" ifOverflow="extendDomain" />
          )}
          <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={68}>
            {bars.map((b, i) => (
              <Cell key={i} fill={b.highlight ? CHART.red : CHART.bar} stroke={b.highlight ? CHART.redDeep : CHART.sepia} />
            ))}
            <LabelList dataKey="display" position="top" fill={CHART.sepia} fontFamily="Courier Prime, monospace" fontSize={11} fontWeight={700} />
          </Bar>
        </RBarChart>
      </ResponsiveContainer>
    </div>
  )
}
