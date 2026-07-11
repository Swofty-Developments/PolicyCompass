import type { AxisLoading } from '../types'

// Discretised Bayesian posterior over latent position θ ∈ [-1, 1] for ONE axis.
// We keep a probability grid and update it multiplicatively per swipe (2PL IRT).

export const GRID_N = 81
export const GRID = Array.from({ length: GRID_N }, (_, i) => -1 + (2 * i) / (GRID_N - 1))

// Std of a uniform distribution on [-1,1] = 2/sqrt(12) ≈ 0.5774. Used to normalise certainty.
export const STD_MAX = 0.5774

const A_MIN = 1.2
const A_MAX = 4.0

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x))

/** Logistic discrimination from a loading's clarity. */
export const discrimination = (clarity: number): number =>
  A_MIN + clamp01(clarity) * (A_MAX - A_MIN)

/** Signed location on [-1,1] for a loading. */
export const location = (l: AxisLoading): number =>
  (l.direction === 'right' ? 1 : -1) * clamp01(l.extremity)

/** P(ratify | θ) for a single loading. */
export function pRatify(theta: number, l: AxisLoading): number {
  const dir = l.direction === 'right' ? 1 : -1
  const a = discrimination(l.clarity)
  const loc = location(l)
  return sigmoid(a * dir * (theta - loc))
}

export function uniform(): number[] {
  return new Array(GRID_N).fill(1 / GRID_N)
}

/** Multiply the grid by the likelihood of the observed swipe and renormalise.
 *  `weight` tempers the evidence (likelihood^weight) — 1 = full-conviction swipe. */
export function update(grid: number[], l: AxisLoading, ratified: boolean, weight = 1): number[] {
  const next = new Array(GRID_N)
  let sum = 0
  for (let i = 0; i < GRID_N; i++) {
    const p = pRatify(GRID[i], l)
    const like = ratified ? p : 1 - p
    const v = grid[i] * (weight === 1 ? like : Math.pow(like, weight))
    next[i] = v
    sum += v
  }
  if (sum <= 0) return grid.slice() // degenerate guard
  for (let i = 0; i < GRID_N; i++) next[i] /= sum
  return next
}

export function mean(grid: number[]): number {
  let m = 0
  for (let i = 0; i < GRID_N; i++) m += GRID[i] * grid[i]
  return m
}

export function std(grid: number[]): number {
  const m = mean(grid)
  let v = 0
  for (let i = 0; i < GRID_N; i++) v += (GRID[i] - m) * (GRID[i] - m) * grid[i]
  return Math.sqrt(Math.max(0, v))
}

export function certainty(grid: number[]): number {
  return clamp01(1 - std(grid) / STD_MAX)
}

/** Fisher information of a loading at θ — how much a swipe on it would teach us. */
export function fisherInfo(theta: number, l: AxisLoading): number {
  const a = discrimination(l.clarity)
  const p = pRatify(theta, l)
  return a * a * p * (1 - p)
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}
