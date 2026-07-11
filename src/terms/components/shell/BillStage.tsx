import type { Bill } from '../../../types'
import { SwipeDeck } from '../../../components/deck/SwipeDeck'
import type { VoteChoice } from '../../types'
import { DocketFrame } from './DocketFrame'

/** Deck adapter: the one seam between Terms and the compass deck. Maps the
 *  binary commit to a Terms vote (abstain arrives with feat/engagement). */
export function BillStage({
  bill,
  divisionNo,
  divisionsTotal,
  actTitle,
  officeLabel,
  knifeEdge,
  onOpenLedger,
  onExit,
  onAbandon,
  onVote,
}: {
  bill: Bill
  divisionNo: number
  divisionsTotal: number
  actTitle: string
  officeLabel: string
  knifeEdge: boolean
  onOpenLedger: () => void
  onExit: () => void
  onAbandon: () => void
  onVote: (choice: VoteChoice) => void
}) {
  return (
    <DocketFrame
      actTitle={actTitle}
      positionLabel={`Division ${divisionNo} of ${divisionsTotal}`}
      officeLabel={officeLabel}
      knifeEdge={knifeEdge}
      onOpenLedger={onOpenLedger}
      onExit={onExit}
      onAbandon={onAbandon}
    >
      <SwipeDeck
        bill={bill}
        billNumber={divisionNo}
        total={divisionsTotal}
        onVote={(ratified) => onVote(ratified ? 'ratify' : 'strike')}
      />
    </DocketFrame>
  )
}
