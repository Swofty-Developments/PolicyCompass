import type { TermsState } from '../../types'

/** First-run one-shot marginalia (the onboarding hand notes). Positional, so
 *  replay stays pure: each note keys to a state the run passes exactly once. */
export function marginaliaFor(state: TermsState, surface: 'whipnote' | 'slip'): string | undefined {
  if (state.termsServed > 0) return undefined
  if (state.flags[`seen.margin.${surface}`]) return undefined
  if (surface === 'whipnote' && state.whipNotesThisTerm <= 1)
    return 'A division is a vote of the whole House, and this card is your party’s order for it. Defy it and your Relations with the party drop — twice as hard from a safe seat.'
  if (surface === 'slip' && state.votes.length === 2)
    return 'Your single vote rarely decides whether a bill passes — the whole House does. But how you voted is on your record for good.'
  return undefined
}
