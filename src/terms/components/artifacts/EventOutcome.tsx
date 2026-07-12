import type { AppliedDeltas } from '../../types'
import { DeltaLines } from './bits'
import '../../styles/terms.css'

/** The chit reporting how an event option resolved, with its priced ledger. */
export function EventOutcome({
  title,
  text,
  deltas,
  succeeded,
  onDismiss,
}: {
  title: string
  text: string
  deltas: AppliedDeltas
  succeeded?: boolean
  onDismiss: () => void
}) {
  return (
    <div className="t-artifact-wrap">
      <div className="t-flip t-flip--outcome">
        <div className="t-paper t-paper--outcome">
          <i className="t-grain" aria-hidden />
          {succeeded !== undefined && (
            <span className={'stamp t-stamp' + (succeeded ? ' t-stamp-green' : '')}>
              {succeeded ? 'IN YOUR FAVOUR' : 'AGAINST YOU'}
            </span>
          )}
          <div className="t-kick">The Outcome</div>
          <h2 className="t-title">{title}</h2>
          <div className="t-paper-scroll">
            <p className="t-body t-outcome-text">{text}</p>
            <DeltaLines deltas={deltas} />
          </div>
          <button className="t-btn t-dismiss" onClick={onDismiss}>Carry on</button>
        </div>
      </div>
    </div>
  )
}
