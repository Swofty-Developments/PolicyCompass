import type { Bloc, BlocState, ElectionNight, Scenario, TermsState } from '../types'
import { vectorAdjacency, zeitgeistAlignment } from './alignment'

export const BLOC_SEATS = 99
export const SWING_ALIGNMENT = 12
export const SWING_FERVOUR = 2
export const SITTING_SHIFT = 4
export const SAFE_MARGIN = 8
export const MARGINAL_MARGIN = 2
export const WIN_TRUST = 6
export const TERM_TRUST_DECAY = 4
export const FERVOUR_DECAY = 0.5
export const CONVICTION_SWING_PENALTY = 3

const round1 = (x: number): number => Math.round(x * 10) / 10

/** Hare-quota largest-remainder apportionment of `total` seats over weights. */
export function largestRemainder(weights: number[], total: number): number[] {
  const sum = weights.reduce((s, w) => s + Math.max(0, w), 0)
  if (sum <= 0) {
    const each = Math.floor(total / Math.max(1, weights.length))
    const out = weights.map(() => each)
    let left = total - each * weights.length
    for (let i = 0; left > 0; i = (i + 1) % weights.length) {
      out[i]++
      left--
    }
    return out
  }
  const quotas = weights.map((w) => (Math.max(0, w) * total) / sum)
  const out = quotas.map((q) => Math.floor(q))
  let left = total - out.reduce((s, x) => s + x, 0)
  const order = quotas
    .map((q, i) => ({ i, frac: q - Math.floor(q) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (let k = 0; left > 0 && k < order.length; k++, left--) out[order[k].i]++
  return out
}

/**
 * National swing per bloc: 12·alignment(zeitgeist) − 2·fervour + treasuryTerm,
 * where treasuryTerm is the ±4 verdict on the term's treasury record, landing
 * on blocs aligned with the sitting arrangement (the player's party and its
 * ideological neighbours). A near-flat record swings nothing.
 */
export function swingScores(state: TermsState, scenario: Scenario): Map<string, number> {
  const party = scenario.blocs.find((b) => b.id === state.partyId)
  const tStart =
    typeof state.flags['treasuryAtTermStart'] === 'number'
      ? (state.flags['treasuryAtTermStart'] as number)
      : 50
  const drift = state.treasury - tStart
  const treasuryTerm = drift > 2 ? SITTING_SHIFT : drift < -2 ? -SITTING_SHIFT : 0
  const scores = new Map<string, number>()
  for (const bs of state.blocs) {
    if (!bs.active) continue
    const bloc = scenario.blocs.find((b) => b.id === bs.id)
    if (!bloc) continue
    let score = SWING_ALIGNMENT * zeitgeistAlignment(state.zeitgeist, bloc.vector) - SWING_FERVOUR * bs.fervour
    const sitting =
      bs.id === state.partyId || (party ? vectorAdjacency(bloc.vector, party.vector) > 0.35 : false)
    if (sitting) score += treasuryTerm
    scores.set(bs.id, score)
  }
  return scores
}

/**
 * Zero-sum largest-remainder reapportionment of the 99 bloc seats over
 * (seats + score − mean score). The player's own seat is not in play.
 */
export function reapportion(
  state: TermsState,
  scenario: Scenario,
): { blocId: string; before: number; after: number }[] {
  const scores = swingScores(state, scenario)
  const active = state.blocs.filter((b) => b.active)
  const meanScore = active.reduce((s, b) => s + (scores.get(b.id) ?? 0), 0) / Math.max(1, active.length)
  const weights = active.map((b) => {
    const fielded = b.seats - (b.id === state.partyId ? 1 : 0)
    return Math.max(0, fielded + (scores.get(b.id) ?? 0) - meanScore)
  })
  const seats = largestRemainder(weights, BLOC_SEATS)
  return active.map((b, i) => ({
    blocId: b.id,
    before: b.seats,
    after: seats[i] + (b.id === state.partyId ? 1 : 0),
  }))
}

/** The returning-officer's count: every term itemised in words + small figures. */
export function personalSeat(
  state: TermsState,
  scenario: Scenario,
  swings: { blocId: string; before: number; after: number }[],
): ElectionNight['seat'] {
  const partySwing = swings.find((s) => s.blocId === state.partyId)
  const partyShort = scenario.blocs.find((b) => b.id === state.partyId)?.short ?? 'the party'
  const partySwingPoints = partySwing ? (partySwing.after - partySwing.before) / 2 : 0
  const breakdown: { label: string; points: number }[] = [
    {
      label:
        partySwingPoints >= 0
          ? `${partyShort}'s national swing carried you`
          : `${partyShort}'s national swing ran against you`,
      points: round1(partySwingPoints),
    },
    { label: 'Your standing with the country', points: round1((state.trust - 50) / 8) },
  ]
  if (state.conviction < 40) {
    breakdown.push({ label: 'A reputation for turning with the wind', points: -CONVICTION_SWING_PENALTY })
  }
  if (state.whipDefiances > 0) {
    breakdown.push({
      label:
        state.whipDefiances === 1
          ? 'One defiance of the whip this term'
          : `${state.whipDefiances} defiances of the whip this term`,
      points: -state.whipDefiances,
    })
  }
  const margin = state.seatType === 'safe' ? SAFE_MARGIN : MARGINAL_MARGIN
  const total = round1(breakdown.reduce((s, b) => s + b.points, 0))
  return { held: total + margin > 0, breakdown, total, margin }
}

/** Compute election night. Pure: seat changes are applied by the session. */
export function runElection(state: TermsState, scenario: Scenario): ElectionNight {
  const swings = reapportion(state, scenario).sort((a, b) => b.before - a.before)
  const seat = personalSeat(state, scenario, swings)
  return { swings, seat, trustDelta: seat.held ? WIN_TRUST - TERM_TRUST_DECAY : 0 }
}

/**
 * A radical bloc's seed seats, taken from the sitting blocs by largest
 * remainder in proportion to ideological adjacency. Mutates the BlocStates.
 */
export function takeSpawnSeats(
  blocs: BlocState[],
  scenario: Scenario,
  emergent: Bloc,
  partyId: string,
): { blocId: string; taken: number }[] {
  const seed = emergent.emergent?.seedSeats ?? 12
  // Spec: seed seats come from the founding blocs only — a rising radical
  // flank must not cannibalise the opposite flank's seats.
  const founding = new Set(scenario.blocs.filter((b) => !b.emergent).map((b) => b.id))
  const donors = blocs.filter((b) => b.active && founding.has(b.id) && b.seats > 0)
  const weights = donors.map((d) => {
    const vec = scenario.blocs.find((b) => b.id === d.id)?.vector
    return vec ? Math.max(0.05, vectorAdjacency(vec, emergent.vector)) : 0.05
  })
  const wanted = largestRemainder(weights, seed)
  const taken: { blocId: string; taken: number }[] = []
  let shortfall = 0
  donors.forEach((d, i) => {
    // Never take the player's own seat.
    const available = Math.max(0, d.seats - (d.id === partyId ? 1 : 0))
    const t = Math.min(wanted[i], available)
    shortfall += wanted[i] - t
    d.seats -= t
    taken.push({ blocId: d.id, taken: t })
  })
  if (shortfall > 0) {
    const order = donors
      .map((d, i) => ({ d, w: weights[i] }))
      .sort((a, b) => b.w - a.w)
    for (const { d } of order) {
      while (shortfall > 0 && d.seats - (d.id === partyId ? 1 : 0) > 0) {
        d.seats--
        shortfall--
        const row = taken.find((t) => t.blocId === d.id)
        if (row) row.taken++
      }
    }
  }
  const spawned = blocs.find((b) => b.id === emergent.id)
  if (spawned) {
    spawned.active = true
    spawned.seats = taken.reduce((s, t) => s + t.taken, 0)
  }
  return taken
}
