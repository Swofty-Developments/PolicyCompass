import type { AxisId, Bill } from '../../types'
import { AXIS_IDS } from '../../types'
import { BILLS_VERSION } from '../../data/version'
import { fisherInfo, mean, std, uniform, update } from '../../engine/posterior'
import type {
  Act,
  ActivePromise,
  DivisionResult,
  EndingStamp,
  Posteriors,
  RecessSettlement,
  SavedTermsRun,
  Scenario,
  TermsAction,
  TermsState,
  TermsSetup,
  VoteChoice,
  WhipDirective,
} from '../types'
import { blocStance } from './alignment'
import { scoreVote } from './conviction'
import {
  addConviction,
  addFervour,
  addRelations,
  addTreasury,
  addTrust,
  applyEffectSet,
  finishFx,
  moveZeitgeist,
  newFx,
  type Fx,
} from './effects'
import {
  detonates,
  findEvent,
  passesGates,
  resolveGamble,
  spawnDue,
  systemicDue,
  termOf,
  ULTIMATUM_RECOVER,
} from './events'
import {
  CONTESTED_MARGIN,
  EMERGENCY_WHIPS_PER_TERM,
  fieldedBlocs,
  projectDivision,
  projectSeats,
  resolveDivision,
  WHIP_NOTES_PER_TERM,
} from './floor'
import { FERVOUR_DECAY, runElection, takeSpawnSeats, TERM_TRUST_DECAY, WIN_TRUST } from './election'
import { roll } from './rng'

/** Mirrors lib/storage's TERMS_SCHEMA_VERSION so the engine has no storage dep. */
const SCHEMA_VERSION = 2

const START_TRUST = 55
const START_CONVICTION = 70
const START_TREASURY = 50
const PARTY_START_RELATIONS = 20
const ZEITGEIST_SHIFT = 0.15
const FILL_TREASURY_SCALE = 8
const PROMISE_BREAK_TRUST = -14
const PROMISE_BREAK_RELATIONS = -30
const EMERGENCY_WHIP_TRUST = -4
const PROMISE_KEEP_RELATIONS = 12
const BARGAIN_RELATIONS = 6
const MOOD_TRUST_CAP = 3
const EXPEL_RELATIONS = -60

const clampNum = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))

const billsById = (bills: Bill[]): Map<string, Bill> => new Map(bills.map((b) => [b.id, b]))

const blocShort = (scenario: Scenario, blocId: string): string =>
  scenario.blocs.find((b) => b.id === blocId)?.short ?? blocId

/** Every curated bill id across every act and branch variant. */
export function curatedBillIds(scenario: Scenario): Set<string> {
  const out = new Set<string>()
  for (const act of Object.values(scenario.acts)) {
    for (const slot of act.slots) if (slot.kind === 'bill') out.add(slot.billId)
  }
  return out
}

/** Adaptive fill: Fisher-information scoring, seeded sample of the top 3. */
function selectFill(s: TermsState, scenario: Scenario, bills: Bill[], axis?: AxisId): Bill | null {
  const excluded = curatedBillIds(scenario)
  for (const id of s.servedBillIds) excluded.add(id)
  let pool = bills.filter((b) => !excluded.has(b.id))
  if (axis) {
    const onAxis = pool.filter((b) => b.loadings[0]?.axis === axis)
    if (onAxis.length) pool = onAxis
  }
  if (!pool.length) return null
  const axisMean = {} as Record<AxisId, number>
  const axisStd = {} as Record<AxisId, number>
  for (const ax of AXIS_IDS) {
    axisMean[ax] = mean(s.posteriors[ax])
    axisStd[ax] = std(s.posteriors[ax])
  }
  const scored = pool
    .map((b) => ({
      b,
      score: b.loadings.reduce((sum, l) => sum + fisherInfo(axisMean[l.axis], l) * (0.15 + axisStd[l.axis]), 0),
    }))
    .sort((a, b) => b.score - a.score || a.b.id.localeCompare(b.b.id))
  const top = scored.slice(0, 3)
  return top[Math.min(top.length - 1, Math.floor(roll(s.seed, 'fill:' + (s.position + 1)) * top.length))].b
}

