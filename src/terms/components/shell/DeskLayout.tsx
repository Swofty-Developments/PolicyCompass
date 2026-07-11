import type { ReactNode } from 'react'
import type { Scenario, TermsState } from '../../types'
import { HouseRail } from './HouseRail'
import { StandingRail } from './StandingRail'
import '../../styles/rails.css'

/** The standing rail (and every ledger affordance) unlocks when the pollster's
 *  memo is filed — the event log is the persistent signal, so replays and
 *  resumes reveal identically. */
export const standingDisclosed = (state: TermsState): boolean =>
  state.events.some((e) => e.eventId === 'ev-memo-pollster')

/** The house rail unlocks when the whip first leans on you — the engine sets
 *  this flag when the first whip-note stage is staged, and never clears it. */
export const houseDisclosed = (state: TermsState): boolean => Boolean(state.flags['seen:whipnote'])

/** The desk during run stages: two pinned index-card rails flank the centre
 *  paper on ≥1200px viewports. Rails are chrome, not surfaces — the centre
 *  column keeps the one-surface-at-a-time invariant, and empty rail columns
 *  stay reserved so the paper never jumps when a rail is disclosed. */
export function DeskLayout({
  state,
  scenario,
  onOpenLedger,
  children,
}: {
  state: TermsState
  scenario: Scenario
  onOpenLedger: () => void
  children: ReactNode
}) {
  return (
    <div className="desk t-deskgrid">
      <aside className="t-rail t-rail--house" aria-label="The House">
        {houseDisclosed(state) && <HouseRail state={state} scenario={scenario} onOpenLedger={onOpenLedger} />}
      </aside>
      <div className="t-desk-centre">{children}</div>
      <aside className="t-rail t-rail--standing" aria-label="The Standing">
        {standingDisclosed(state) && (
          <StandingRail state={state} scenario={scenario} onOpenLedger={onOpenLedger} />
        )}
      </aside>
    </div>
  )
}
