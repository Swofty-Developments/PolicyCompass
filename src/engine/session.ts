import type { AxisId, Bill, Conviction, VoteRecord, VoteVerdict } from '../types'
import { AXIS_IDS } from '../types'
import { certainty, mean, uniform, update } from './posterior'
import { selectNext, selectProbe, type Posteriors } from './adaptive'

// Every Nth card is a "wildcard probe" (a bold stretch), so even a moderate run
// meets the extremes and gets tested on whether they'd make a radical swing.
const PROBE_EVERY = 6

/** Likelihood tempering exponent for a reluctant (soft) swipe. */
export const RELUCTANT_WEIGHT = 0.55

export interface VoteInput {
  verdict: VoteVerdict
  conviction?: Conviction
}

/** Docket sizing: the session closes early once every axis is read confidently. */
export interface SessionConfig {
  /** Fewest bills before the docket may close */
  min: number
  /** Hard cap on bills served */
  max: number
  /** Per-axis posterior certainty at which the floor is satisfied */
  certaintyTarget: number
}

export const DEFAULT_CONFIG: SessionConfig = { min: 10, max: 18, certaintyTarget: 0.2 }

function pickNext(posteriors: Posteriors, bills: Bill[], served: Set<string>, position: number): Bill | null {
  if (position >= PROBE_EVERY && position % PROBE_EVERY === 0) {
    return selectProbe(posteriors, bills, served) ?? selectNext(posteriors, bills, served)
  }
  return selectNext(posteriors, bills, served)
}

export interface SessionState {
  posteriors: Posteriors
  history: VoteRecord[]
  servedIds: string[]
  current: Bill | null
  config: SessionConfig
  finished: boolean
}

function emptyPosteriors(): Posteriors {
  const p = {} as Posteriors
  for (const ax of AXIS_IDS) p[ax] = uniform()
  return p
}

function capConfig(config: SessionConfig, deckSize: number): SessionConfig {
  const max = Math.min(config.max, deckSize)
  return { min: Math.min(config.min, max), max, certaintyTarget: config.certaintyTarget }
}

/** The docket closes at the cap, or as soon as (past the floor) every axis is certain enough. */
export function docketSatisfied(posteriors: Posteriors, served: number, config: SessionConfig): boolean {
  if (served >= config.max) return true
  if (served < config.min) return false
  return AXIS_IDS.every((ax) => certainty(posteriors[ax]) >= config.certaintyTarget)
}

/** How the evidence weight of a vote is derived. Abstains carry none. */
function voteWeight(input: VoteInput): number {
  return input.conviction === 'reluctant' ? RELUCTANT_WEIGHT : 1
}

/** Apply one vote to (a copy of) the posteriors and build its history record. */
function recordVote(posteriors: Posteriors, bill: Bill, input: VoteInput): VoteRecord {
  if (input.verdict === 'abstain') {
    return {
      billId: bill.id,
      billNumber: bill.number,
      title: bill.title,
      verdict: 'abstain',
      deltas: [],
      certaintyDelta: 0,
    }
  }

  const ratified = input.verdict === 'ratify'
  const weight = voteWeight(input)
  const pre: Record<string, { m: number; c: number }> = {}
  for (const l of bill.loadings) {
    pre[l.axis] = { m: mean(posteriors[l.axis]), c: certainty(posteriors[l.axis]) }
  }
  for (const l of bill.loadings) {
    posteriors[l.axis] = update(posteriors[l.axis], l, ratified, weight)
  }

  const deltas: { axis: AxisId; delta: number }[] = []
  let certaintySum = 0
  for (const l of bill.loadings) {
    const postM = mean(posteriors[l.axis])
    const postC = certainty(posteriors[l.axis])
    deltas.push({ axis: l.axis, delta: Math.round((postM - pre[l.axis].m) * 100) })
    certaintySum += postC - pre[l.axis].c
  }

  return {
    billId: bill.id,
    billNumber: bill.number,
    title: bill.title,
    verdict: input.verdict,
    conviction: input.conviction ?? 'firm',
    deltas,
    certaintyDelta: Math.round((certaintySum / (bill.loadings.length || 1)) * 100),
  }
}

/** Begin a session: uniform priors, first bill chosen adaptively. */
export function createSession(bills: Bill[], config = DEFAULT_CONFIG): SessionState {
  const posteriors = emptyPosteriors()
  const first = selectNext(posteriors, bills, new Set())
  return {
    posteriors,
    history: [],
    servedIds: first ? [first.id] : [],
    current: first,
    config: capConfig(config, bills.length),
    finished: first === null,
  }
}

/**
 * Rebuild a session from a saved sequence of votes. Votes are applied by id, so
 * deck changes are non-fatal: a vote whose bill no longer exists is skipped, and
 * newly-added bills simply become available to continue with.
 */
export function rebuildSession(
  bills: Bill[],
  votes: (VoteInput & { billId: string })[],
  config = DEFAULT_CONFIG,
): SessionState {
  const posteriors = emptyPosteriors()
  const history: VoteRecord[] = []
  const servedIds: string[] = []
  const byId = new Map(bills.map((b) => [b.id, b]))
  const cfg = capConfig(config, bills.length)

  for (const v of votes) {
    const bill = byId.get(v.billId)
    if (!bill) continue
    history.push(recordVote(posteriors, bill, v))
    servedIds.push(bill.id)
  }

  let current: Bill | null = null
  let finished = false
  if (docketSatisfied(posteriors, history.length, cfg)) {
    finished = true
  } else {
    current = pickNext(posteriors, bills, new Set(servedIds), history.length + 1)
    if (!current) finished = true
    else servedIds.push(current.id)
  }
  return { posteriors, history, servedIds, current, config: cfg, finished }
}

/** Apply a swipe to the current bill and advance the deck. Returns NEW state. */
export function applyVote(state: SessionState, bills: Bill[], input: VoteInput): SessionState {
  const bill = state.current
  if (!bill) return state

  const posteriors: Posteriors = { ...state.posteriors }
  const record = recordVote(posteriors, bill, input)
  const history = [...state.history, record]
  const servedIds = state.servedIds.slice()

  let current: Bill | null = null
  let finished = false
  if (docketSatisfied(posteriors, history.length, state.config)) {
    finished = true
  } else {
    current = pickNext(posteriors, bills, new Set(servedIds), history.length + 1)
    if (!current) finished = true
    else servedIds.push(current.id)
  }

  return { posteriors, history, servedIds, current, config: state.config, finished }
}
