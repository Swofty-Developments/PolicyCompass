import type { Bill } from '../../types'
import { certainty, mean, pRatify } from '../../engine/posterior'
import type { Posteriors, VoteChoice } from '../types'

// Scored against the PRE-vote posterior snapshot so the vote cannot launder
// itself (docs/TERMS.md § State model — Conviction).
export const WEATHERVANE_P = 0.35
/** "In line" mirrors the hit threshold: comfortably on your own side. */
export const RECOVERY_P = 0.65
export const RECOVERY_CERTAINTY = 0.55
export const RECOVERY_DELTA = 2

export interface ConvictionScore {
  delta: number
  weathervane: boolean
  /** P(this vote | pre-vote posterior mean) on the primary axis */
  pVote: number
  certainty: number
}

/** Score a vote against the pre-vote posterior. Abstain never moves the meter. */
export function scoreVote(pre: Posteriors, bill: Bill, choice: VoteChoice): ConvictionScore {
  const l = bill.loadings[0]
  if (!l || choice === 'abstain') return { delta: 0, weathervane: false, pVote: 0.5, certainty: 0 }
  const m = mean(pre[l.axis])
  const c = certainty(pre[l.axis])
  const p = pRatify(m, l)
  const pVote = choice === 'ratify' ? p : 1 - p
  if (pVote < WEATHERVANE_P) {
    return { delta: -Math.round(9 * Math.max(c, 0.4)), weathervane: true, pVote, certainty: c }
  }
  if (pVote >= RECOVERY_P && c > RECOVERY_CERTAINTY) {
    return { delta: RECOVERY_DELTA, weathervane: false, pVote, certainty: c }
  }
  return { delta: 0, weathervane: false, pVote, certainty: c }
}

/** P(the player would ratify | current posterior) on the bill's primary axis. */
export function pPlayerRatify(posteriors: Posteriors, bill: Bill): number {
  const l = bill.loadings[0]
  if (!l) return 0.5
  return pRatify(mean(posteriors[l.axis]), l)
}