function endRun(s: TermsState, stamp: EndingStamp, cause: string, victory: boolean): void {
  if (s.ended) return
  s.ended = { stamp, cause, victory, cutShort: s.termsServed === 0 }
}

function checkExpulsion(s: TermsState, scenario: Scenario): void {
  const limit = s.conviction >= 70 ? 4 : 3
  const party = s.blocs.find((b) => b.id === s.partyId)
  if (s.whipDefiances >= limit) {
    endRun(s, 'EXPELLED', `${s.whipDefiances} defiances of the whip in a single term — the expulsion vote carried`, false)
  } else if (party && party.relations <= EXPEL_RELATIONS) {
    endRun(s, 'EXPELLED', `${blocShort(scenario, s.partyId)} would no longer have you — the expulsion vote carried`, false)
  }
}

function checkRevolution(s: TermsState, scenario: Scenario): void {
  for (const bs of s.blocs) {
    if (!bs.active) continue
    const bloc = scenario.blocs.find((b) => b.id === bs.id)
    if (!bloc?.emergent) continue
    const z = Math.abs(s.zeitgeist[bloc.emergent.axis] ?? 0)
    if (bs.fervour >= 3 && bs.seats > 20 && z >= 0.4) {
      endRun(s, 'REVOLUTION', `${bloc.name} took to the streets — the Republic did not keep its House`, false)
    }
  }
}

/** Authored zeitgeist movers and passed bills can both cross a spawn threshold. */
function checkSpawn(fx: Fx, scenario: Scenario): void {
  const s = fx.s
  const sp = spawnDue(s, scenario)
  if (!sp?.emergent) return
  takeSpawnSeats(s.blocs, scenario, sp, s.partyId)
  s.scheduled.unshift({ eventId: sp.emergent.spawnEventId, at: s.position })
  fx.lines.push(`${sp.name} declares itself — the front pages will have it by morning.`)
}

function settlePromise(fx: Fx, scenario: Scenario, p: ActivePromise, kept: boolean): void {
  const s = fx.s
  s.promises = s.promises.filter((x) => x.id !== p.id)
  const short = blocShort(scenario, p.blocId)
  if (kept) {
    addTrust(fx, Math.max(1, Math.round(8 * (1 - p.improbability))), `a promise kept to ${short}`)
    addRelations(fx, scenario, p.blocId, PROMISE_KEEP_RELATIONS, `a promise kept to ${short}`, 'promise')
    s.flags['promisesKept'] = (Number(s.flags['promisesKept']) || 0) + 1
    s.flags['promise-kept'] = true
  } else {
    addTrust(fx, PROMISE_BREAK_TRUST, `a promise broken to ${short}`)
    addRelations(fx, scenario, p.blocId, PROMISE_BREAK_RELATIONS, `a promise broken to ${short}`, 'promise')
    addFervour(fx, scenario, p.blocId, 1, `the Member's betrayal`)
    const bloc = s.blocs.find((b) => b.id === p.blocId)
    if (bloc) bloc.grudge = true
    s.flags['promisesBroken'] = (Number(s.flags['promisesBroken']) || 0) + 1
    s.flags['promise-broken'] = true
  }
}

function applyMandateDivisionHooks(fx: Fx, scenario: Scenario, bill: Bill, choice: VoteChoice): void {
  if (choice === 'abstain') return
  const l = bill.loadings[0]
  if (!l) return
  const votedPole = choice === 'ratify' ? l.direction : l.direction === 'right' ? 'left' : 'right'
  for (const id of fx.s.mandates) {
    const m = scenario.mandates.find((x) => x.id === id)
    if (!m) continue
    const db = m.hooks.divisionBonus
    if (db && db.axis === l.axis && db.pole === votedPole) {
      addRelations(fx, scenario, db.blocId, db.relations, m.title, 'division')
    }
    const cl = m.hooks.crossLimit
    if (cl && cl.axis === l.axis && cl.pole !== votedPole && !fx.s.flags['crossed:' + id]) {
      const key = 'cross:' + id
      const n = (Number(fx.s.flags[key]) || 0) + 1
      fx.s.flags[key] = n
      if (n >= cl.limit) {
        fx.s.flags['crossed:' + id] = true
        addRelations(fx, scenario, cl.blocId, -20, `${m.title} — crossed once too often`, 'division')
        addFervour(fx, scenario, cl.blocId, 0.5, `${m.title} betrayed`)
      }
    }
  }
}

