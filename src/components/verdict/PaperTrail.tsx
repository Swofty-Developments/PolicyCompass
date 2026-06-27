import type { VoteRecord } from '../../types'
import { axisMeta } from '../../engine/axes'
import { signed } from '../../lib/format'

export function PaperTrail({ history, onBack }: { history: VoteRecord[]; onBack: () => void }) {
  return (
    <div className="desk verdict-wrap">
      <div className="sheet ledger">
        <div className="trail-head">
          <h2>The Paper Trail</h2>
          <span className="cap">Every vote and exactly how it moved you. (− leftward · + rightward)</span>
          <button className="v-btn" style={{ marginLeft: 'auto' }} onClick={onBack}>← Back to Standing</button>
        </div>
        <div className="trail-log">
          {history.map((h, i) => (
            <div className="tentry" key={i}>
              <span className={'tvote ' + (h.ratified ? 'yes' : 'no')}>{h.ratified ? 'RATIFIED' : 'STRUCK'}</span>
              <div className="tbill">
                <div className="t">{h.title}</div>
                <div className="k">Bill Nº {h.billNumber}</div>
              </div>
              <div className="tdeltas">
                {h.deltas.map((d, j) => (
                  <span className={'delta ' + (d.delta < 0 ? 'left' : 'right')} key={j}>
                    {axisMeta(d.axis).name} {signed(d.delta)}
                  </span>
                ))}
                <span className="delta cert">certainty {signed(h.certaintyDelta)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
