import type { AxisId, AxisMeta } from '../types'

export const AXES: AxisMeta[] = [
  { id: 'economic', name: 'Economic', blurb: 'Who owns and runs the economy — collective vs. private.' },
  { id: 'fiscal', name: 'Fiscal', blurb: 'Tax, spend and the size of the state’s purse.' },
  { id: 'social', name: 'Social', blurb: 'Personal life, tradition and moral order.' },
  { id: 'identity', name: 'Identity & Nation', blurb: 'Nationhood, belonging and the borders of "us".' },
  { id: 'law_order', name: 'Law & Order', blurb: 'Force, surveillance and the reach of the state over the citizen.' },
]

export const axisMeta = (id: AxisId): AxisMeta => AXES.find((a) => a.id === id)!

// Seven named zones across [-1, 1].
export const ZONE_NAMES = [
  'Far-Left',
  'Left',
  'Centre-Left',
  'Centre',
  'Centre-Right',
  'Right',
  'Far-Right',
] as const

/** Zone index 0..6 for a position in [-1,1]. */
export function zoneOf(value: number): number {
  const v = Math.max(-1, Math.min(1, value))
  const idx = Math.floor(((v + 1) / 2) * 7)
  return Math.min(6, idx)
}

/** Plain-language read of a position, e.g. "Centre-Left". */
export function readPosition(value: number): string {
  return ZONE_NAMES[zoneOf(value)]
}

/** Map a position in [-1,1] to a 0..100 left→right scale. */
export const to100 = (value: number): number => Math.round(((value + 1) / 2) * 100)
