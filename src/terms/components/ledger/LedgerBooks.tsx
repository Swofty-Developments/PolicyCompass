import type { Scenario, TermsState } from '../../types'
import { blocLabel } from '../artifacts/bits'

const REDACT_WIDTHS = ['84%', '92%', '71%', '88%', '55%']

/** "falls due in N divisions" — shared by the ledger books and the standing rail. */
export function dueLine(deadline: number, position: number): string {
  const n = deadline - position
  if (n <= 0) return 'falls due now'
  return `falls due in ${n} division${n === 1 ? '' : 's'}`
}

/** Promises on the books, pinned mandate cards, and the buried clippings. */
export function LedgerBooks({ state, scenario }: { state: TermsState; scenario: Scenario }) {
  const held = state.mandates
    .map((id) => scenario.mandates.find((m) => m.id === id))
    .filter((m) => m !== undefined)
  const reserved = held.filter((m) => m.hooks.reservesPromiseSlot).length
  const slots = (state.seatType === 'marginal' ? 4 : 3) - reserved

  return (
    <>
      <div className="t-ledger-sec">
        Promises on the Books
        <span className="note">
          {state.promises.length} of {slots} slots engaged
          {reserved > 0 ? ' · one held by your patron' : ''}
        </span>
      </div>
      {state.promises.length === 0 ? (
        <p className="t-ledger-empty">No undertakings outstanding. The blocs know what that is worth.</p>
      ) : (
        state.promises.map((p) => (
          <div className="t-promise" key={p.id}>
            <span className="t-promise-bloc">{blocLabel(p.blocId, scenario.blocs)}</span>
            <span className="t-promise-label">{p.label}</span>
            <span className="t-promise-due">{dueLine(p.deadline, state.position)}</span>
          </div>
        ))
      )}

      {held.length > 0 && (
        <>
          <div className="t-ledger-sec">Mandates Held</div>
          <div className="t-mandate-pins">
            {held.map((m) => (
              <div className="t-mandate-pin" key={m.id}>
                <div className="pt-patron">{m.patron}</div>
                <div className="pt-title">{m.title}</div>
                <div className="pt-text">{m.text}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {state.buriedScandals > 0 && (
        <>
          <div className="t-ledger-sec">
            From the Editor’s Safe
            <span className="note">buried, not gone</span>
          </div>
          {Array.from({ length: state.buriedScandals }, (_, i) => (
            <div className="t-clipping" key={i}>
              <div className="t-clipping-kick">Held over · by arrangement</div>
              {REDACT_WIDTHS.slice(0, 3 + (i % 2)).map((w, j) => (
                <i className="t-redact" style={{ width: w }} key={j} />
              ))}
              <div className="t-clipping-note">
                {i === 0 ? 'the editor keeps the affidavit in his safe.' : 'a second story would break them both.'}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  )
}