/** The whip directive live on the current beat, if its note actually fired. */
function activeWhip(s: TermsState, scenario: Scenario): WhipDirective | undefined {
  if (!s.flags['whipfired@' + s.position]) return undefined
  const slot = scenario.acts[s.actId]?.slots[s.slotIndex]
  return slot && slot.kind === 'bill' ? slot.whip : undefined
}

function enterBillStage(s: TermsState, scenario: Scenario, bills: Bill[], bill: Bill): TermsState {
  const projection = projectDivision(s, scenario, bills, bill)
  const whip = activeWhip(s, scenario)
  if (projection.offer) {
    s.flags['seen:negotiation'] = true
    s.stage = { kind: 'negotiation', billId: bill.id, offer: projection.offer }
    return s
  }
  s.stage = { kind: 'bill', billId: bill.id, whip, projection }
  return s
}

/** Obituary-cause clause naming the recess breaks (obituary paths skip election night). */
function recessClause(scenario: Scenario, broken: RecessSettlement['broken']): string {
  const shorts = [...new Set(broken.map((b) => blocShort(scenario, b.blocId)))]
  return `${broken.length === 1 ? 'a promise' : 'promises'} to ${shorts.join(' and ')} died with the term, unkept`
}

function endOfTerm(s: TermsState, scenario: Scenario, act: Act): TermsState {
  // Promise breaks route through the tagged-delta Fx like any division, and the
  // settlement is surfaced (election stage or obituary cause) — never silent.
  let recess: RecessSettlement | undefined
  if (s.promises.length) {
    const prev = structuredClone(s)
    const fx = newFx(s)
    const broken = [...s.promises]
    for (const p of broken) settlePromise(fx, scenario, p, false)
    recess = {
      broken: broken.map((p) => ({ blocId: p.blocId, label: p.label })),
      deltas: finishFx(fx, prev, scenario),
    }
  }
  checkExpulsion(s, scenario)
  checkRevolution(s, scenario)
  const term = termOf(s.actId)
  if (!s.ended && s.flags[`fired:ultimatum:${term}`] && s.trust < ULTIMATUM_RECOVER) {
    endRun(s, 'NO CONFIDENCE', 'The ultimatum expired with confidence unrecovered — the House withdrew it', false)
  }
  if (!s.ended && !act.election) {
    s.termsServed++
    endRun(s, 'RETIRED WITH HONOURS', 'Left the House at a time of their own choosing', true)
  }
  if (s.ended) {
    if (recess) s.ended.cause += ` — ${recessClause(scenario, recess.broken)}`
    s.stage = { kind: 'obituary' }
    return s
  }
  const night = runElection(s, scenario)
  for (const sw of night.swings) {
    const bs = s.blocs.find((b) => b.id === sw.blocId)
    if (bs) bs.seats = sw.after
  }
  if (night.seat.held) {
    s.termsServed++
    s.trust = clampNum(s.trust + WIN_TRUST - TERM_TRUST_DECAY, 0, 100)
    for (const bs of s.blocs) if (bs.active) bs.fervour = Math.max(0, bs.fervour - FERVOUR_DECAY)
  } else {
    const short = Math.abs(night.seat.total + night.seat.margin).toFixed(1)
    endRun(s, 'DEFEATED', `Lost the seat to the national swing — the count came up ${short} points short`, false)
  }
  s.stage = { kind: 'election', night, recess }
  return s
}

