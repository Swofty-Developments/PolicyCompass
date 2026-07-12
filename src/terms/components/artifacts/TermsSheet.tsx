import type { Bloc, NegotiationOffer } from '../../types'
import '../../styles/terms.css'

/** The bargaining sheet: sign the terms or return the paper unsigned. */
export function TermsSheet({
  offer,
  bloc,
  billTitle,
  onDecide,
}: {
  offer: NegotiationOffer
  bloc: Bloc
  billTitle: string
  onDecide: (accept: boolean) => void
}) {
  const p = offer.promise
  return (
    <div className="t-artifact-wrap">
      <div className="t-flip t-flip--sheet">
        <div className="t-paper t-paper--sheet">
          <i className="t-grain" aria-hidden />
          <header>
            <div className="t-sheet-letterhead">{bloc.name}</div>
            <div className="t-sheet-sub">Parliamentary Office · Without Prejudice</div>
          </header>
          <div className="t-kick">Memorandum of Terms</div>
          <div className="t-paper-scroll">
            <p className="t-body">{offer.text}</p>
            <ol className="t-sheet-terms">
              <li>
                <span className="t-term-label">The undertaking. </span>
                {p.label}
              </li>
              <li>
                <span className="t-term-label">The consideration. </span>
                {offer.seats} of our seats follow the Member into the lobby on “{billTitle}”.
              </li>
              <li>
                <span className="t-term-label">The term. </span>
                To be discharged before division {p.deadline} of this Parliament. A promise broken is not forgiven.
              </li>
            </ol>
          </div>
          <div className="t-sheet-signatures">
            <div className="t-sig">
              <span className="t-sig-scrawl">for {bloc.short}</span>
              <div className="t-sig-rule" />
              <div className="t-sig-cap">for {bloc.name}</div>
            </div>
            <div className="t-sig">
              <span className="t-sig-scrawl blank">.</span>
              <div className="t-sig-rule" />
              <div className="t-sig-cap">The Member for Halloway</div>
            </div>
          </div>
          <div className="t-sheet-actions">
            <button className="t-btn solid" onClick={() => onDecide(true)}>Sign the terms</button>
            <button className="t-btn quiet" onClick={() => onDecide(false)}>Return unsigned</button>
          </div>
        </div>
      </div>
    </div>
  )
}
