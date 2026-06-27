import type { AxisId, Bill } from '../types'
import { AXIS_IDS } from '../types'
import { fisherInfo, mean, std } from './posterior'

export type Posteriors = Record<AxisId, number[]>

/**
 * Choose the next bill to serve. Strategy:
 *  1. Seed coverage — until every axis has been touched at least once, prefer
 *     bills whose primary axis is still unmeasured.
 *  2. Among candidates, maximise expected information: for each loading, the
 *     Fisher information at the current axis mean, weighted by that axis's
 *     remaining uncertainty (std). This is what makes the deck "follow you out
 *     to the tail" — once your estimate marches toward a pole, the most
 *     informative unused bills are the ones located out there.
 */
export function selectNext(
  posteriors: Posteriors,
  bills: Bill[],
  servedIds: Set<string>,
): Bill | null {
  const unused = bills.filter((b) => !servedIds.has(b.id))
  if (unused.length === 0) return null

  // axis means + uncertainty
  const axisMean: Record<AxisId, number> = {} as Record<AxisId, number>
  const axisStd: Record<AxisId, number> = {} as Record<AxisId, number>
  for (const ax of AXIS_IDS) {
    axisMean[ax] = mean(posteriors[ax])
    axisStd[ax] = std(posteriors[ax])
  }

  // which axes have been measured at all (std meaningfully below uniform)?
  const measured = new Set<AxisId>()
  for (const b of bills) {
    if (servedIds.has(b.id)) {
      const ax = b.loadings[0]?.axis
      if (ax) measured.add(ax)
    }
  }
  const uncovered = AXIS_IDS.filter((ax) => !measured.has(ax))

  let pool = unused
  if (uncovered.length > 0) {
    const covering = unused.filter((b) => uncovered.includes(b.loadings[0]?.axis))
    if (covering.length > 0) pool = covering
  }

  let best: Bill | null = null
  let bestScore = -Infinity
  for (const b of pool) {
    let score = 0
    for (const l of b.loadings) {
      const info = fisherInfo(axisMean[l.axis], l)
      // weight by uncertainty so the least-certain axes are prioritised
      score += info * (0.15 + axisStd[l.axis])
    }
    if (score > bestScore) {
      bestScore = score
      best = b
    }
  }
  return best
}

/**
 * A "wildcard probe" — deliberately serves a bold, unused bill that is a genuine
 * STRETCH from where the player currently sits (preferring the pole they have NOT
 * leaned toward). It tests "would you actually make a wild change?", surfaces the
 * historical extremes a moderate run would otherwise never reach, and still adds
 * real information at the tails.
 */
export function selectProbe(
  posteriors: Posteriors,
  bills: Bill[],
  servedIds: Set<string>,
  minExtremity = 0.72,
): Bill | null {
  const unused = bills.filter((b) => !servedIds.has(b.id))
  if (unused.length === 0) return null
  const bold = unused.filter((b) => (b.loadings[0]?.extremity ?? 0) >= minExtremity)
  const pool = bold.length ? bold : unused

  const axisMean: Record<AxisId, number> = {} as Record<AxisId, number>
  for (const ax of AXIS_IDS) axisMean[ax] = mean(posteriors[ax])

  let best: Bill | null = null
  let bestScore = -Infinity
  for (const b of pool) {
    const l = b.loadings[0]
    if (!l) continue
    const dir = l.direction === 'right' ? 1 : -1
    const loc = dir * l.extremity
    // how far a "yes" would drag them — the bolder the leap from here, the better the probe
    const stretch = Math.abs(loc - axisMean[l.axis])
    const score = l.extremity * (0.5 + stretch)
    if (score > bestScore) {
      bestScore = score
      best = b
    }
  }
  return best
}