/** Drive the state to its next surface: events due, then the docket. */
function advance(s: TermsState, scenario: Scenario, bills: Bill[]): TermsState {
  const byId = billsById(bills)
  for (let guard = 0; guard < 400; guard++) {
    if (s.ended) {
      s.stage = { kind: 'obituary' }
      return s
    }
    const due = systemicDue(s, scenario)
    if (due) {
      if (due.scheduledIndex !== undefined) s.scheduled.splice(due.scheduledIndex, 1)
      if (!due.eventId) continue // gated-out scheduled entry: dropped, nothing fires
      if (due.setFlag) s.flags[due.setFlag] = true
      s.position++
      s.stage = { kind: 'event', eventId: due.eventId }
      return s
    }
    const act = scenario.acts[s.actId]
    if (!act) {
      endRun(s, 'RETIRED WITH HONOURS', 'The record simply ends', true)
      continue
    }
    if (s.slotIndex >= act.slots.length) return endOfTerm(s, scenario, act)
    const slot = act.slots[s.slotIndex]
    if (slot.kind === 'event') {
      const ev = findEvent(scenario, slot.eventId)
      if (!ev || !passesGates(s, ev.gates)) {
        s.slotIndex++
        continue
      }
      s.position++
      s.flags['slotevent@' + s.position] = true
      s.stage = { kind: 'event', eventId: ev.id }
      return s
    }
    const bill = slot.kind === 'bill' ? byId.get(slot.billId) ?? null : selectFill(s, scenario, bills, slot.axis)
    if (!bill || s.servedBillIds.includes(bill.id)) {
      s.slotIndex++
      continue
    }
    s.position++
    if (slot.kind === 'fill') s.flags['fill@' + s.position] = true
    if (slot.kind === 'bill' && slot.whip && s.whipNotesThisTerm < WHIP_NOTES_PER_TERM) {
      s.whipNotesThisTerm++
      s.flags['whipfired@' + s.position] = true
      s.flags['seen:whipnote'] = true
      s.stage = { kind: 'whipnote', billId: bill.id, whip: slot.whip }
      return s
    }
    return enterBillStage(s, scenario, bills, bill)
  }
  return s
}

