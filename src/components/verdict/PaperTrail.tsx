import type { VoteRecord } from '../../types'
import { bills } from '../../data'
import { axisMeta } from '../../engine/axes'
import { signed } from '../../lib/format'

const billById = new Map(bills.map((b) => [b.id, b]))

const VOTE_LABEL = { ratify: 'RATIFIED', strike: 'STRUCK', abstain: 'ABSTAINED' } as const
const VOTE_CLASS = { ratify: 'yes', strike: 'no', abstain: 'abstain' } as const

export function PaperTrail({ history, onBack }: { history: VoteRecord[]; onBack: () => void }) {
  return (
    <div className="desk verdict-wrap">
      <div className="sheet ledger">
        <div className="trail-head">
          <h2>The Paper Trail</h2>
          <span className="cap">Every vote, its sponsor unsealed, and exactly how it moved you. (− leftward · + rightward)</span>
          <button className="v-btn" style={{ marginLeft: 'auto' }} onClick={onBack}>← Back to Standing</button>
        </div>
        <div className="trail-log">
          {history.map((h, i) => {
            const bill = billById.get(h.billId)
            return (
              <div className="tentry" key={i}>
                <span className={'tvote ' + VOTE_CLASS[h.verdict]}>
                  {VOTE_LABEL[h.verdict]}
                  {h.conviction === 'reluctant' && <span className="treluctant"> (reluctantly)</span>}
                </span>
                <div className="tbill">
                  <div className="t">{h.title}</div>
                  <div className="k">Bill Nº {h.billNumber}</div>
                  {bill && (
                    <div className="tprov">{bill.provenance.sponsor} — {bill.provenance.country}, {bill.provenance.year}</div>
                  )}
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
