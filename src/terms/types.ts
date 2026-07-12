// ============================================================================
// Terms — domain contracts for the career-roguelike mode.
// Everything here is additive: the compass test's types.ts is imported, never
// changed. See docs/TERMS.md (rev 2) for the design spec these shapes implement.
// ============================================================================

import type { AxisId, AxisVector, Pole } from '../types'
import type { Posteriors } from '../engine/adaptive'

export type BlocId = string
export type TermsEventId = string
export type MandateId = string

export type Office = 'backbencher' | 'minister' | 'leader'
export type Portfolio = 'treasury' | 'home' | 'wilderness'
export type SeatType = 'safe' | 'marginal'
/** The player's action on a division. The v1 deck adapter emits only
 * ratify/strike; abstain semantics are defined for the feat/engagement merge. */
export type VoteChoice = 'ratify' | 'strike' | 'abstain'

// ---- blocs -----------------------------------------------------------------

/** A parliamentary bloc. Founding blocs hold seats from the start; emergent
 * radical blocs spawn when the zeitgeist polarises past their threshold. */
export interface Bloc {
  id: BlocId
  name: string
  /** Short name for whip notes / result slips, e.g. "Labour" */
  short: string
  /** Composite blurb; names the real referents it is drawn from */
  blurb: string
  /** Real-world composites, rendered as the citation line */
  composites: string[]
  vector: AxisVector
  /** Initial seats of the 99 bloc seats (0 for emergent blocs) */
  seats: number
  /** Present only on emergent blocs */
  emergent?: {
    axis: AxisId
    pole: Pole
    /** |zeitgeist[axis]| that spawns the bloc */
    threshold: number
    seedSeats: number
    /** Authored "NEW PARTY FOUNDED" front page fired on spawn */
    spawnEventId: TermsEventId
  }
  /** Player may choose this bloc as their party in the prologue */
  playable: boolean
}

export interface BlocState {
  id: BlocId
  active: boolean
  seats: number
  /** −100..100, the bloc's relations with the player */
  relations: number
  /** 0..3, fractional internally; floor() is the displayed level */
  fervour: number
  /** Set when the player breaks a promise to them; halves future relation gains */
  grudge: boolean
}

// ---- promises & mandates -----------------------------------------------------

export type PromiseKind = 'vote' | 'mandate_act'

/** A promise entered in the ledger during negotiation. */
export interface ActivePromise {
  id: string
  blocId: BlocId
  kind: PromiseKind
  /** kind 'vote': the upcoming curated bill they demand, and the direction */
  billId?: string
  ratify?: boolean
  /** Ledger line, e.g. "Vote to ratify the Coal Bill before the recess" */
  label: string
  /** Global docket position by which it must be fulfilled */
  deadline: number
  /** P(player would have voted their way anyway) at accept time — scales the reward */
  improbability: number
}

/** A patron's standing offer, held as a run-modifier (relic). Max 2 held. */
export interface Mandate {
  id: MandateId
  title: string
  patron: string
  /** What it does, in printed-ledger copy */
  text: string
  composites: string[]
  hooks: MandateHooks
}

export interface MandateHooks {
  /** Added to scandal gamble success chance (positive = safer) */
  scandalBonus?: number
  /** Permanently occupies one promise slot while held */
  reservesPromiseSlot?: boolean
  /** Treasury cushion granted on acceptance */
  treasury?: number
  /** Relations shift applied on acceptance */
  relationsOnAccept?: { blocId: BlocId; delta: number }[]
  /** Relations bonus on divisions whose primary loading matches */
  divisionBonus?: { axis: AxisId; pole: Pole; blocId: BlocId; relations: number }
  /** Voting against matching loadings this many times → fervour strike from the bloc */
  crossLimit?: { axis: AxisId; pole: Pole; blocId: BlocId; limit: number }
}

// ---- events ------------------------------------------------------------------

export type ArtifactKind =
  | 'telegram' // crisis
  | 'frontpage' // scandal / world (radical spawn)
  | 'whipnote' // party pressure (systemic, generated)
  | 'letter' // personal
  | 'memo' // office memo (the pollster's memo, briefing papers)
  | 'mandate' // patron offer
  | 'ultimatum' // trust collapse warning

