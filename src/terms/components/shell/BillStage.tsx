import { useState } from 'react'
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
  emergencyWhip,
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
  /** Leader-only Emergency Whip: null hides the control, spent disables it */
  emergencyWhip: { spent: boolean } | null
  onOpenLedger: () => void
  onExit: () => void
  onAbandon: () => void
  onVote: (choice: VoteChoice, emergencyWhip: boolean) => void
}) {
  // Armed before the swipe; the reducer guards office/budget/abstain again.
  const [whipArmed, setWhipArmed] = useState(false)
  return (
    <DocketFrame
      actTitle={actTitle}
      positionLabel={`Division ${divisionNo} of ${divisionsTotal}`}
      officeLabel={officeLabel}
      knifeEdge={knifeEdge}
      ledgerUnlocked={ledgerUnlocked}
      whipControl={
        emergencyWhip ? (
          <button
            className={'t-strip-btn t-whip' + (whipArmed ? ' arm' : '')}
            disabled={emergencyWhip.spent}
            onClick={() => setWhipArmed((a) => !a)}
            title={
              emergencyWhip.spent
                ? 'The Emergency Whip is spent for the term'
                : 'Force the party’s hesitants behind your vote — confidence −4'
            }
          >
            {emergencyWhip.spent ? 'Whip Spent' : whipArmed ? 'Whip Armed −4' : 'Three-Line Whip'}
          </button>
        ) : undefined
      }
      onOpenLedger={onOpenLedger}
      onExit={onExit}
      onAbandon={onAbandon}
    >
      <SwipeDeck
        bill={bill}
        billNumber={divisionNo}
        maxTarget={divisionsTotal}
        locked={false}
        onVote={(input) => onVote(input.verdict as VoteChoice, whipArmed)}
      />
    </DocketFrame>
  )
}
