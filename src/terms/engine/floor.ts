import type { AxisVector, Bill } from '../../types'
import type {
  Bloc,
  BlocVotes,
  DivisionProjection,
  NegotiationOffer,
  Scenario,
  TermsState,
  VoteChoice,
} from '../types'
import { blocStance, stanceSide } from './alignment'
import { pPlayerRatify } from './conviction'
import { roll } from './rng'

export const KNIFE_EDGE_MARGIN = 2
export const CONTESTED_MARGIN = 8
export const OFFERS_PER_TERM = 2
export const WHIP_NOTES_PER_TERM = 2
export const EMERGENCY_WHIPS_PER_TERM = 1
/** Extra docket positions allowed past a promise's target bill (systemic inserts:
 *  ultimatum, fiscal/unrest telegrams, scandals and spawn pages each consume one). */
export const PROMISE_DEADLINE_SLACK = 4

export interface SeatProjection {
  ayes: number
  noes: number
  hesitant: number
  /** Expected margin with hesitants at their stance weight, player excluded */
  expMargin: number
  knifeEdge: boolean
  contested: boolean
  byBloc: { blocId: string; seats: number; stance: number; side: 'for' | 'against' | 'hesitant' }[]
}

/** Stance-side projection over arbitrary seat blocks (shared with the audit). */
export function projectSeats(
  entries: { blocId: string; vector: AxisVector; seats: number }[],
  bill: Bill,
): SeatProjection {
  const byBloc = entries.map((e) => {
    const stance = blocStance(e.vector, bill)
    return { blocId: e.blocId, seats: e.seats, stance, side: stanceSide(stance) }
  })
  let ayes = 0
  let noes = 0
  let hesitant = 0
  let expAyes = 0
  let total = 0
  for (const b of byBloc) {
    total += b.seats
    if (b.side === 'for') {
      ayes += b.seats
      expAyes += b.seats
    } else if (b.side === 'against') noes += b.seats
    else {
      hesitant += b.seats
      expAyes += b.seats * b.stance
    }
  }
  const expMargin = Math.abs(expAyes - (total - expAyes))
  return {
    ayes,
    noes,
    hesitant,
    expMargin,
    knifeEdge: expMargin <= KNIFE_EDGE_MARGIN,
    contested: expMargin <= CONTESTED_MARGIN,
    byBloc,
  }
}

/** The seats each active bloc fields on the floor (party fields seats − 1). */
export function fieldedBlocs(
  state: TermsState,
  scenario: Scenario,
): { bloc: Bloc; blocId: string; vector: AxisVector; seats: number }[] {
  const out: { bloc: Bloc; blocId: string; vector: AxisVector; seats: number }[] = []
  for (const bs of state.blocs) {
    if (!bs.active) continue
    const bloc = scenario.blocs.find((b) => b.id === bs.id)
    if (!bloc) continue
    const seats = Math.max(0, bs.seats - (bs.id === state.partyId ? 1 : 0))
    out.push({ bloc, blocId: bs.id, vector: bloc.vector, seats })
  }
  return out
}

function promiseSlots(state: TermsState, scenario: Scenario): number {
  const base = state.seatType === 'marginal' ? 4 : 3
  const reserved = state.mandates.some(
    (id) => scenario.mandates.find((m) => m.id === id)?.hooks.reservesPromiseSlot,
  )
  return base - (reserved ? 1 : 0)
}

/**
 * Pick the negotiation offer for this division, if any. Budget: 2/term.
 * Backbenchers are approached only on knife-edges; the Wilderness never is.
 * The demand is an upcoming curated bill where the bloc's stance opposes the
 * player's current posterior lean — they ask for what you would not give.
 */
