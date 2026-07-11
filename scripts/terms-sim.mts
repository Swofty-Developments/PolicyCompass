// Acceptance gate 2 (docs/TERMS.md): policy-driven auto-players over the real
// scenario. Targets: turtle loss ≥15%, coin-flip conviction <45, party-liner
// weathervanes, firebrand spawns a radical bloc by mid-Term II, vote-seller
// nets less trust than the turtle, first-timer dies ~35–65%.
// Run: npx tsx scripts/terms-sim.mts

import type { Bill } from '../src/types'
import { bills } from '../src/data/bills'
import { scenario } from '../src/terms/data/scenario'
import { blocStance } from '../src/terms/engine/alignment'
import { pPlayerRatify } from '../src/terms/engine/conviction'
import { termOf } from '../src/terms/engine/events'
import { roll } from '../src/terms/engine/rng'
import { applyAction, newRun } from '../src/terms/engine/session'
import type { EventOption, TermsAction, TermsSetup, TermsState } from '../src/terms/types'

// Runs under tsx; the project ships no @types/node.
declare const process: { exit(code?: number): never }

const SEEDS = Array.from({ length: 48 }, (_, i) => i + 1)
const byId = new Map(bills.map((b) => [b.id, b]))

interface Profile {
  name: string
  setup(seed: number): TermsSetup
  decide(state: TermsState, seed: number): TermsAction
}

const stageBill = (state: TermsState): Bill | null =>
  state.stage.kind === 'bill' ? byId.get(state.stage.billId) ?? null : null

const leanVote = (state: TermsState, bill: Bill): TermsAction => ({
  type: 'vote',
  choice: pPlayerRatify(state.posteriors, bill) >= 0.5 ? 'ratify' : 'strike',
})

const effectWeight = (o: EventOption): number => {
  const e = o.effects ?? {}
  return (
    Math.abs(e.trust ?? 0) +
    Math.abs(e.conviction ?? 0) +
    Math.abs(e.treasury ?? 0) +
    (e.relations ?? []).reduce((s, r) => s + Math.abs(r.delta), 0) +
    (e.fervour ?? []).reduce((s, f) => s + Math.abs(f.delta) * 20, 0) +
    (e.buryScandal ? 40 : 0)
  )
}

/** Prefer no gamble, then the highest trust, then the quietest option. */
const safestOption = (options: EventOption[]): EventOption => {
  const sorted = [...options].sort((a, b) => {
    const ga = a.gamble ? 1 : 0
    const gb = b.gamble ? 1 : 0
    if (ga !== gb) return ga - gb
    const ta = a.effects?.trust ?? 0
    const tb = b.effects?.trust ?? 0
    if (ta !== tb) return tb - ta
    return effectWeight(a) - effectWeight(b)
  })
  return sorted[0]
}

const leftwardOption = (options: EventOption[]): EventOption => {
  const score = (o: EventOption): number =>
    (o.effects?.zeitgeist ?? []).reduce((s, z) => s + (z.axis === 'economic' ? -z.delta : 0), 0) +
    (o.effects?.fervour ?? []).reduce((s, f) => s + (f.blocId === 'bloc-vanguard' ? f.delta : 0), 0)
  return [...options].sort((a, b) => score(b) - score(a))[0]
}

const seededOption = (options: EventOption[], state: TermsState, seed: number): EventOption =>
  options[Math.floor(roll(seed, `sim:opt:${state.position}`) * options.length)]

const branchPick = (
  state: TermsState,
  prefer: (o: { portfolio?: string }) => boolean,
): TermsAction => {
  if (state.stage.kind !== 'branch') return { type: 'advance' }
  const options = state.stage.branch.options
  const hit = options.find(prefer)
  return { type: 'branch', optionId: (hit ?? options[0]).id }
}

function makeDecide(
  vote: (state: TermsState, bill: Bill, seed: number) => TermsAction,
  event: (options: EventOption[], state: TermsState, seed: number) => EventOption,
  accept: (state: TermsState, seed: number) => boolean,
  branch: (state: TermsState, seed: number) => TermsAction,
): Profile['decide'] {
  return (state, seed) => {
    switch (state.stage.kind) {
      case 'bill': {
        const bill = stageBill(state)
        return bill ? vote(state, bill, seed) : { type: 'advance' }
      }
      case 'negotiation':
        return { type: 'negotiate', accept: accept(state, seed) }
      case 'event': {
        const ev = scenario.events.find((e) => state.stage.kind === 'event' && e.id === state.stage.eventId)
        if (!ev || ev.options.length === 0) return { type: 'advance' }
        return { type: 'event_option', optionId: event(ev.options, state, seed).id }
      }
      case 'branch':
        return branch(state, seed)
      default:
        return { type: 'advance' }
    }
  }
}

