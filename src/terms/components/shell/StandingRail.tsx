import type { Scenario, TermsState } from '../../types'
import { blocLabel } from '../artifacts/bits'
import { memoLines } from '../ledger/Ledger'
import { dueLine } from '../ledger/LedgerBooks'
import { usePrevious } from './usePrevious'
import '../../styles/rails.css'

const REDACT_WIDTHS = ['86%', '64%', '78%']

/** THE STANDING — the pollster's figures beside their threshold lines, then
 *  promises, pinned mandates, and the editor's redacted clippings. Passive
 *  paper: the header alone opens the full ledger. */
export function StandingRail({
  state,
  scenario,
  onOpenLedger,
}: {
  state: TermsState
  scenario: Scenario
  onOpenLedger: () => void
}) {
  const prev = usePrevious(state)
  const lines = memoLines(state)
  const prevLines = prev ? memoLines(prev) : null
  const held = state.mandates
    .map((id) => scenario.mandates.find((m) => m.id === id))
    .filter((m) => m !== undefined)

  return (
    <div className="t-rail-inner">
      <button className="t-rail-head" onClick={onOpenLedger}>
        The Standing
        <span className="t-rail-head-hint">ledger ›</span>
      </button>
      <div className="t-rail-scroll">
        <article className="t-railcard t-railcard--memo">
          {lines.map((l) => {
            const was = prevLines?.find((p) => p.k === l.k)
            const changed = !!was && was.n !== l.n
            return (
              <p
                className={'t-rail-memo' + (l.alert ? ' alert' : '')}
                data-changed={changed || undefined}
                key={l.k}
              >
                <span className="t-rail-memo-k">{l.k}</span> <span className="t-rail-memo-n">{l.n}</span>{' '}
                <span className="t-rail-memo-note">— {l.note}</span>
              </p>
            )
          })}
        </article>

        {state.promises.length > 0 && <div className="t-rail-sec">On the books</div>}
        {state.promises.map((p) => {
          const isNew = !!prev && !prev.promises.some((x) => x.id === p.id)
          return (
            <article className="t-railcard t-railcard--promise" data-changed={isNew || undefined} key={p.id}>
              <header className="t-railcard-top">
                <span className="t-railcard-name">{blocLabel(p.blocId, scenario.blocs)}</span>
                <span className="t-railcard-figure due">{dueLine(p.deadline, state.position)}</span>
              </header>
              <p className="t-rail-promise-label">{p.label}</p>
            </article>
          )
        })}

        {held.length > 0 && <div className="t-rail-sec">Mandates held</div>}
        {held.map((m) => (
          <article className="t-railcard t-railcard--mandate" key={m.id}>
            <div className="t-rail-mandate-title">{m.title}</div>
          </article>
        ))}

        {state.buriedScandals > 0 && <div className="t-rail-sec">The editor’s safe</div>}
        {Array.from({ length: state.buriedScandals }, (_, i) => (
          <article className="t-railcard t-railcard--clipping" key={i}>
            <div className="t-rail-clip-kick">Held over · by arrangement</div>
            {REDACT_WIDTHS.slice(0, 2 + (i % 2)).map((w, j) => (
              <i className="t-redact" style={{ width: w }} key={j} />
            ))}
          </article>
        ))}
      </div>
    </div>
  )
}
