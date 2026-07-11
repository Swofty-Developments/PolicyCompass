import { useMotionValue, useTransform } from 'framer-motion'
import type { Bill, Conviction, VoteVerdict } from '../../types'
import { SwipeCard } from './SwipeCard'
import { SwipeGutter } from './SwipeGutter'
import '../../styles/deck.css'

export function SwipeDeck({
  bill,
  billNumber,
  maxTarget,
  locked,
  onVote,
}: {
  bill: Bill
  billNumber: number
  maxTarget: number
  locked: boolean
  onVote: (input: { verdict: VoteVerdict; conviction?: Conviction }) => void
}) {
  const dragX = useMotionValue(0)
  const leftGlow = useTransform(dragX, [-200, -20], [0.85, 0])
  const rightGlow = useTransform(dragX, [20, 200], [0, 0.85])

  return (
    <div className="deck-row">
      <SwipeGutter side="l" label="Strike Down" glow={leftGlow} />

      <div className="stage">
        <div className="peek p2" />
        <div className="peek p1" />
        {/* keyed by bill.id → the old card unmounts (already off-screen) and the next
            card mounts and promotes up from the docket. No AnimatePresence, no drift. */}
        <SwipeCard key={bill.id} bill={bill} billNumber={billNumber} maxTarget={maxTarget} dragX={dragX} locked={locked} onCommit={onVote} />
      </div>

      <SwipeGutter side="r" label="Ratify" glow={rightGlow} />
    </div>
  )
}