function resolveVote(
  prev: TermsState,
  s: TermsState,
  scenario: Scenario,
  bills: Bill[],
  choice: VoteChoice,
  wantsEmergencyWhip: boolean,
): TermsState {
  if (s.stage.kind !== 'bill') return s
  const stage = s.stage
  const bill = billsById(bills).get(stage.billId)
  if (!bill) return s
  const fx = newFx(s)
  const slot = scenario.acts[s.actId]?.slots[s.slotIndex]
  const whip = stage.whip
  const swungBlocId = s.flags['accepted@' + s.position] && stage.projection.offer ? stage.projection.offer.blocId : null

  // the bargain struck during negotiation surfaces on this slip
  if (swungBlocId) {
    addRelations(fx, scenario, swungBlocId, BARGAIN_RELATIONS, `the bargain with ${blocShort(scenario, swungBlocId)}`, 'negotiation')
  }

  // Emergency Whip: leader-only, once per term, meaningless on an abstention.
  // Invalid requests are dropped silently — replayed action logs stay safe.
  const emergencyWhip =
    wantsEmergencyWhip &&
    s.office === 'leader' &&
    choice !== 'abstain' &&
    s.emergencyWhipsThisTerm < EMERGENCY_WHIPS_PER_TERM
  if (emergencyWhip) {
    s.emergencyWhipsThisTerm++
    addTrust(fx, EMERGENCY_WHIP_TRUST, 'the Emergency Whip')
    fx.lines.push('The Emergency Whip is served — the party’s hesitants file behind the Member.')
  }

  const conv = scoreVote(prev.posteriors, bill, choice)
  const res = resolveDivision(s, scenario, bill, choice, { swungBlocId, emergencyWhip })

  if (choice !== 'abstain') {
    for (const l of bill.loadings) s.posteriors[l.axis] = update(s.posteriors[l.axis], l, choice === 'ratify')
  }

  // The Wilderness doubles conviction stakes: the record is all a member out there has.
  const stakes = s.office === 'backbencher' && s.portfolio === 'wilderness' ? 2 : 1
  if (conv.delta)
    addConviction(fx, conv.delta * stakes, conv.weathervane ? 'the weathervane' : 'a vote in line with the record')
  if (conv.weathervane) {
    fx.lines.push('They say the Member has turned his coat.')
    s.flags['weathervane'] = (Number(s.flags['weathervane']) || 0) + 1
  }

  // relations drift: blocs judge the vote, not the outcome
  const e0 = bill.loadings[0]?.extremity ?? 0
  for (const bs of s.blocs) {
    if (!bs.active) continue
    const bloc = scenario.blocs.find((b) => b.id === bs.id)
    if (!bloc) continue
    const st = blocStance(bloc.vector, bill)
    let delta: number
    if (choice === 'abstain') {
      if (Math.abs(st - 0.5) < 0.12) continue
      delta = -(4 + 4 * e0) * 0.5
    } else {
      delta = ((st >= 0.5) === (choice === 'ratify') ? 1 : -1) * (4 + 4 * e0)
    }
    if (whip && bs.id === s.partyId) delta *= 2
    addRelations(fx, scenario, bs.id, delta, `the division on “${bill.title}”`, 'division')
  }

  // whip outcome: a whipped division always costs something
  let whipOutcome: DivisionResult['whipOutcome']
  if (whip) {
    const obeyed = choice === (whip.ratify ? 'ratify' : 'strike')
    if (!obeyed) {
      s.whipDefiances++
      const seatMult = s.seatType === 'safe' ? 2 : 0.5
      addRelations(fx, scenario, s.partyId, -(8 + 4 * e0) * seatMult, 'defiance of the whip', 'division')
      addTrust(fx, -(prev.conviction >= 70 ? 1 : 2), 'the party briefs against you')
    }
    whipOutcome = { obeyed, strikes: s.whipDefiances }
  }

  // mood-matched division: a deliberately weak trust faucet, capped per term
  const term = termOf(s.actId)
  const l0 = bill.loadings[0]
  if (choice !== 'abstain' && l0) {
    const voteDir = (l0.direction === 'right' ? 1 : -1) * (choice === 'ratify' ? 1 : -1)
    const z = s.zeitgeist[l0.axis] ?? 0
    const used = Number(s.flags['mood:' + term]) || 0
    if (Math.abs(z) >= 0.05 && voteDir * z > 0 && used < MOOD_TRUST_CAP) {
      addTrust(fx, 1, 'the House liked the mood of it')
      s.flags['mood:' + term] = used + 1
    }
  }

  // only passed bills move the Republic
  if (res.passed) {
    bill.loadings.forEach((l, i) => {
      const dir = l.direction === 'right' ? 1 : -1
      moveZeitgeist(fx, l.axis, dir * l.extremity * ZEITGEIST_SHIFT * (i === 0 ? 1 : 0.5), `“${bill.title}” passed`)
    })
    const isFill = !!s.flags['fill@' + s.position]
    if (!isFill && slot && slot.kind === 'bill' && slot.treasury !== undefined) {
      addTreasury(fx, slot.treasury, `“${bill.title}” passed`)
    } else if (isFill) {
      bill.loadings.forEach((l, i) => {
        if (l.axis !== 'fiscal') return
        const dir = l.direction === 'right' ? 1 : -1
        addTreasury(fx, dir * l.extremity * FILL_TREASURY_SCALE * (i === 0 ? 1 : 0.5), `“${bill.title}” passed`)
      })
    }
  }

  // promises: this bill's own, then any past their deadline
  let promiseOutcome: DivisionResult['promiseOutcome']
  const onThis = s.promises.find((p) => p.billId === bill.id)
  if (onThis) {
    const kept = choice === (onThis.ratify ? 'ratify' : 'strike')
    settlePromise(fx, scenario, { ...onThis }, kept)
    promiseOutcome = { promise: onThis, kept }
  }
  for (const p of [...s.promises]) {
    if (p.deadline < s.position) settlePromise(fx, scenario, p, false)
  }

  applyMandateDivisionHooks(fx, scenario, bill, choice)
  checkSpawn(fx, scenario)

  const deltas = finishFx(fx, prev, scenario)
  const impact = deltas.relations.reduce((sum, r) => sum + Math.abs(r.delta), 0) + Math.abs(deltas.conviction)
  s.votes.push({
    billId: bill.id,
    billTitle: bill.title,
    choice,
    passed: res.passed,
    castingVote: res.castingVote,
    position: s.position,
    impact,
  })
  s.servedBillIds.push(bill.id)

  checkExpulsion(s, scenario)
  checkRevolution(s, scenario)

  const isFirst = !s.flags['seen:first-slip']
  s.flags['seen:first-slip'] = true
  const contested = Math.abs(res.ayes - res.noes) <= CONTESTED_MARGIN
  const tier: 'ribbon' | 'full' =
    isFirst || contested || stage.projection.knifeEdge || !!whip || !!promiseOutcome || res.castingVote || emergencyWhip
      ? 'full'
      : 'ribbon'
  const result: DivisionResult = {
    billId: bill.id,
    billTitle: bill.title,
    choice,
    ayes: res.ayes,
    noes: res.noes,
    passed: res.passed,
    castingVote: res.castingVote,
    byBloc: res.byBloc,
    deltas,
    tier,
    promiseOutcome,
    whipOutcome,
    emergencyWhip,
  }
  s.stage = { kind: 'result', result }
  return s
}

