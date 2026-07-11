// Calibrates the early-stop docket (certaintyTarget / min / max) by simulating
// persona voters through the REAL engine. Run:
//   npx tsx scripts/calibrate.ts
import { bills } from '../src/data'
import { createSession, applyVote, type SessionConfig } from '../src/engine/session'
import { pRatify, mean } from '../src/engine/posterior'
import { AXIS_IDS, type AxisId, type AxisVector, type Bill } from '../src/types'
import type { VoteInput } from '../src/engine/session'

// ---- seeded RNG (mulberry32) ----------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---- personas ---------------------------------------------------------------
interface Persona {
  id: string
  theta: AxisVector
  /** flatten p toward 0.5 by this factor (1 = faithful, <1 = noisier) */
  fidelity: number
  abstainRate: number
  /** counts toward the "consistent voters finish in 10–14" criterion */
  consistent: boolean
}

const vec = (v: number): AxisVector =>
  Object.fromEntries(AXIS_IDS.map((ax) => [ax, v])) as AxisVector

const PERSONAS: Persona[] = [
  { id: 'far-left', theta: vec(-0.75), fidelity: 1, abstainRate: 0, consistent: true },
  { id: 'far-right', theta: vec(0.75), fidelity: 1, abstainRate: 0, consistent: true },
  { id: 'mod-left', theta: vec(-0.3), fidelity: 1, abstainRate: 0, consistent: true },
  // the centrist also exercises the abstain path (~10% of cards)
  { id: 'centrist', theta: vec(0), fidelity: 1, abstainRate: 0.1, consistent: true },
  {
    id: 'cross-cut',
    theta: { ...vec(0), economic: -0.6, law_order: 0.5 },
    fidelity: 1,
    abstainRate: 0,
    consistent: true,
  },
  { id: 'noisy', theta: vec(0), fidelity: 0.35, abstainRate: 0, consistent: false },
]

// ---- response model ---------------------------------------------------------
function respond(persona: Persona, bill: Bill, rand: () => number): VoteInput {
  if (persona.abstainRate > 0 && rand() < persona.abstainRate) return { verdict: 'abstain' }
  const [primary, secondary] = bill.loadings
  let p = pRatify(persona.theta[primary.axis], primary)
  if (secondary) p = 0.7 * p + 0.3 * pRatify(persona.theta[secondary.axis], secondary)
  p = 0.5 + (p - 0.5) * persona.fidelity
  return {
    verdict: rand() < p ? 'ratify' : 'strike',
    conviction: Math.abs(p - 0.5) > 0.25 ? 'firm' : 'reluctant',
  }
}

// ---- simulation -------------------------------------------------------------
const SEEDS = 40

interface RunResult {
  length: number
  /** sum of squared per-axis placement errors (posterior mean vs true θ) */
  sqErr: number
}

function runOnce(persona: Persona, config: SessionConfig, seed: number): RunResult {
  const rand = mulberry32(seed)
  let state = createSession(bills, config)
  while (!state.finished && state.current) {
    state = applyVote(state, bills, respond(persona, state.current, rand))
  }
  let sqErr = 0
  for (const ax of AXIS_IDS as AxisId[]) {
    const err = mean(state.posteriors[ax]) - persona.theta[ax]
    sqErr += err * err
  }
  return { length: state.history.length, sqErr }
}

const quantile = (sorted: number[], q: number): number =>
  sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]

interface PersonaStats {
  median: number
  p90: number
  rmse: number
}

interface ConfigStats {
  config: SessionConfig
  perPersona: Record<string, PersonaStats>
  /** pooled RMSE across all personas / seeds / axes */
  rmse: number
}

function evaluate(config: SessionConfig): ConfigStats {
  const perPersona: Record<string, PersonaStats> = {}
  let pooledSq = 0
  let pooledN = 0
  for (let pi = 0; pi < PERSONAS.length; pi++) {
    const persona = PERSONAS[pi]
    const lengths: number[] = []
    let sq = 0
    for (let s = 0; s < SEEDS; s++) {
      const r = runOnce(persona, config, 0xbeef + pi * 7919 + s * 104729)
      lengths.push(r.length)
      sq += r.sqErr
    }
    lengths.sort((a, b) => a - b)
    perPersona[persona.id] = {
      median: quantile(lengths, 0.5),
      p90: quantile(lengths, 0.9),
      rmse: Math.sqrt(sq / (SEEDS * AXIS_IDS.length)),
    }
    pooledSq += sq
    pooledN += SEEDS * AXIS_IDS.length
  }
  return { config, perPersona, rmse: Math.sqrt(pooledSq / pooledN) }
}

