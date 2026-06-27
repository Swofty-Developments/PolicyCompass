// Shared Recharts theming so every exhibit reads as one consistent dossier chart.
export const CHART = {
  sepia: '#5e4a28',
  rule: '#b59b6a',
  ink: '#2a2012',
  red: '#c2403a',
  redDeep: '#7e1f1b',
  bar: '#a98c55',
  paper: '#f6ebd0',
  gold: '#e8b04a',
  left: '#7e1f1b',
  right: '#3a2d6b',
  neutral: '#5e4a28',
}

export const tickStyle = { fontFamily: 'Courier Prime, monospace', fontSize: 10, fill: CHART.sepia }

export const tooltipProps = {
  cursor: { fill: 'rgba(94,74,40,0.08)' },
  contentStyle: {
    background: CHART.ink,
    border: 'none',
    borderRadius: 8,
    fontFamily: 'EB Garamond, serif',
    color: CHART.paper,
    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
  },
  // Recharts colours item rows by series by default — force light text on the dark bubble.
  itemStyle: { color: CHART.paper },
  labelStyle: { color: CHART.gold, fontFamily: 'Courier Prime, monospace', fontSize: 11, letterSpacing: '0.04em' },
}

export const seriesColor = (tone?: string) =>
  tone === 'left' ? CHART.left : tone === 'right' ? CHART.right : CHART.neutral