function resolveEventOption(
  prev: TermsState,
  s: TermsState,
  scenario: Scenario,
  bills: Bill[],
  optionId: string,
): TermsState {
  if (s.stage.kind !== 'event') return s
  const ev = findEvent(scenario, s.stage.eventId)
  if (!ev) return advance(s, scenario, bills)
  const opt = ev.options.find((o) => o.id === optionId)
  if (!opt) return s
  const fx = newFx(s)
  let text = opt.detail ?? opt.label
  let succeeded: boolean | undefined
  let gambleEffects
  if (opt.gamble) {
    const out = resolveGamble(s, scenario, ev.id, opt.gamble)
    succeeded = out.succeeded
    text = out.text
    gambleEffects = out.effects
  }
  const boom = detonates(s, opt.effects) || detonates(s, gambleEffects)
  if (opt.effects) applyEffectSet(fx, scenario, opt.effects, ev.title)
  if (gambleEffects) applyEffectSet(fx, scenario, gambleEffects, ev.title)
  if (ev.id.startsWith('ev-scandal-')) s.flags['scandal'] = true
  if (boom) {
    fx.lines.push("The editor's safe was never so safe as promised.")
    endRun(s, 'DISGRACED', 'Two buried stories broke stacked, both on one morning', false)
  }
  s.events.push({ eventId: ev.id, optionId: opt.id, succeeded, position: s.position })
  checkSpawn(fx, scenario)
  checkExpulsion(s, scenario)
  checkRevolution(s, scenario)
  const deltas = finishFx(fx, prev, scenario)
  s.stage = { kind: 'event_outcome', eventId: ev.id, optionId: opt.id, text, deltas, succeeded }
  return s
}

export function newRun(scenario: Scenario, bills: Bill[], seed: number, setup: TermsSetup): TermsState {
  const posteriors = {} as Posteriors
  for (const ax of AXIS_IDS) posteriors[ax] = uniform()
  const state: TermsState = {
    schemaVersion: SCHEMA_VERSION,
    billsVersion: BILLS_VERSION,
    scenarioId: scenario.id,
    seed,
    position: 0,
    actId: scenario.firstActId,
    slotIndex: 0,
    stage: { kind: 'prologue' },
    partyId: setup.partyId,
    seatType: setup.seatType,
    office: 'backbencher',
    portfolio: null,
    trust: START_TRUST,
    conviction: START_CONVICTION,
    treasury: START_TREASURY,
    blocs: scenario.blocs.map((b) => ({
      id: b.id,
      active: !b.emergent,
      seats: b.emergent ? 0 : b.seats,
      relations: b.id === setup.partyId ? PARTY_START_RELATIONS : 0,
      fervour: 0,
      grudge: false,
    })),
    zeitgeist: { ...scenario.zeitgeist },
    promises: [],
    mandates: [],
    buriedScandals: 0,
    whipDefiances: 0,
    offersThisTerm: 0,
    whipNotesThisTerm: 0,
    emergencyWhipsThisTerm: 0,
    posteriors,
    servedBillIds: [],
    votes: [],
    events: [],
    scheduled: [],
    flags: { treasuryAtTermStart: START_TREASURY, termStartPos: 0, term1: true },
    ended: null,
    termsServed: 0,
  }
  return advance(state, scenario, bills)
}