export interface Precedent {
  /** e.g. "The 1907 Knickerbocker panic" */
  name: string
  url: string
}

/** Declarative state deltas an option applies. All fields optional. */
export interface EffectSet {
  trust?: number
  conviction?: number
  treasury?: number
  relations?: { blocId: BlocId; delta: number }[]
  fervour?: { blocId: BlocId; delta: number }[]
  /** Direct zeitgeist movement (major telegrams/branches: ±0.08–0.12) */
  zeitgeist?: { axis: AxisId; delta: number }[]
  grantMandate?: MandateId
  /** Buries a scandal: increments the buried counter (2nd hush detonates) */
  buryScandal?: boolean
  /** Resign the whip / office: office demotion */
  resignOffice?: boolean
  /** Schedule another authored event to fire n docket positions later */
  schedule?: { eventId: TermsEventId; after: number }[]
  /** Set run flags (letters/marginalia gating) */
  setFlags?: Record<string, number | boolean>
}

/** A gamble resolved by a stateless seeded roll. */
export interface Gamble {
  /** Base success chance 0..1 before modifiers */
  base: number
  /** chance += (conviction − 50) × perConviction + (trust − 50) × perTrust + mandate scandalBonus */
  perConviction?: number
  perTrust?: number
  success: { text: string; effects: EffectSet }
  failure: { text: string; effects: EffectSet }
}

export interface EventOption {
  id: string
  /** The reply slip / statement draft line */
  label: string
  detail?: string
  effects?: EffectSet
  gamble?: Gamble
}

export interface TermsEvent {
  id: TermsEventId
  kind: Exclude<ArtifactKind, 'whipnote'>
  /** Artifact headline: telegram subject / front-page headline / letter opening */
  title: string
  /** Body copy, artifact-voiced. Telegrams are STOP-cadence mono; letters are hand voice. */
  body: string
  /** Signature line (sender, correspondent, masthead) */
  byline?: string
  options: EventOption[]
  /** Real episodes this composite is drawn from — always ≥ 1, rendered as sources */
  precedents: Precedent[]
  /** Fires only if all gates pass when its slot is reached; gated-out slots are skipped */
  gates?: EventGates
}

export interface EventGates {
  minTrust?: number
  maxTrust?: number
  minConviction?: number
  maxConviction?: number
  maxTreasury?: number
  office?: Office[]
  portfolio?: Portfolio[]
  /** Run flag that must be set / unset (letters key off these) */
  flag?: string
  notFlag?: string
}

/** Systemic whip note attached to a curated bill slot (max 2/term fire). */
export interface WhipDirective {
  /** The direction the party demands */
  ratify: boolean
  /** Handwritten line on the card */
  note: string
}

// ---- scenario ------------------------------------------------------------------

export type DocketSlot =
  | {
      kind: 'bill'
      billId: string
      /** Guard against pool regeneration: audited against the live pool title */
      expectTitle: string
      whip?: WhipDirective
      /** Authored treasury delta on passage (mandatory for fiscal/economic curated bills) */
      treasury?: number
    }
  /** Adaptive fill: seeded sample of the top-3 Fisher-information candidates */
  | { kind: 'fill'; axis?: AxisId }
  | { kind: 'event'; eventId: TermsEventId }

export interface BranchOption {
  id: string
  label: string
  detail: string
  office: Office
  portfolio?: Portfolio
  /** Act to enter next */
  nextActId: string
  effects?: EffectSet
}

/** Presented at election night as a letter with options. */
export interface Branch {
  id: string
  title: string
  letter: string
  byline: string
  options: BranchOption[]
}

export interface Act {
  id: string
  /** e.g. "Term I — The Backbench" */
  title: string
  epigraph?: string
  slots: DocketSlot[]
  /** Branch presented after this act's election (terminal acts omit it) */
  branch?: Branch
  /** Whether an election closes this act (the final act ends in the epilogue) */
  election: boolean
}

export interface Character {
  id: string
  name: string
  role: 'rival' | 'spouse' | 'patron' | 'whip' | 'officer' | 'pollster'
  blurb: string
  composites: string[]
  /** Cast cutout path under public/, e.g. '/terms/cast/whip.jpg' */
  portrait?: string
}

// ---- dialogue scenes -----------------------------------------------------------

