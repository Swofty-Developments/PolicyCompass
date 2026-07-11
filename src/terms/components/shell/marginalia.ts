import type { TermsState } from '../../types'

/** First-run one-shot marginalia (the onboarding hand notes). Positional, so
 *  replay stays pure: each note keys to a state the run passes exactly once. */
export function marginaliaFor(state: TermsState, surface: 'whipnote' | 'slip'): string | undefined {
  if (state.termsServed > 0) return undefined
  if (state.flags[`seen.margin.${surface}`]) return undefined
  if (surface === 'whipnote' && state.whipNotesThisTerm <= 1)
    return 'The party watches every division. Cross the whip and your own benches cool — relations, they call it.'
  if (surface === 'slip' && state.votes.length === 2)
    return 'The House passes bills, not you — but the record is yours.'
  return undefined
}
