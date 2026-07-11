// ============================================================================
// Policy Compass — core domain & scoring contracts.
// Every data file (bills, leaders, parties, archetypes) and the engine depend
// on these shapes. The spectrum is a single axis: -1 = Communist, +1 = Fascist.
// ============================================================================

export type AxisId = 'economic' | 'fiscal' | 'social' | 'identity' | 'law_order'

export const AXIS_IDS: AxisId[] = ['economic', 'fiscal', 'social', 'identity', 'law_order']

export interface AxisMeta {
  id: AxisId
  /** Short display name, e.g. "Economic" */
  name: string
  /** One-line description of what the axis measures */
  blurb: string
}

/** Which pole ratifying a bill indicates. left = Communist (-1), right = Fascist (+1). */
export type Pole = 'left' | 'right'

/** What the player did with a bill. Abstain serves the card but adds no evidence. */
export type VoteVerdict = 'ratify' | 'strike' | 'abstain'

/** How hard the swipe was — reluctant votes carry tempered evidence weight. */
export type Conviction = 'firm' | 'reluctant'

/**
 * One axis a bill loads on, with its ideological placement and signal strength.
 * Scoring model (per axis): a YES on this bill is evidence that the voter's
 * latent position θ lies toward `direction` by at least `extremity`.
 *   dir = (direction === 'right') ? +1 : -1
 *   loc = dir * extremity                        // signed location on [-1, 1]
 *   a   = A_MIN + clarity * (A_MAX - A_MIN)       // logistic discrimination
 *   P(ratify | θ) = sigmoid( a * dir * (θ - loc) )
 */
export interface AxisLoading {
  axis: AxisId
  direction: Pole
  /** 0 (centrist) .. 1 (textbook/historical extreme) */
  extremity: number
  /** 0.2 (valence, barely ideological) .. 1 (stark, unambiguous) */
  clarity: number
}

export interface StatChip {
  /** Big number/string, e.g. "40→32" or "76%" */
  value: string
  /** Small caption under it, e.g. "hours / week" */
  label: string
}

export interface AnalystSource {
  name: string
  url: string
}

export interface AnalystPoint {
  /** Short stat pill, e.g. "92%" or "overstated" */
  stat: string
  /** The sentence; may reference the stat */
  text: string
  source: AnalystSource
}

export interface ExhibitBar {
  label: string
  /** Numeric value used for height */
  value: number
  /** How the value is printed above the bar, e.g. "1,810" */
  display: string
  /** Highlight (red) bar — usually the "this is the problem" one */
  highlight?: boolean
}

export interface ExhibitSeriesPoint {
  x: string
  y: number
}

export interface ExhibitSeries {
  label: string
  tone?: 'left' | 'right' | 'neutral'
  points: ExhibitSeriesPoint[]
}

/** The "Exhibit A" data graphic that makes the Current Problem legible at a glance. */
export interface ExhibitChart {
  kind: 'bar' | 'line'
  /** Stamp label, e.g. "EXHIBIT A · AVG ANNUAL HOURS WORKED · 2022 (OECD)" */
  label: string
  /** Small honesty/source note under the chart */
  unitNote?: string
  bars?: ExhibitBar[]
  series?: ExhibitSeries[]
  /** Handwritten annotation pointing at a specific bar/series by its label */
  annotation?: { text: string; target: string }
}

export interface Bill {
  id: string
  /** Roleplay "Bill Nº" shown on the card */
  number: number
  title: string
  /** Subtitle question framing the tension */
  dek: string
  /** Hidden provenance — never rendered on the card; powers leader/party echo & audit */
  provenance: {
    sponsor: string
    country: string
    year: string
    note?: string
  }
  /** The Current Problem prose */
  problem: string
  /** Substrings within `problem` to <mark> highlight */
  problemHighlights?: string[]
  exhibit: ExhibitChart
  /** The Offer prose */
  offer: string
  offerHighlights?: string[]
  /** The Intent prose */
  intent: string
  /** 2–3 pulled key figures */
  stats: StatChip[]
  analysisFor: AnalystPoint[]
  analysisAgainst: AnalystPoint[]
  /** 1 primary loading (+ optional secondary). loadings[0] is the primary axis. */
  loadings: AxisLoading[]
}

export type AxisVector = Record<AxisId, number> // each component in [-1, 1]

export interface Leader {
  name: string
  country: string
  era: string
  vector: AxisVector
  blurb: string
}

export interface Party {
  name: string
  country: string
  vector: AxisVector
}

export interface Archetype {
  id: string
  title: string
  blurb: string
  prototype: AxisVector
}

/** Per-axis ideology label for each of the 7 spectrum zones (hover context). */
export type ZoneLabels = Record<AxisId, string[]>

// ---- engine output shapes -------------------------------------------------

export interface AxisResult {
  axis: AxisId
  /** posterior mean position, -1..1 */
  mean: number
  /** posterior std (the "variation band" half-width is derived from this) */
  std: number
  /** 0..1 confidence (1 - std/STD_MAX) */
  certainty: number
  zoneIndex: number
}

export interface VoteRecord {
  billId: string
  billNumber: number
  title: string
  verdict: VoteVerdict
  /** Present on ratify/strike; abstains carry no conviction */
  conviction?: Conviction
  /** mean change per affected axis, scaled ×100 and rounded (− = leftward) */
  deltas: { axis: AxisId; delta: number }[]
  /** overall certainty change for affected axes, ×100 */
  certaintyDelta: number
}

export interface Verdict {
  axes: AxisResult[]
  overall: number
  overallStd: number
  archetype: Archetype
  leaders: { leader: Leader; pct: number }[]
  parties: { party: Party; pct: number }[]
  tally: { ratified: number; struck: number; abstained: number; total: number }
  certainty: number
  history: VoteRecord[]
}
