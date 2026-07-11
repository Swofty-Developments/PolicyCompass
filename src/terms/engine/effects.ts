import type { AxisId } from '../../types'
import type { AppliedDeltas, BlocState, EffectSet, Scenario, TermsState } from '../types'

// Every mutation is a tagged delta record; session folds them into
// AppliedDeltas so each hidden-state move surfaces on paper with its cause.

export interface DeltaRec {
  field: string
  delta: number
  cause: string
}

/** Where a relations gain came from — only non-division gains feed appeasement. */
export type RelSource = 'division' | 'event' | 'promise' | 'negotiation'

export interface Fx {
  /** The draft state. Caller owns cloning; effects mutate it in place. */
  s: TermsState
  recs: DeltaRec[]
  lines: string[]
}

export const APPEASEMENT_FERVOUR = 0.25
export const HIGH_CONVICTION = 70
export const PARTY_RELATIONS_FLOOR = -45

const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x))

export function newFx(draft: TermsState): Fx {
  return { s: draft, recs: [], lines: [] }
}

export function addTrust(fx: Fx, delta: number, cause: string): void {
  if (!delta) return
  const before = fx.s.trust
  fx.s.trust = clamp(Math.round(fx.s.trust + delta), 0, 100)
  fx.recs.push({ field: 'trust', delta: fx.s.trust - before, cause })
}

export function addConviction(fx: Fx, delta: number, cause: string): void {
  if (!delta) return
  const before = fx.s.conviction
  fx.s.conviction = clamp(Math.round(fx.s.conviction + delta), 0, 100)
  fx.recs.push({ field: 'conviction', delta: fx.s.conviction - before, cause })
}

export function addTreasury(fx: Fx, delta: number, cause: string): void {
  if (!delta) return
  const before = fx.s.treasury
  fx.s.treasury = clamp(Math.round(fx.s.treasury + delta), 0, 100)
  fx.recs.push({ field: 'treasury', delta: fx.s.treasury - before, cause })
}

const blocShort = (scenario: Scenario, blocId: string): string =>
  scenario.blocs.find((b) => b.id === blocId)?.short ?? blocId

/** The flank bloc that resents a gain with `blocId` (appeasement symmetry). */
export function appeasementTarget(blocId: string, blocs: BlocState[]): string | null {
  const active = (id: string): BlocState | undefined => blocs.find((b) => b.id === id && b.active)
  switch (blocId) {
    case 'bloc-labour':
      return (active('bloc-national') ?? active('bloc-ironleague'))?.id ?? null
    case 'bloc-vanguard':
      return (active('bloc-ironleague') ?? active('bloc-national'))?.id ?? null
    case 'bloc-national':
      return (active('bloc-labour') ?? active('bloc-vanguard'))?.id ?? null
    case 'bloc-ironleague':
      return (active('bloc-vanguard') ?? active('bloc-labour'))?.id ?? null
    default: {
      // Reform Union (and unknowns): pressure lands on the hottest flank.
      const flanks = blocs.filter((b) => b.active && b.id !== blocId && b.id !== 'bloc-reform')
      if (flanks.length === 0) return null
      return flanks.reduce((hot, b) =>
        b.fervour > hot.fervour || (b.fervour === hot.fervour && b.seats > hot.seats) ? b : hot,
      ).id
    }
  }
}

/** Authored EffectSets may use blocId 'party' as a sentinel for the player's own party. */
const resolveBlocId = (fx: Fx, blocId: string): string => (blocId === 'party' ? fx.s.partyId : blocId)

export function addFervour(fx: Fx, scenario: Scenario, rawBlocId: string, delta: number, cause: string): void {
  if (!delta) return
  const blocId = resolveBlocId(fx, rawBlocId)
  const bloc = fx.s.blocs.find((b) => b.id === blocId && b.active)
  if (!bloc) return
  const before = bloc.fervour
  bloc.fervour = clamp(bloc.fervour + delta, 0, 3)
  if (bloc.fervour !== before) fx.recs.push({ field: 'fervour:' + blocId, delta: bloc.fervour - before, cause })
}

export function addRelations(
  fx: Fx,
  scenario: Scenario,
  rawBlocId: string,
  delta: number,
  cause: string,
  source: RelSource,
): void {
  if (!delta) return
  const blocId = resolveBlocId(fx, rawBlocId)
  const bloc = fx.s.blocs.find((b) => b.id === blocId && b.active)
  if (!bloc) return
  let d = delta
  if (d > 0 && bloc.grudge) d = d / 2
  const before = bloc.relations
  let next = clamp(Math.round(bloc.relations + d), -100, 100)
  // High conviction slows expulsion: the party relations floor is −45.
  if (blocId === fx.s.partyId && fx.s.conviction >= HIGH_CONVICTION) {
    next = Math.max(next, Math.min(before, PARTY_RELATIONS_FLOOR))
  }
  bloc.relations = next
  if (next !== before) fx.recs.push({ field: 'relations:' + blocId, delta: next - before, cause })
  // Appeasement symmetry: event/promise/negotiation gains heat the opposite flank.
  if (d > 0 && source !== 'division') {
    const target = appeasementTarget(blocId, fx.s.blocs)
    if (target) {
      addFervour(fx, scenario, target, APPEASEMENT_FERVOUR, `appeasement of ${blocShort(scenario, blocId)}`)
    }
  }
}

