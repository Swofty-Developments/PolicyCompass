import type {
  Archetype,
  AxisId,
  AxisResult,
  AxisVector,
  Leader,
  Party,
} from '../types'
import { AXIS_IDS } from '../types'
import { zoneOf } from './axes'
import { certainty, mean, std, STD_MAX } from './posterior'
import type { Posteriors } from './adaptive'

/** Max Euclidean distance between two 5-axis vectors on [-1,1]^5. */
const DIST_MAX = Math.sqrt(AXIS_IDS.length * 4)

export function axisResults(posteriors: Posteriors): AxisResult[] {
  return AXIS_IDS.map((axis) => {
    const m = mean(posteriors[axis])
    return {
      axis,
      mean: m,
      std: std(posteriors[axis]),
      certainty: certainty(posteriors[axis]),
      zoneIndex: zoneOf(m),
    }
  })
}

export function overallStanding(results: AxisResult[]): { mean: number; std: number; certainty: number } {
  const mean = results.reduce((s, r) => s + r.mean, 0) / results.length
  const std = Math.sqrt(results.reduce((s, r) => s + r.std * r.std, 0)) / results.length
  const certainty = results.reduce((s, r) => s + r.certainty, 0) / results.length
  return { mean, std, certainty }
}

export function userVector(results: AxisResult[]): AxisVector {
  const v = {} as AxisVector
  for (const r of results) v[r.axis] = r.mean
  return v
}

function distance(a: AxisVector, b: AxisVector): number {
  let s = 0
  for (const ax of AXIS_IDS) {
    const d = (a[ax] ?? 0) - (b[ax] ?? 0)
    s += d * d
  }
  return Math.sqrt(s)
}

/** Convert a distance to an alignment percentage (closer = higher). */
export const alignPct = (a: AxisVector, b: AxisVector): number =>
  Math.round(Math.max(0, 1 - distance(a, b) / DIST_MAX) * 100)

export function nearestArchetype(user: AxisVector, archetypes: Archetype[]): Archetype {
  let best = archetypes[0]
  let bestD = Infinity
  for (const a of archetypes) {
    const d = distance(user, a.prototype)
    if (d < bestD) {
      bestD = d
      best = a
    }
  }
  return best
}

export function rankLeaders(user: AxisVector, leaders: Leader[], top = 3): { leader: Leader; pct: number }[] {
  return leaders
    .map((leader) => ({ leader, pct: alignPct(user, leader.vector) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, top)
}

export function rankParties(user: AxisVector, parties: Party[], top = 3): { party: Party; pct: number }[] {
  return parties
    .map((party) => ({ party, pct: alignPct(user, party.vector) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, top)
}

/** Parties whose value on `axis` falls inside a given zone (for hover context). */
export function partiesInZone(parties: Party[], axis: AxisId, zoneIndex: number, max = 4): Party[] {
  return parties.filter((p) => zoneOf(p.vector[axis] ?? 0) === zoneIndex).slice(0, max)
}

export { STD_MAX }
