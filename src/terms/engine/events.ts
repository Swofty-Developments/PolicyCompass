import type { Bloc, EffectSet, EventGates, Gamble, Scenario, TermsEvent, TermsState } from '../types'
import { pick, roll } from './rng'

// Systemic trigger thresholds (docs/TERMS.md § Events, § State model).
export const FISCAL_CRISIS_TREASURY = 15
export const UNREST_FERVOUR = 2
export const ULTIMATUM_TRUST = 20
export const ULTIMATUM_RECOVER = 30

export const EV_FISCAL = 'ev-telegram-fiscal'
export const EV_UNREST = 'ev-telegram-unrest'
export const EV_ULTIMATUM = 'ev-ultimatum'

/** Term number an act belongs to (act-1 → 1, act-2-* → 2, act-3 → 3). */
export function termOf(actId: string): number {
  const m = /^act-(\d)/.exec(actId)
  return m ? Number(m[1]) : 1
}

export function findEvent(scenario: Scenario, id: string): TermsEvent | null {
  return scenario.events.find((e) => e.id === id) ?? null
}

export function passesGates(state: TermsState, gates?: EventGates): boolean {
  if (!gates) return true
  if (gates.minTrust !== undefined && state.trust < gates.minTrust) return false
  if (gates.maxTrust !== undefined && state.trust > gates.maxTrust) return false
  if (gates.minConviction !== undefined && state.conviction < gates.minConviction) return false
  if (gates.maxConviction !== undefined && state.conviction > gates.maxConviction) return false
  if (gates.maxTreasury !== undefined && state.treasury > gates.maxTreasury) return false
  if (gates.office && !gates.office.includes(state.office)) return false
  if (gates.portfolio && (!state.portfolio || !gates.portfolio.includes(state.portfolio))) return false
  if (gates.flag && !state.flags[gates.flag]) return false
  if (gates.notFlag && state.flags[gates.notFlag]) return false
  return true
}

/** Authored bodies may carry a {figure} placeholder: the live trust figure at staging. */
export function renderEventBody(state: TermsState, ev: TermsEvent): string {
  return ev.body.split('{figure}').join(String(state.trust))
}

const SCANDAL_PREFIX = 'ev-scandal-'

/** How likely the press is to move this term: low standing invites the story,
 *  and a buried one leaks pressure of its own. */
export function scandalChance(state: TermsState): number {
  let c = 0.12
  if (state.conviction < 60) c += 0.45
  if (state.conviction < 42) c += 0.2
  if (state.trust < 40) c += 0.1
  if (state.buriedScandals > 0) c += 0.2
  return Math.min(0.92, c)
}

/**
 * Seeded scandal schedule: at most one per term, due at a seeded slot a few
 * divisions in. The per-term threshold roll is fixed; the chance is read from
 * live standing, so a sinking Member can trip a story the moment it sinks.
 */
export function scandalDue(state: TermsState, scenario: Scenario): string | null {
  const term = termOf(state.actId)
  if (state.flags[`fired:scandal:${term}`]) return null
  const termStart = typeof state.flags['termStartPos'] === 'number' ? (state.flags['termStartPos'] as number) : 0
  const at = 3 + Math.floor(roll(state.seed, 'scandal:at:' + term) * 5)
  if (state.position - termStart < at) return null
  if (roll(state.seed, 'scandal:fire:' + term) >= scandalChance(state)) return null
  const fired = new Set(state.events.map((e) => e.eventId))
  const candidates = scenario.events.filter(
    (e) => e.id.startsWith(SCANDAL_PREFIX) && !fired.has(e.id) && passesGates(state, e.gates),
  )
  if (!candidates.length) return null
  return pick(state.seed, 'scandal:which:' + term, candidates).id
}

export interface SystemicFire {
  eventId: string
  /** Index into state.scheduled to remove, for scheduled follow-ups */
  scheduledIndex?: number
  /** Flag session must set so the trigger does not refire */
  setFlag?: string
}