function selectOffer(
  state: TermsState,
  scenario: Scenario,
  bills: Bill[],
  bill: Bill,
  proj: SeatProjection,
): NegotiationOffer | null {
  if (state.offersThisTerm >= OFFERS_PER_TERM) return null
  // The Wilderness bars negotiation; a promoted member carries the portfolio in name only.
  if (state.portfolio === 'wilderness' && state.office === 'backbencher') return null
  if (state.office === 'backbencher' && !proj.knifeEdge) return null
  if (state.office === 'minister' && !proj.contested) return null
  if (state.promises.length >= promiseSlots(state, scenario)) return null

  const byId = new Map(bills.map((b) => [b.id, b]))
  const playerLeansRatify = pPlayerRatify(state.posteriors, bill) >= 0.5

  // Candidate blocs: active, not the player's party, no grudge, no live promise,
  // and not already voting the player's way.
  const candidates = proj.byBloc
    .filter((pb) => {
      if (pb.blocId === state.partyId || pb.seats === 0) return false
      const bs = state.blocs.find((b) => b.id === pb.blocId)
      if (!bs || bs.grudge) return false
      if (state.promises.some((p) => p.blocId === pb.blocId)) return false
      return playerLeansRatify ? pb.side !== 'for' : pb.side !== 'against'
    })
    .sort((a, b) => b.seats - a.seats)

  const act = scenario.acts[state.actId]
  if (!act) return null

  for (const cand of candidates) {
    const bloc = scenario.blocs.find((b) => b.id === cand.blocId)
    if (!bloc) continue
    // The bloc's steepest ask: the demand the player is least likely to grant.
    let best: { billId: string; title: string; ratify: boolean; pAnyway: number; deadline: number } | null = null
    for (let i = state.slotIndex + 1; i < act.slots.length; i++) {
      const slot = act.slots[i]
      if (slot.kind !== 'bill') continue
      const target = byId.get(slot.billId)
      if (!target || state.servedBillIds.includes(target.id)) continue
      // A bill already under promise cannot be demanded twice: fulfilling one
      // bloc's demand must not count as breaking another's identical one.
      if (state.promises.some((p) => p.billId === target.id)) continue
      const st = blocStance(bloc.vector, target)
      const side = stanceSide(st)
      if (side === 'hesitant') continue
      const demandRatify = side === 'for'
      const pr = pPlayerRatify(state.posteriors, target)
      const pAnyway = demandRatify ? pr : 1 - pr
      if (pAnyway >= 0.5) continue // they only ask for what you would not otherwise give
      if (!best || pAnyway < best.pAnyway) {
        best = {
          billId: target.id,
          title: target.title,
          ratify: demandRatify,
          pAnyway,
          deadline: state.position + (i - state.slotIndex) + PROMISE_DEADLINE_SLACK,
        }
      }
    }
    if (!best) continue
    const verb = best.ratify ? 'ratify' : 'strike down'
    return {
      blocId: bloc.id,
      seats: cand.seats,
      promise: {
        blocId: bloc.id,
        kind: 'vote',
        billId: best.billId,
        ratify: best.ratify,
        label: `Vote to ${verb} “${best.title}”`,
        deadline: best.deadline,
        improbability: best.pAnyway,
      },
      text: `${bloc.short} will put ${cand.seats} seats behind you on this division — for your word to ${verb} “${best.title}”.`,
    }
  }
  return null
}

/** Pre-vote projection: seat counts, knife-edge flag, and any negotiation offer. */
export function projectDivision(
  state: TermsState,
  scenario: Scenario,
  bills: Bill[],
  bill: Bill,
): DivisionProjection {
  const proj = projectSeats(fieldedBlocs(state, scenario), bill)
  return {
    ayes: proj.ayes,
    noes: proj.noes,
    hesitant: proj.hesitant,
    knifeEdge: proj.knifeEdge,
    offer: selectOffer(state, scenario, bills, bill, proj),
  }
}

export interface FloorResult {
  ayes: number
  noes: number
  passed: boolean
  castingVote: boolean
  byBloc: BlocVotes[]
}

/**
 * Resolve the division around the player. Hesitant seats break individually by
 * stateless seeded roll; a bloc swung by negotiation votes wholesale with the
 * player; an Emergency Whip forces the party's hesitants to the player's side.
 */
export function resolveDivision(
  state: TermsState,
  scenario: Scenario,
  bill: Bill,
  choice: VoteChoice,
  opts: { swungBlocId?: string | null; emergencyWhip?: boolean } = {},
): FloorResult {
  const playerAye = choice === 'ratify'
  const byBloc: BlocVotes[] = []
  let ayes = 0
  let noes = 0

  for (const f of fieldedBlocs(state, scenario)) {
    const stance = blocStance(f.vector, bill)
    const side = stanceSide(stance)
    let blocAyes = 0
    if (choice !== 'abstain' && opts.swungBlocId === f.blocId) {
      blocAyes = playerAye ? f.seats : 0
    } else if (side === 'for') blocAyes = f.seats
    else if (side === 'against') blocAyes = 0
    else if (choice !== 'abstain' && opts.emergencyWhip && f.blocId === state.partyId) {
      blocAyes = playerAye ? f.seats : 0
    } else {
      for (let i = 0; i < f.seats; i++) {
        if (roll(state.seed, `hesitant:${state.position}:${f.blocId}:${i}`) < stance) blocAyes++
      }
    }
    byBloc.push({ blocId: f.blocId, ayes: blocAyes, noes: f.seats - blocAyes })
    ayes += blocAyes
    noes += f.seats - blocAyes
  }

  const houseAyes = ayes + (choice === 'ratify' ? 1 : 0)
  const houseNoes = noes + (choice === 'strike' ? 1 : 0)
  const passed = houseAyes > houseNoes
  const passedWithoutPlayer = ayes > noes
  return {
    ayes: houseAyes,
    noes: houseNoes,
    passed,
    castingVote: choice !== 'abstain' && passed !== passedWithoutPlayer,
    byBloc,
  }
}
