import type { AxisVector, Bill } from '../../types'
import { AXIS_IDS } from '../../types'

// Side-based bloc stance (docs/TERMS.md § The floor). Validated against the
// real pool: ~37/107 passable, ~47 contested, ~23 near-knife-edge.
export const STANCE_A = 3.2
export const STANCE_BETA = 0.35
export const STANCE_C = 0.15
export const FOR_THRESHOLD = 0.62
export const AGAINST_THRESHOLD = 0.38

export const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x))

/** P(a bloc at `vector` backs the bill). Secondary loadings at half weight. */
export function blocStance(vector: AxisVector, bill: Bill): number {
  let z = 0
  bill.loadings.forEach((l, i) => {
    const dir = l.direction === 'right' ? 1 : -1
    const w = i === 0 ? 1 : 0.5
    z += w * (dir * (vector[l.axis] ?? 0) - STANCE_BETA * l.extremity + STANCE_C)
  })
  return sigmoid(STANCE_A * z)
}

/** Bloc side of a division at the spec thresholds. */
export function stanceSide(stance: number): 'for' | 'against' | 'hesitant' {
  if (stance > FOR_THRESHOLD) return 'for'
  if (stance < AGAINST_THRESHOLD) return 'against'
  return 'hesitant'
}

/**
 * Signed agreement between the national mood and a bloc's vector, in [-1,1].
 * Direction by cosine, scaled by how polarised the mood actually is — a
 * centred country swings nobody; a hot one swings by full alignment.
 */
export function zeitgeistAlignment(zeitgeist: AxisVector, vector: AxisVector): number {
  let dot = 0
  let nz = 0
  let nv = 0
  for (const ax of AXIS_IDS) {
    const z = zeitgeist[ax] ?? 0
    const v = vector[ax] ?? 0
    dot += z * v
    nz += z * z
    nv += v * v
  }
  const zMag = Math.sqrt(nz)
  const d = zMag * Math.sqrt(nv)
  if (d === 0) return 0
  return (dot / d) * Math.min(1, zMag / 0.3)
}

/** Scale-free ideological adjacency between two vectors (cosine), in [-1,1]. */
export function vectorAdjacency(a: AxisVector, b: AxisVector): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (const ax of AXIS_IDS) {
    const x = a[ax] ?? 0
    const y = b[ax] ?? 0
    dot += x * y
    na += x * x
    nb += y * y
  }
  const d = Math.sqrt(na) * Math.sqrt(nb)
  return d === 0 ? 0 : dot / d
}