const profiles: Profile[] = [
  {
    name: 'turtle',
    setup: () => ({ partyId: 'bloc-national', seatType: 'safe' }),
    decide: makeDecide(
      (state, bill) => leanVote(state, bill),
      (opts) => safestOption(opts),
      () => false,
      (state) => branchPick(state, (o) => o.portfolio !== 'wilderness'),
    ),
  },
  {
    // Flips a coin on every division; off the floor they take the safe-now
    // option like anyone else (which is how hushed stories accumulate).
    name: 'coin-flip',
    setup: (seed) => ({
      partyId: ['bloc-labour', 'bloc-national', 'bloc-reform'][seed % 3],
      seatType: 'safe',
    }),
    decide: makeDecide(
      (state, _bill, seed) => ({
        type: 'vote',
        choice: roll(seed, `sim:coin:${state.position}`) < 0.5 ? 'ratify' : 'strike',
      }),
      (opts) => safestOption(opts),
      (state, seed) => roll(seed, `sim:acc:${state.position}`) < 0.5,
      (state, seed) => {
        if (state.stage.kind !== 'branch') return { type: 'advance' }
        const options = state.stage.branch.options
        return { type: 'branch', optionId: options[Math.floor(roll(seed, `sim:br:${state.position}`) * options.length)].id }
      },
    ),
  },
  {
    name: 'party-liner',
    setup: () => ({ partyId: 'bloc-national', seatType: 'safe' }),
    decide: makeDecide(
      (state, bill) => {
        if (state.stage.kind === 'bill' && state.stage.whip) {
          return { type: 'vote', choice: state.stage.whip.ratify ? 'ratify' : 'strike' }
        }
        const party = scenario.blocs.find((b) => b.id === state.partyId)
        const st = party ? blocStance(party.vector, bill) : 0.5
        return { type: 'vote', choice: st >= 0.5 ? 'ratify' : 'strike' }
      },
      (opts) => safestOption(opts),
      () => false,
      (state) => branchPick(state, (o) => o.portfolio !== 'wilderness'),
    ),
  },
  {
    name: 'firebrand',
    setup: () => ({ partyId: 'bloc-labour', seatType: 'safe' }),
    decide: makeDecide(
      (_state, bill) => ({
        type: 'vote',
        choice: bill.loadings[0]?.direction === 'left' ? 'ratify' : 'strike',
      }),
      (opts) => leftwardOption(opts),
      () => false,
      (state) => branchPick(state, (o) => o.portfolio === 'wilderness'),
    ),
  },
  {
    // Marginal seat: the archetypal seller wants the extra promise slot.
    name: 'vote-seller',
    setup: () => ({ partyId: 'bloc-national', seatType: 'marginal' }),
    decide: makeDecide(
      (state, bill) => {
        const promised = state.promises.find((p) => p.billId === bill.id)
        if (promised) return { type: 'vote', choice: promised.ratify ? 'ratify' : 'strike' }
        return leanVote(state, bill)
      },
      (opts) => safestOption(opts),
      () => true,
      (state) => branchPick(state, (o) => o.portfolio !== 'wilderness'),
    ),
  },
  {
    name: 'first-timer',
    setup: (seed) => ({
      partyId: ['bloc-labour', 'bloc-national', 'bloc-reform'][seed % 3],
      seatType: seed % 2 ? 'safe' : 'marginal',
    }),
    decide: makeDecide(
      (state, bill, seed) => {
        if (state.stage.kind === 'bill' && state.stage.whip && roll(seed, `sim:obey:${state.position}`) < 0.5) {
          return { type: 'vote', choice: state.stage.whip.ratify ? 'ratify' : 'strike' }
        }
        const lean = leanVote(state, bill)
        if (roll(seed, `sim:flip:${state.position}`) < 0.3) {
          return { type: 'vote', choice: lean.type === 'vote' && lean.choice === 'ratify' ? 'strike' : 'ratify' }
        }
        return lean
      },
      seededOption,
      (state, seed) => roll(seed, `sim:acc:${state.position}`) < 0.5,
      (state, seed) => {
        if (state.stage.kind !== 'branch') return { type: 'advance' }
        const options = state.stage.branch.options
        return { type: 'branch', optionId: options[Math.floor(roll(seed, `sim:br:${state.position}`) * options.length)].id }
      },
    ),
  },
]

// ---- driver ----------------------------------------------------------------------

const CHECKPOINTS = [4, 8, 12, 16, 20, 24]

interface RunStats {
  stamp: string
  died: boolean
  termsServed: number
  trust: number
  conviction: number
  treasury: number
  weathervanes: number
  spawnedByMidTermII: boolean
  trajectory: Map<number, { trust: number; conviction: number }>
}

