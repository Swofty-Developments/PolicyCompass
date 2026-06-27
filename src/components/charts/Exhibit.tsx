import type { FC } from 'react'
import type { ExhibitChart } from '../../types'
import { ChartFrame } from './ChartFrame'
import { ExhibitBarChart } from './ExhibitBarChart'
import { ExhibitLineChart } from './ExhibitLineChart'
import '../../styles/charts.css'

// Registry of chart kinds. To add a "cool graph", drop a component in and
// register it here — nothing else in the app needs to change.
export const CHART_REGISTRY: Record<ExhibitChart['kind'], FC<{ chart: ExhibitChart }>> = {
  bar: ExhibitBarChart,
  line: ExhibitLineChart,
}

export function Exhibit({ chart }: { chart: ExhibitChart }) {
  const Chart = CHART_REGISTRY[chart.kind] ?? ExhibitBarChart
  return (
    <ChartFrame label={chart.label} note={chart.annotation?.text} unitNote={chart.unitNote}>
      <Chart chart={chart} />
    </ChartFrame>
  )
}