// ---- grid + report ----------------------------------------------------------
const BASELINE: SessionConfig = { min: 25, max: 25, certaintyTarget: 1.01 }
// Targets below 0.50 are included because the stop gates on the WEAKEST of the
// five axes: with ~3 bills per axis by the mid-teens, min-axis certainty for a
// perfectly consistent voter is only ~0.3–0.4, so 0.50+ never fires.
const GRID: SessionConfig[] = []
for (const certaintyTarget of [0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7])
  for (const min of [8, 10])
    for (const max of [16, 18, 20]) GRID.push({ min, max, certaintyTarget })

const baseline = evaluate(BASELINE)
const results = GRID.map(evaluate)

const fmt = (s: PersonaStats) => `${String(s.median).padStart(2)}/${String(s.p90).padStart(2)}`
const header = [
  'target min max',
  ...PERSONAS.map((p) => p.id.padStart(9) + ' md/p90'),
  'rmse',
  'vs-base',
].join('  ')
console.log(`baseline fixed-25: pooled RMSE ${baseline.rmse.toFixed(4)} (${SEEDS} seeds/persona)`)
console.log(header)
console.log('-'.repeat(header.length))
for (const r of results) {
  const c = r.config
  console.log(
    [
      `${c.certaintyTarget.toFixed(2).padStart(6)} ${String(c.min).padStart(3)} ${String(c.max).padStart(3)}`,
      ...PERSONAS.map((p) => fmt(r.perPersona[p.id]).padStart(16)),
      r.rmse.toFixed(4),
      (r.rmse / baseline.rmse).toFixed(3) + 'x',
    ].join('  '),
  )
}

// ---- pick -------------------------------------------------------------------
// Strict criteria: every consistent persona's median ≤ 14, the noisy persona's
// MEDIAN hits the cap, pooled RMSE ≤ 1.15× the fixed-25 baseline. The every-axis
// gate makes this trio unsatisfiable (moderates' weakest axis firms up barely
// faster than the noisy voter's), so if strict is empty fall back to a relaxed
// rule: medians ≤ 15 and the noisy P90 at the cap. Prefer max = 18, then the
// highest certaintyTarget (accuracy) that still stops in time, then lower RMSE.
const consistent = PERSONAS.filter((p) => p.consistent)
const withinRmse = (r: ConfigStats) => r.rmse <= 1.15 * baseline.rmse
const strict = results.filter(
  (r) =>
    withinRmse(r) &&
    consistent.every((p) => r.perPersona[p.id].median <= 14) &&
    r.perPersona['noisy'].median >= r.config.max,
)
const relaxed = results.filter(
  (r) =>
    withinRmse(r) &&
    consistent.every((p) => r.perPersona[p.id].median <= 15) &&
    r.perPersona['noisy'].p90 >= r.config.max,
)
const feasible = strict.length ? strict : relaxed
feasible.sort((a, b) => {
  const prefMax = (c: SessionConfig) => (c.max === 18 ? 0 : 1)
  return (
    prefMax(a.config) - prefMax(b.config) ||
    b.config.certaintyTarget - a.config.certaintyTarget ||
    a.rmse - b.rmse
  )
})
const pick = feasible[0]
console.log()
if (pick) {
  const c = pick.config
  console.log(
    `PICK (${strict.length ? 'strict' : 'relaxed'} criteria):` +
      ` { min: ${c.min}, max: ${c.max}, certaintyTarget: ${c.certaintyTarget} }` +
      ` — rmse ${pick.rmse.toFixed(4)} (${(pick.rmse / baseline.rmse).toFixed(3)}x baseline)`,
  )
} else {
  console.log('PICK: none — no config satisfied even the relaxed criteria; inspect the table.')
}
