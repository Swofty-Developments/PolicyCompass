import type { AxisId, Bill } from '../../types'
import { archetypes, leaders, parties } from '../../data'
import {
  axisResults,
  nearestArchetype,
  overallStanding,
  rankLeaders,
  rankParties,
  userVector,
} from '../../engine/scoring'
import { ENDING_COPY, EPITAPH_LEADS } from '../data/endings'
import type { Ending, Obituary, Scenario, TermsState, TermsVote } from '../types'
import { pick } from './rng'

const termsWord = (n: number): string =>
  n <= 0 ? 'less than a term' : n === 1 ? 'one term' : n === 2 ? 'two terms' : 'three terms'

function fill(template: string, state: TermsState, scenario: Scenario, ending: Ending, archetypeTitle: string): string {
  const party = scenario.blocs.find((b) => b.id === state.partyId)
  // "a {archetype}" drops the title's own article: "a The Vanguard" → "a Vanguard".
  const label = archetypeTitle.replace(/^the\s+/i, '')
  const an = /^[aeiou]/i.test(label) ? 'n' : ''
  return template
    .replace(/\b(a|A)(\s+)\{archetype\}/g, (_m, art: string, sp: string) => `${art}${an}${sp}${label}`)
    .split('{archetype}').join(archetypeTitle)
    .split('{party}').join(party?.short ?? 'the party')
    .split('{terms}').join(termsWord(state.termsServed))
    .split('{cause}').join(ending.cause)
}

function officeLabel(office: string, portfolio?: string): string {
  if (office === 'leader') return 'Leader of the House'
  if (portfolio === 'wilderness') return 'The Wilderness'
  if (office === 'minister') {
    if (portfolio === 'treasury') return 'Minister — The Treasury'
    if (portfolio === 'home') return 'Minister — The Home Office'
    return 'Minister'
  }
  return 'Backbencher'
}

function signatureLine(v: TermsVote): string {
  const voted = v.choice === 'ratify' ? 'Voted Aye' : v.choice === 'strike' ? 'Voted No' : 'Abstained'
  const house = v.passed ? 'the House passed it' : 'the House threw it out'
  const casting = v.castingVote ? " — on the Member's own casting vote" : ''
  return `${voted}; ${house}${casting}.`
}

/** Assemble the full-screen dossier: verdict, signature votes, epitaph, brag. */
export function buildObituary(state: TermsState, scenario: Scenario, bills: Bill[]): Obituary {
  const results = axisResults(state.posteriors)
  const overall = overallStanding(results)
  const user = userVector(results)
  const archetype = nearestArchetype(user, archetypes)
  const ending: Ending =
    state.ended ?? {
      stamp: 'RETIRED WITH HONOURS',
      cause: 'Left the House at a time of their own choosing',
      victory: true,
      cutShort: state.termsServed === 0,
    }

  const axisStds = {} as Record<AxisId, number>
  for (const r of results) axisStds[r.axis] = r.std

  const signatureVotes = [...state.votes]
    .sort((a, b) => b.impact - a.impact || a.position - b.position)
    .slice(0, 3)
    .map((v) => ({ title: v.billTitle, line: signatureLine(v) }))

  const kept = Number(state.flags['promisesKept']) || 0
  const broken = Number(state.flags['promisesBroken']) || 0
  const winningSide = state.votes.filter((v) => v.choice !== 'abstain' && (v.choice === 'ratify') === v.passed).length
  const scandalCount = state.events.filter((e) => e.eventId.startsWith('ev-scandal-')).length
  const scandalsSurvived = Math.max(0, scandalCount - (ending.stamp === 'DISGRACED' ? 1 : 0))

  const leads = EPITAPH_LEADS[ending.stamp] ?? []
  const lead = leads.length
    ? pick(state.seed, 'epitaph', leads)
    : ENDING_COPY[ending.stamp]?.line ?? 'The record closes here.'
  const facts = ending.cutShort
    ? `The career ran ${termsWord(state.termsServed)}; the record was too thin to read with confidence.`
    : `Kept ${kept} ${kept === 1 ? 'promise' : 'promises'}, broke ${broken}; stood ${winningSide} times on the winning side.`
  const epitaph = `${fill(lead, state, scenario, ending, archetype.title)} ${facts}`

  const branchEntries = state.events.filter((e) => e.eventId.startsWith('branch:'))
  const branchPicks = branchEntries.map((e) => e.optionId)
  const offices = ['Backbencher']
  for (const entry of branchEntries) {
    for (const act of Object.values(scenario.acts)) {
      const opt = act.branch?.options.find((o) => o.id === entry.optionId)
      if (opt && 'branch:' + act.branch!.id === entry.eventId) {
        offices.push(officeLabel(opt.office, opt.portfolio))
        break
      }
    }
  }

  return {
    scenarioId: state.scenarioId,
    seed: state.seed,
    setup: { partyId: state.partyId, seatType: state.seatType },
    branchPicks,
    ending,
    termsServed: state.termsServed,
    offices,
    signatureVotes,
    overall: overall.mean,
    overallStd: overall.std,
    axisMeans: user,
    axisStds,
    archetypeId: archetype.id,
    archetypeTitle: archetype.title,
    leaderEchoes: rankLeaders(user, leaders).map((e) => ({ name: e.leader.name, pct: e.pct })),
    partyEchoes: rankParties(user, parties).map((e) => ({ name: e.party.name, pct: e.pct })),
    epitaph,
    brag: {
      termsServed: state.termsServed,
      winningSide,
      promisesKept: kept,
      promisesBroken: broken,
      scandalsSurvived,
    },
    tally: {
      ratified: state.votes.filter((v) => v.choice === 'ratify').length,
      struck: state.votes.filter((v) => v.choice === 'strike').length,
      abstained: state.votes.filter((v) => v.choice === 'abstain').length,
      passed: state.votes.filter((v) => v.passed).length,
    },
    billsVersion: state.billsVersion,
    finishedAt: Date.now(),
  }
}