/** The pure reducer. Stage-mismatched actions are ignored (replay stays safe). */
export function applyAction(
  state: TermsState,
  scenario: Scenario,
  bills: Bill[],
  action: TermsAction,
): TermsState {
  if (state.ended && state.stage.kind === 'obituary') return state
  const s = structuredClone(state)

  switch (action.type) {
    case 'vote':
      if (state.stage.kind !== 'bill') return state
      return resolveVote(state, s, scenario, bills, action.choice, action.emergencyWhip === true)

    case 'negotiate': {
      if (s.stage.kind !== 'negotiation') return state
      const stage = s.stage
      const bill = billsById(bills).get(stage.billId)
      if (!bill) return advance(s, scenario, bills)
      if (action.accept) {
        s.promises.push({ id: 'promise-' + s.position, ...stage.offer.promise })
        s.offersThisTerm++
        s.flags['accepted@' + s.position] = true
      } else {
        s.offersThisTerm++
      }
      const core = projectSeats(
        fieldedBlocs(s, scenario).map((f) => ({ blocId: f.blocId, vector: f.vector, seats: f.seats })),
        bill,
      )
      s.stage = {
        kind: 'bill',
        billId: bill.id,
        whip: activeWhip(s, scenario),
        projection: {
          ayes: core.ayes,
          noes: core.noes,
          hesitant: core.hesitant,
          knifeEdge: core.knifeEdge,
          offer: action.accept ? stage.offer : null,
        },
      }
      return s
    }

    case 'event_option':
      if (state.stage.kind !== 'event') return state
      return resolveEventOption(state, s, scenario, bills, action.optionId)

    case 'branch': {
      if (s.stage.kind !== 'branch') return state
      const branch = s.stage.branch
      const opt = branch.options.find((o) => o.id === action.optionId)
      if (!opt) return state
      const fx = newFx(s)
      s.office = opt.office
      // Options may omit portfolio (the leadership letter): carry the current one forward.
      s.portfolio = opt.portfolio ?? s.portfolio
      if (opt.effects) applyEffectSet(fx, scenario, opt.effects, branch.title)
      s.events.push({ eventId: 'branch:' + branch.id, optionId: opt.id, position: s.position })
      s.flags['picked:' + opt.id] = true
      s.actId = opt.nextActId
      s.slotIndex = 0
      s.whipDefiances = 0
      s.offersThisTerm = 0
      s.whipNotesThisTerm = 0
      s.emergencyWhipsThisTerm = 0
      s.flags['treasuryAtTermStart'] = s.treasury
      s.flags['termStartPos'] = s.position
      s.flags['term' + termOf(s.actId)] = true
      checkSpawn(fx, scenario)
      checkRevolution(s, scenario)
      return advance(s, scenario, bills)
    }

    case 'advance': {
      switch (s.stage.kind) {
        case 'result': {
          delete s.flags['accepted@' + s.position]
          delete s.flags['whipfired@' + s.position]
          delete s.flags['fill@' + s.position]
          s.slotIndex++
          return advance(s, scenario, bills)
        }
        case 'whipnote': {
          const bill = billsById(bills).get(s.stage.billId)
          if (!bill) {
            s.slotIndex++
            return advance(s, scenario, bills)
          }
          return enterBillStage(s, scenario, bills, bill)
        }
        case 'event_outcome': {
          if (s.flags['slotevent@' + s.position]) {
            delete s.flags['slotevent@' + s.position]
            s.slotIndex++
          }
          return advance(s, scenario, bills)
        }
        case 'election': {
          if (s.ended) {
            s.stage = { kind: 'obituary' }
            return s
          }
          const act = scenario.acts[s.actId]
          if (act?.branch) {
            s.stage = { kind: 'branch', branch: act.branch }
            return s
          }
          endRun(s, 'RETIRED WITH HONOURS', 'Left the House at a time of their own choosing', true)
          s.stage = { kind: 'obituary' }
          return s
        }
        case 'prologue':
          return advance(s, scenario, bills)
        default:
          return state
      }
    }
  }
}

/** Rebuild a run by replaying its action log through the pure reducer. */
export function replayRun(scenario: Scenario, bills: Bill[], saved: SavedTermsRun): TermsState {
  let state = newRun(scenario, bills, saved.seed, saved.setup)
  for (const a of saved.actions) state = applyAction(state, scenario, bills, a)
  return state
}