function runOne(profile: Profile, seed: number): RunStats {
  let state = newRun(scenario, bills, seed, profile.setup(seed))
  let spawnedByMidTermII = false
  const trajectory = new Map<number, { trust: number; conviction: number }>()
  for (let i = 0; i < 600; i++) {
    for (const cp of CHECKPOINTS) {
      if (state.position >= cp && !trajectory.has(cp)) {
        trajectory.set(cp, { trust: state.trust, conviction: state.conviction })
      }
    }
    const emergentActive = state.blocs.some(
      (b) => b.active && scenario.blocs.find((x) => x.id === b.id)?.emergent,
    )
    if (emergentActive && !spawnedByMidTermII) {
      const term = termOf(state.actId)
      const act = scenario.acts[state.actId]
      const half = act ? Math.ceil(act.slots.length / 2) : 0
      if (term === 1 || (term === 2 && state.slotIndex <= half)) spawnedByMidTermII = true
    }
    if (state.stage.kind === 'obituary') break
    const next = applyAction(state, scenario, bills, profile.decide(state, seed))
    if (next === state) throw new Error(`stuck: ${profile.name} seed ${seed} at stage '${state.stage.kind}'`)
    state = next
  }
  if (state.stage.kind !== 'obituary') throw new Error(`no ending: ${profile.name} seed ${seed}`)
  const ending = state.ended
  return {
    stamp: ending?.stamp ?? 'UNENDED',
    died: !ending?.victory,
    termsServed: state.termsServed,
    trust: state.trust,
    conviction: state.conviction,
    treasury: state.treasury,
    weathervanes: Number(state.flags['weathervane']) || 0,
    spawnedByMidTermII,
    trajectory,
  }
}

const results = new Map<string, RunStats[]>()
for (const profile of profiles) {
  results.set(
    profile.name,
    SEEDS.map((seed) => runOne(profile, seed)),
  )
}

// ---- report ----------------------------------------------------------------------

const pad = (s: string, n: number): string => (s.length >= n ? s : s + ' '.repeat(n - s.length))
const avg = (xs: number[]): number => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length)

