import type { WhipDirective } from '../../types'
import '../../styles/terms.css'

/** The whip's handwritten card, slipped under the door before a named division. */
export function WhipNoteCard({
  whip,
  billTitle,
  partyShort,
  marginNote,
  onDismiss,
}: {
  whip: WhipDirective
  billTitle: string
  partyShort: string
  marginNote?: string
  onDismiss: () => void
}) {
  return (
    <div className="t-artifact-wrap">
      <div className="t-flip t-flip--whipnote">
        <div className="t-paper t-paper--whipnote">
          <i className="t-grain" aria-hidden />
          <div className="t-whip-head">
            <span className="t-whip-office">Office of the Chief Whip</span>
            <span className="t-whip-party">{partyShort} · in confidence</span>
          </div>
          <div className="t-whip-re">On the division: “{billTitle}”</div>
          <div className="t-whip-note">{whip.note}</div>
          <div className="t-whip-directive">
            The party votes <b>{whip.ratify ? 'AYE' : 'NO'}</b>.
          </div>
          {marginNote && <div className="t-margin-note">{marginNote}</div>}
          <button className="t-btn t-whip-ack" onClick={onDismiss}>Understood</button>
        </div>
      </div>
    </div>
  )
}