export function moveZeitgeist(fx: Fx, axis: AxisId, delta: number, cause: string): void {
  if (!delta) return
  const before = fx.s.zeitgeist[axis] ?? 0
  fx.s.zeitgeist[axis] = clamp(before + delta, -1, 1)
  if (fx.s.zeitgeist[axis] !== before) {
    fx.recs.push({ field: 'zeitgeist:' + axis, delta: fx.s.zeitgeist[axis] - before, cause })
  }
}

/** Demote one rung: leader → minister, minister/wilderness → backbencher. */
export function demoteOffice(fx: Fx, cause: string): void {
  if (fx.s.office === 'leader') fx.s.office = 'minister'
  else {
    fx.s.office = 'backbencher'
    fx.s.portfolio = null
  }
  fx.lines.push(cause)
}

/** Apply a declarative EffectSet. Detonation on buryScandal is the caller's check. */
export function applyEffectSet(fx: Fx, scenario: Scenario, ef: EffectSet, cause: string): void {
  if (ef.trust) addTrust(fx, ef.trust, cause)
  if (ef.conviction) addConviction(fx, ef.conviction, cause)
  if (ef.treasury) addTreasury(fx, ef.treasury, cause)
  for (const r of ef.relations ?? []) addRelations(fx, scenario, r.blocId, r.delta, cause, 'event')
  for (const f of ef.fervour ?? []) addFervour(fx, scenario, f.blocId, f.delta, cause)
  for (const z of ef.zeitgeist ?? []) moveZeitgeist(fx, z.axis, z.delta, cause)
  if (ef.grantMandate && fx.s.mandates.length < 2 && !fx.s.mandates.includes(ef.grantMandate)) {
    fx.s.mandates.push(ef.grantMandate)
    const m = scenario.mandates.find((x) => x.id === ef.grantMandate)
    if (m) {
      if (m.hooks.treasury) addTreasury(fx, m.hooks.treasury, m.title)
      for (const r of m.hooks.relationsOnAccept ?? []) addRelations(fx, scenario, r.blocId, r.delta, m.title, 'event')
      fx.lines.push(`${m.patron}'s backing is pinned in the ledger.`)
    }
  }
  if (ef.buryScandal) fx.s.buriedScandals += 1
  if (ef.resignOffice) demoteOffice(fx, 'Resigned the whip — the office is surrendered.')
  for (const sc of ef.schedule ?? []) {
    fx.s.scheduled.push({ eventId: sc.eventId, at: fx.s.position + sc.after })
  }
  if (ef.setFlags) Object.assign(fx.s.flags, ef.setFlags)
}

/** Threshold-proximity phrases: numbers live behind paper, thresholds are printed. */
function thresholdLines(fx: Fx, prev: TermsState, scenario: Scenario): string[] {
  const out: string[] = []
  const s = fx.s
  if (s.trust !== prev.trust && s.trust > 20 && s.trust <= 28) {
    out.push(`Confidence ${s.trust} — the whips talk at twenty.`)
  }
  if (s.treasury !== prev.treasury && s.treasury >= 15 && s.treasury < 22) {
    out.push(`The Treasury stands at ${s.treasury} — the telegraph office drafts at fifteen.`)
  }
  if (s.conviction !== prev.conviction && s.conviction > 40 && s.conviction <= 46) {
    out.push(`Conviction ${s.conviction} — the sketch-writers circle at forty.`)
  }
  const party = s.blocs.find((b) => b.id === s.partyId)
  const partyBefore = prev.blocs.find((b) => b.id === s.partyId)
  if (party && partyBefore && party.relations !== partyBefore.relations && party.relations <= -45 && party.relations > -60) {
    out.push(`The party's patience reads ${party.relations} — expulsion is spoken of at minus sixty.`)
  }
  for (const b of s.blocs) {
    const before = prev.blocs.find((x) => x.id === b.id)
    if (b.active && before && b.fervour !== before.fervour && b.fervour >= 1.5 && b.fervour < 2) {
      out.push(`${blocShort(scenario, b.id)} fervour ${b.fervour.toFixed(1)} — unrest breaks at two.`)
    }
  }
  return out
}

/** Fold the tagged records into AppliedDeltas with attribution lines. */
export function finishFx(fx: Fx, prev: TermsState, scenario: Scenario): AppliedDeltas {
  let trust = 0
  let conviction = 0
  let treasury = 0
  const relations = new Map<string, number>()
  const zeitgeist = new Map<AxisId, number>()
  const lines = [...fx.lines]
  for (const r of fx.recs) {
    if (r.field === 'trust') trust += r.delta
    else if (r.field === 'conviction') conviction += r.delta
    else if (r.field === 'treasury') treasury += r.delta
    else if (r.field.startsWith('relations:')) {
      const id = r.field.slice('relations:'.length)
      relations.set(id, (relations.get(id) ?? 0) + r.delta)
    } else if (r.field.startsWith('zeitgeist:')) {
      const ax = r.field.slice('zeitgeist:'.length) as AxisId
      zeitgeist.set(ax, (zeitgeist.get(ax) ?? 0) + r.delta)
    } else if (r.field.startsWith('fervour:')) {
      const id = r.field.slice('fervour:'.length)
      if (r.delta > 0) lines.push(`${blocShort(scenario, id)} fervour rises — ${r.cause}.`)
      else lines.push(`${blocShort(scenario, id)} fervour cools — ${r.cause}.`)
    }
  }
  lines.push(...thresholdLines(fx, prev, scenario))
  return {
    trust,
    conviction,
    treasury,
    relations: [...relations.entries()].map(([blocId, delta]) => ({ blocId, delta })),
    zeitgeist: [...zeitgeist.entries()].map(([axis, delta]) => ({ axis, delta })),
    lines: [...new Set(lines)],
  }
}
