import type { AxisId, Bill, VoteRecord } from '../types'
import { AXIS_IDS } from '../types'
import { certainty, mean, uniform, update } from './posterior'
import { selectNext, type Posteriors } from './adaptive'

export interface SessionState {
  posteriors: Posteriors
  history: VoteRecord[]
  servedIds: string[]
  current: Bill | null
  target: number
  finished: boolean
}

function emptyPosteriors(): Posteriors {
  const p = {} as Posteriors
  for (const ax of AXIS_IDS) p[ax] = uniform()
  return p
}

/** Begin a session: uniform priors, first bill chosen adaptively. */
export function createSession(bills: Bill[], target = 25): SessionState {
  const posteriors = emptyPosteriors()
  const first = selectNext(posteriors, bills, new Set())
  return {
    posteriors,
    history: [],
    servedIds: first ? [first.id] : [],
    current: first,
    target: Math.min(target, bills.length),
    finished: first === null,
  }
}

/**
 * Rebuild a session from a saved sequence of votes (billId + ratified). Votes are
 * applied by id, so deck changes are non-fatal: a vote whose bill no longer exists
 * is skipped, and newly-added bills simply become available to continue with.
 */
export function rebuildSession(
  bills: Bill[],
  target: number,
  votes: { billId: string; ratified: boolean }[],
): SessionState {
  const posteriors = emptyPosteriors()
  const history: VoteRecord[] = []
  const servedIds: string[] = []
  const byId = new Map(bills.map((b) => [b.id, b]))
  const cappedTarget = Math.min(target, bills.length)

  for (const v of votes) {
    const bill = byId.get(v.billId)
    if (!bill) continue
    const pre: Record<string, { m: number; c: number }> = {}
    for (const l of bill.loadings) pre[l.axis] = { m: mean(posteriors[l.axis]), c: certainty(posteriors[l.axis]) }
    for (const l of bill.loadings) posteriors[l.axis] = update(posteriors[l.axis], l, v.ratified)
    const deltas: { axis: typeof bill.loadings[number]['axis']; delta: number }[] = []
    let certaintySum = 0
    for (const l of bill.loadings) {
      const postM = mean(posteriors[l.axis])
      const postC = certainty(posteriors[l.axis])
      deltas.push({ axis: l.axis, delta: Math.round((postM - pre[l.axis].m) * 100) })
      certaintySum += postC - pre[l.axis].c
    }
    history.push({
      billId: bill.id,
      billNumber: bill.number,
      title: bill.title,
      ratified: v.ratified,
      deltas,
      certaintyDelta: Math.round((certaintySum / (bill.loadings.length || 1)) * 100),
    })
    servedIds.push(bill.id)
  }

  let current: Bill | null = null
  let finished = false
  if (history.length >= cappedTarget) {
    finished = true
  } else {
    current = selectNext(posteriors, bills, new Set(servedIds))
    if (!current) finished = true
    else servedIds.push(current.id)
  }
  return { posteriors, history, servedIds, current, target: cappedTarget, finished }
}

/** Apply a swipe to the current bill and advance the deck. Returns NEW state. */
export function applyVote(state: SessionState, bills: Bill[], ratified: boolean): SessionState {
  const bill = state.current
  if (!bill) return state

  // snapshot pre-vote means + certainty for the affected axes
  const pre: Record<string, { m: number; c: number }> = {}
  for (const l of bill.loadings) {
    pre[l.axis] = { m: mean(state.posteriors[l.axis]), c: certainty(state.posteriors[l.axis]) }
  }

  // update posteriors for each loading on its own axis
  const posteriors: Posteriors = { ...state.posteriors }
  for (const l of bill.loadings) {
    posteriors[l.axis] = update(posteriors[l.axis], l, ratified)
  }

  // record deltas
  const deltas: { axis: AxisId; delta: number }[] = []
  let certaintySum = 0
  for (const l of bill.loadings) {
    const postM = mean(posteriors[l.axis])
    const postC = certainty(posteriors[l.axis])
    deltas.push({ axis: l.axis, delta: Math.round((postM - pre[l.axis].m) * 100) })
    certaintySum += postC - pre[l.axis].c
  }

  const record: VoteRecord = {
    billId: bill.id,
    billNumber: bill.number,
    title: bill.title,
    ratified,
    deltas,
    certaintyDelta: Math.round((certaintySum / (bill.loadings.length || 1)) * 100),
  }

  const history = [...state.history, record]
  const servedIds = state.servedIds.slice()

  let current: Bill | null = null
  let finished = false
  if (history.length >= state.target) {
    finished = true
  } else {
    current = selectNext(posteriors, bills, new Set(servedIds))
    if (!current) finished = true
    else servedIds.push(current.id)
  }

  return { posteriors, history, servedIds, current, target: state.target, finished }
}