/**
 * The next event due outside the docket, if any: scheduled follow-ups first,
 * then state triggers (fiscal telegram, unrest, the once-per-run ultimatum).
 */
export function systemicDue(state: TermsState, scenario: Scenario): SystemicFire | null {
  const gatedOk = (id: string): boolean => {
    const ev = findEvent(scenario, id)
    return !!ev && passesGates(state, ev.gates)
  }

  for (let i = 0; i < state.scheduled.length; i++) {
    const sc = state.scheduled[i]
    if (state.position >= sc.at) {
      if (gatedOk(sc.eventId)) return { eventId: sc.eventId, scheduledIndex: i }
      return { eventId: '', scheduledIndex: i } // gated out: drop the entry, fire nothing
    }
  }

  const term = termOf(state.actId)
  if (state.trust < ULTIMATUM_TRUST && !state.flags['ultimatum-fired'] && gatedOk(EV_ULTIMATUM)) {
    return { eventId: EV_ULTIMATUM, setFlag: 'ultimatum-fired' }
  }
  if (
    state.treasury < FISCAL_CRISIS_TREASURY &&
    !state.flags[`fired:fiscal:${term}`] &&
    gatedOk(EV_FISCAL)
  ) {
    return { eventId: EV_FISCAL, setFlag: `fired:fiscal:${term}` }
  }
  const unrest = state.blocs.some((b) => b.active && Math.floor(b.fervour) >= UNREST_FERVOUR)
  if (unrest && !state.flags[`fired:unrest:${term}`] && gatedOk(EV_UNREST)) {
    return { eventId: EV_UNREST, setFlag: `fired:unrest:${term}` }
  }
  const scandal = scandalDue(state, scenario)
  if (scandal) return { eventId: scandal, setFlag: `fired:scandal:${term}` }
  return null
}

/** Scandal-roll modifier from held mandates (press baron softens the odds). */
export function mandateScandalBonus(state: TermsState, scenario: Scenario): number {
  let bonus = 0
  for (const id of state.mandates) {
    bonus += scenario.mandates.find((m) => m.id === id)?.hooks.scandalBonus ?? 0
  }
  return bonus
}

export function gambleChance(state: TermsState, scenario: Scenario, g: Gamble): number {
  let c = g.base
  if (g.perConviction) c += (state.conviction - 50) * g.perConviction
  if (g.perTrust) c += (state.trust - 50) * g.perTrust
  c += mandateScandalBonus(state, scenario)
  return Math.max(0, Math.min(1, c))
}

export interface GambleOutcome {
  succeeded: boolean
  text: string
  effects: EffectSet
}

/** Resolve a gamble by stateless seeded roll at the current docket position. */
export function resolveGamble(
  state: TermsState,
  scenario: Scenario,
  eventId: string,
  g: Gamble,
): GambleOutcome {
  const succeeded = roll(state.seed, `gamble:${eventId}:${state.position}`) < gambleChance(state, scenario, g)
  const branch = succeeded ? g.success : g.failure
  return { succeeded, text: branch.text, effects: branch.effects }
}

/** The DISGRACED detonation rule: a second hush breaks both stories stacked. */
export function detonates(state: TermsState, effects: EffectSet | undefined): boolean {
  return !!effects?.buryScandal && state.buriedScandals >= 1
}

/** The radical bloc due to spawn after a zeitgeist move (once per pole per run). */
export function spawnDue(state: TermsState, scenario: Scenario): Bloc | null {
  for (const b of scenario.blocs) {
    if (!b.emergent) continue
    const bs = state.blocs.find((x) => x.id === b.id)
    if (!bs || bs.active) continue
    const z = state.zeitgeist[b.emergent.axis] ?? 0
    const crossed = b.emergent.pole === 'left' ? z <= -b.emergent.threshold : z >= b.emergent.threshold
    if (crossed) return b
  }
  return null
}