/** One spoken beat. `speaker` is a characterId, or 'narrator' | 'player'. */
export interface DialogueLine {
  speaker: string
  text: string
}

/** A beat that pauses the scene for the player's reply. */
export interface DialogueChoice {
  prompt: string
  options: { id: string; label: string; detail?: string }[]
}

export interface DialogueScene {
  id: string
  beats: (DialogueLine | DialogueChoice)[]
}

export interface Scenario {
  id: string
  title: string
  /** Prologue dossier copy (the returning officer's letter, face one) */
  intro: string
  /** Seat-choice copy; must state the mechanical tradeoff in words */
  seatBlurbs: Record<SeatType, string>
  blocs: Bloc[]
  characters: Character[]
  events: TermsEvent[]
  mandates: Mandate[]
  acts: Record<string, Act>
  firstActId: string
  /** Starting national mood */
  zeitgeist: AxisVector
}

// ---- runtime state ----------------------------------------------------------

export interface NegotiationOffer {
  blocId: BlocId
  /** Seats the bloc will swing if the promise is accepted */
  seats: number
  promise: Omit<ActivePromise, 'id'>
  /** Bargaining-sheet copy */
  text: string
}

export interface DivisionProjection {
  ayes: number
  noes: number
  hesitant: number
  /** Offer available on this division (contested + office/knife-edge rules; ≤2/term) */
  offer: NegotiationOffer | null
  /** Projected margin ≤ 2 without the player: dress the stage before the swipe */
  knifeEdge: boolean
}

export interface BlocVotes {
  blocId: BlocId
  ayes: number
  noes: number
}

/** Numeric deltas plus the attribution lines that surface them on paper. */
export interface AppliedDeltas {
  trust: number
  conviction: number
  treasury: number
  relations: { blocId: BlocId; delta: number }[]
  zeitgeist: { axis: AxisId; delta: number }[]
  /** Printed attributions, e.g. "They say the Member has turned his coat" */
  lines: string[]
}

export interface DivisionResult {
  billId: string
  billTitle: string
  choice: VoteChoice
  ayes: number
  noes: number
  passed: boolean
  /** Player's vote decided it */
  castingVote: boolean
  byBloc: BlocVotes[]
  deltas: AppliedDeltas
  /** Ribbon for lopsided divisions; full slip for contested/knife-edge/whip/promise */
  tier: 'ribbon' | 'full'
  promiseOutcome?: { promise: ActivePromise; kept: boolean }
  whipOutcome?: { obeyed: boolean; strikes: number }
  /** The Emergency Whip was served on this division (leader coercion, −4 trust) */
  emergencyWhip?: boolean
}

/** Promises that expired unkept at the recess, with their tagged deltas —
 * surfaced before the count (pillar 6: every hidden delta names its cause). */
export interface RecessSettlement {
  broken: { blocId: BlocId; label: string }[]
  deltas: AppliedDeltas
}

export type EndingStamp =
  | 'DEFEATED'
  | 'NO CONFIDENCE'
  | 'EXPELLED'
  | 'REVOLUTION'
  | 'DISGRACED'
  | 'RETIRED WITH HONOURS'

export interface Ending {
  stamp: EndingStamp
  /** One-line cause, e.g. "Lost Halloway by 312 votes to the National swing" */
  cause: string
  victory: boolean
  /** Career ended in Term I: obituary renders the CUT SHORT variant */
  cutShort: boolean
}

export interface ElectionNight {
  /** Per-bloc seat change, in reveal order */
  swings: { blocId: BlocId; before: number; after: number }[]
  /** The player's personal count */
  seat: {
    held: boolean
    /** Itemised terms, in words + small figures (the returning-officer's note) */
    breakdown: { label: string; points: number }[]
    total: number
    margin: number
  }
  trustDelta: number
}

export interface TermsVote {
  billId: string
  billTitle: string
  choice: VoteChoice
  passed: boolean
  castingVote: boolean
  /** Global docket position at which it was taken */
  position: number
  /** |relations|+|conviction| impact — obituary signature-vote ranking */
  impact: number
}

export interface EventLogEntry {
  eventId: TermsEventId
  optionId: string
  succeeded?: boolean
  position: number
}

