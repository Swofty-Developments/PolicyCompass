import type { Scenario, TermsState } from '../../types'
import { signed } from '../../../lib/format'
import { fervourLevel, relationsBand } from '../ledger/LedgerCorrespondence'
import { usePrevious } from './usePrevious'
import '../../styles/rails.css'

/** Fervour as temperature, one word per ledger band. */
const TEMPERATURE = ['calm', 'warm', 'hot', 'burning'] as const

/** THE HOUSE — pinned index cards, one per active bloc. Passive paper: the
 *  header alone opens the full ledger. */
export function HouseRail({
  state,
  scenario,
  onOpenLedger,
}: {
  state: TermsState
  scenario: Scenario
  onOpenLedger: () => void
}) {
  const prev = usePrevious(state)
  const active = state.blocs.filter((b) => b.active)
  return (
    <div className="t-rail-inner">
      <button className="t-rail-head" onClick={onOpenLedger}>
        The House
        <span className="t-rail-head-hint">ledger ›</span>
      </button>
      <div className="t-rail-scroll">
        {active.map((bs) => {
          const bloc = scenario.blocs.find((b) => b.id === bs.id)
          if (!bloc) return null
          const level = fervourLevel(bs.fervour)
          const was = prev?.blocs.find((b) => b.id === bs.id)
          const changed =
            !!was && (was.relations !== bs.relations || was.seats !== bs.seats || fervourLevel(was.fervour) !== level)
          return (
            <article className="t-railcard t-railcard--bloc" data-changed={changed || undefined} key={bs.id}>
              <header className="t-railcard-top">
                <span className="t-railcard-name">{bloc.short}</span>
                {bs.id === state.partyId && <span className="t-rail-tag">yours</span>}
                <span className="t-railcard-figure">{bs.seats} seats</span>
              </header>
              <div className="t-railcard-line">
                <span className="t-rail-tone">{relationsBand(bs.relations).word}</span>
                <span className="t-rail-fig">{signed(bs.relations)}</span>
                <span className={'t-rail-temp' + (level >= 2 ? ' hot' : '')}>{TEMPERATURE[level]}</span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
