import type { Bill } from '../../../types'
import { SwipeDeck } from '../../../components/deck/SwipeDeck'
import type { VoteChoice } from '../../types'
import { DocketFrame } from './DocketFrame'

/** Deck adapter: the one seam between Terms and the compass deck. The deck's
 *  graded conviction is compass-only; a Terms division reads the verdict alone. */
export function BillStage({
  bill,
  divisionNo,
  divisionsTotal,
  actTitle,
  officeLabel,
  knifeEdge,
  ledgerUnlocked,
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
  ledgerUnlocked: boolean
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
      ledgerUnlocked={ledgerUnlocked}
      onOpenLedger={onOpenLedger}
      onExit={onExit}
      onAbandon={onAbandon}
    >
      <SwipeDeck
        bill={bill}
        billNumber={divisionNo}
        maxTarget={divisionsTotal}
        locked={false}
        onVote={(input) => onVote(input.verdict as VoteChoice)}
      />
    </DocketFrame>
  )
}