/** What the shell is currently displaying. Exactly one surface at a time. */
export type StageKind =
  | { kind: 'prologue' }
  | { kind: 'whipnote'; billId: string; whip: WhipDirective }
  | { kind: 'negotiation'; billId: string; offer: NegotiationOffer }
  | { kind: 'bill'; billId: string; whip?: WhipDirective; projection: DivisionProjection }
  | { kind: 'result'; result: DivisionResult }
  | { kind: 'event'; eventId: TermsEventId }
  | {
      kind: 'event_outcome'
      eventId: TermsEventId
      optionId: string
      text: string
      deltas: AppliedDeltas
      succeeded?: boolean
    }
  | { kind: 'election'; night: ElectionNight; recess?: RecessSettlement }
  | { kind: 'branch'; branch: Branch }
  | { kind: 'obituary' }

export interface TermsState {
  schemaVersion: number
  billsVersion: string
  scenarioId: string
  seed: number
  /** Monotonic docket position across the whole run (drives deadlines + roll tags) */
  position: number
  actId: string
  /** Index into the current act's slots */
  slotIndex: number
  stage: StageKind
  partyId: BlocId
  seatType: SeatType
  office: Office
  portfolio: Portfolio | null
  trust: number
  conviction: number
  treasury: number
  blocs: BlocState[]
  zeitgeist: AxisVector
  promises: ActivePromise[]
  mandates: MandateId[]
  buriedScandals: number
  /** Whip-defiance strikes this term (3 → expulsion vote; conviction >75 grants a 4th) */
  whipDefiances: number
  /** Negotiations already offered this term (budget: 2) */
  offersThisTerm: number
  /** Whip notes fired this term (budget: 2) */
  whipNotesThisTerm: number
  /** Emergency Whips served this term (leader only; budget: 1) */
  emergencyWhipsThisTerm: number
  /** Compass posterior over the player's real votes — reused test engine */
  posteriors: Posteriors
  servedBillIds: string[]
  votes: TermsVote[]
  events: EventLogEntry[]
  /** Scheduled follow-up events: fire when position reaches `at` */
  scheduled: { eventId: TermsEventId; at: number }[]
  /** Free-form run flags (marginalia seen, letters fired, ultimatum, crosses…) */
  flags: Record<string, number | boolean>
  ended: Ending | null
  termsServed: number
}

// ---- actions (event-sourced persistence) --------------------------------------

export interface TermsSetup {
  partyId: BlocId
  seatType: SeatType
}

export type TermsAction =
  /** emergencyWhip is optional and backward-compatible: undefined ⇒ false */
  | { type: 'vote'; choice: VoteChoice; emergencyWhip?: boolean }
  | { type: 'negotiate'; accept: boolean }
  | { type: 'event_option'; optionId: string }
  | { type: 'branch'; optionId: string }
  | { type: 'advance' } // dismiss slip / ribbon / election / outcome

export interface SavedTermsRun {
  id: string
  createdAt: number
  updatedAt: number
  schemaVersion: number
  billsVersion: string
  scenarioId: string
  seed: number
  setup: TermsSetup
  actions: TermsAction[]
  finished: boolean
}

// ---- obituary / archive -------------------------------------------------------

export interface Obituary {
  scenarioId: string
  seed: number
  setup: TermsSetup
  /** Branch option ids picked, in order (share/replay descriptor) */
  branchPicks: string[]
  ending: Ending
  termsServed: number
  offices: string[]
  /** The 3 highest-impact divisions with a one-line record each */
  signatureVotes: { title: string; line: string }[]
  /** Compass verdict computed from the run's real votes */
  overall: number
  overallStd: number
  axisMeans: AxisVector
  axisStds: Record<AxisId, number>
  archetypeId: string
  archetypeTitle: string
  leaderEchoes: { name: string; pct: number }[]
  partyEchoes: { name: string; pct: number }[]
  epitaph: string
  brag: {
    termsServed: number
    winningSide: number
    promisesKept: number
    promisesBroken: number
    scandalsSurvived: number
  }
  tally: { ratified: number; struck: number; abstained: number; passed: number }
  billsVersion: string
  finishedAt: number
}

export interface ArchivedCareer {
  id: string
  createdAt: number
  schemaVersion: number
  billsVersion: string
  obituary: Obituary
}

// re-exports so terms modules import shared shapes from one place
export type { Posteriors }
export type { AxisId, AxisVector, Pole }