console.log(`\nTERMS SIM — ${SEEDS.length} seeds per profile\n`)
console.log(
  pad('profile', 13) + pad('death%', 8) + pad('terms', 7) + pad('trust', 7) + pad('conv', 7) +
    pad('treas', 7) + pad('wvane', 7) + pad('spawn%', 8) + 'endings',
)
for (const [name, runs] of results) {
  const hist = new Map<string, number>()
  for (const r of runs) hist.set(r.stamp, (hist.get(r.stamp) ?? 0) + 1)
  const endings = [...hist.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}×${v}`)
    .join(' ')
  console.log(
    pad(name, 13) +
      pad(((runs.filter((r) => r.died).length / runs.length) * 100).toFixed(0) + '%', 8) +
      pad(avg(runs.map((r) => r.termsServed)).toFixed(1), 7) +
      pad(avg(runs.map((r) => r.trust)).toFixed(0), 7) +
      pad(avg(runs.map((r) => r.conviction)).toFixed(0), 7) +
      pad(avg(runs.map((r) => r.treasury)).toFixed(0), 7) +
      pad(avg(runs.map((r) => r.weathervanes)).toFixed(1), 7) +
      pad(((runs.filter((r) => r.spawnedByMidTermII).length / runs.length) * 100).toFixed(0) + '%', 8) +
      endings,
  )
}

console.log('\nTrajectories (avg trust/conviction at docket positions)\n')
console.log(pad('profile', 13) + CHECKPOINTS.map((c) => pad('@' + c, 10)).join(''))
for (const [name, runs] of results) {
  const cells = CHECKPOINTS.map((cp) => {
    const at = runs.map((r) => r.trajectory.get(cp)).filter((x): x is { trust: number; conviction: number } => !!x)
    if (!at.length) return pad('—', 10)
    return pad(`${avg(at.map((a) => a.trust)).toFixed(0)}/${avg(at.map((a) => a.conviction)).toFixed(0)}`, 10)
  })
  console.log(pad(name, 13) + cells.join(''))
}

// ---- acceptance targets ------------------------------------------------------------

const failures: string[] = []
const get = (name: string): RunStats[] => results.get(name) ?? []
const deathRate = (name: string): number => get(name).filter((r) => r.died).length / Math.max(1, get(name).length)

if (deathRate('turtle') < 0.15) {
  failures.push(`turtle loss rate ${(deathRate('turtle') * 100).toFixed(0)}% — target ≥ 15%`)
}
// Letters refund +5 each (tuned down from +10 precisely so incoherence can't
// be laundered through the spouse); with that, the spec's < 45 bound holds.
const coinConv = avg(get('coin-flip').map((r) => r.conviction))
if (coinConv >= 45) failures.push(`coin-flip mean conviction ${coinConv.toFixed(0)} — spec target < 45`)
const plWvane = avg(get('party-liner').map((r) => r.weathervanes))
if (plWvane < 1) failures.push(`party-liner mean weathervane hits ${plWvane.toFixed(1)} — target ≥ 1`)
const spawnRate = get('firebrand').filter((r) => r.spawnedByMidTermII).length / Math.max(1, get('firebrand').length)
if (spawnRate < 0.25) {
  failures.push(`firebrand spawned a radical bloc by mid-Term II in ${(spawnRate * 100).toFixed(0)}% of seeds — target ≥ 25%`)
}
// Outcomes, not trust: a seller's corpse can be trusted and still be a corpse.
const honours = (p: string) =>
  get(p).filter((r) => r.stamp === 'RETIRED WITH HONOURS').length / Math.max(1, get(p).length)
if (deathRate('vote-seller') <= deathRate('turtle')) {
  failures.push(
    `vote-seller death rate ${(deathRate('vote-seller') * 100).toFixed(0)}% ≤ turtle ${(deathRate('turtle') * 100).toFixed(0)}% — selling votes must not pay`,
  )
}
if (honours('vote-seller') >= honours('turtle')) {
  failures.push(
    `vote-seller honours rate ${(honours('vote-seller') * 100).toFixed(0)}% ≥ turtle ${(honours('turtle') * 100).toFixed(0)}% — selling votes must not pay`,
  )
}
const ftDeath = deathRate('first-timer')
if (ftDeath < 0.35 || ftDeath > 0.65) {
  failures.push(`first-timer death rate ${(ftDeath * 100).toFixed(0)}% — target 35–65%`)
}

// ---- regression: the ultimatum is a standing rule, not once-per-run ----------------
// Scripted probe: collapse trust in Term I until the ultimatum fires, recover and
// survive the count, then collapse again in Term II. The Term II ultimatum must
// re-fire and its unrecovered expiry must end the run NO CONFIDENCE.

function ultimatumRefireProbe(seed: number): void {
  let state = newRun(scenario, bills, seed, { partyId: 'bloc-national', seatType: 'safe' })
  const decide = (s: TermsState): TermsAction => {
    switch (s.stage.kind) {
      case 'bill': {
        const bill = stageBill(s)
        return bill ? leanVote(s, bill) : { type: 'advance' }
      }
      case 'negotiation':
        return { type: 'negotiate', accept: false }
      case 'event': {
        const ev = scenario.events.find((e) => s.stage.kind === 'event' && e.id === s.stage.eventId)
        if (!ev || ev.options.length === 0) return { type: 'advance' }
        return { type: 'event_option', optionId: safestOption(ev.options).id }
      }
      case 'branch':
        return branchPick(s, (o) => o.portfolio !== 'wilderness')
      default:
        return { type: 'advance' }
    }
  }
  let firedT1 = false
  let firedT2 = false
  for (let i = 0; i < 600 && state.stage.kind !== 'obituary'; i++) {
    firedT1 ||= Boolean(state.flags['fired:ultimatum:1'])
    firedT2 ||= Boolean(state.flags['fired:ultimatum:2'])
    // Scripted trust, forced between reducer steps (applyAction clones first).
    if (termOf(state.actId) === 1) state.trust = firedT1 ? 60 : 10
    else state.trust = 10
    state = applyAction(state, scenario, bills, decide(state))
  }
  firedT1 ||= Boolean(state.flags['fired:ultimatum:1'])
  firedT2 ||= Boolean(state.flags['fired:ultimatum:2'])
  if (!firedT1) failures.push(`ultimatum probe (seed ${seed}): no Term I ultimatum fired — probe broken`)
  else if (!firedT2) {
    failures.push(`ultimatum probe (seed ${seed}): Term II trust collapse never re-fired the ultimatum — the once-per-run flag is back`)
  } else if (state.ended?.stamp !== 'NO CONFIDENCE') {
    failures.push(
      `ultimatum probe (seed ${seed}): post-recovery collapse ended '${state.ended?.stamp ?? 'UNENDED'}' — expected NO CONFIDENCE`,
    )
  }
}
ultimatumRefireProbe(3)

console.log('')
if (failures.length) {
  console.error(`SIM FAILED — ${failures.length} target(s) missed:\n`)
  for (const f of failures) console.error('  ✗ ' + f)
  console.error('')
  process.exit(1)
}
console.log('SIM PASSED — all acceptance targets hold.\n')
