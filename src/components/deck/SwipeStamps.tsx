import { motion, useTransform, type MotionValue } from 'framer-motion'
import { COMMIT_DX, DRAG_ELASTIC, FIRM_DX } from './SwipeCard'

/** Drag-reactive verdict stamps. x/y are the elastic-scaled ELEMENT values, so the
 *  card's pointer-px thresholds are scaled by DRAG_ELASTIC: the grading on screen at
 *  any drag position is exactly what a release there would record. "reluctantly" is
 *  full at the commit threshold and crossfades to "WITH CONVICTION" at the firm one;
 *  downward drag fades the ABSTAINED stamp to full at its commit threshold. */
export function SwipeStamps({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  const commit = COMMIT_DX * DRAG_ELASTIC
  const firm = FIRM_DX * DRAG_ELASTIC
  const ratifyOp = useTransform(x, [commit * 0.25, commit], [0, 1])
  const strikeOp = useTransform(x, [-commit, -commit * 0.25], [1, 0])
  const abstainOp = useTransform(y, [commit * 0.25, commit], [0, 1])
  const ratifySoft = useTransform(x, [commit - 12, commit, firm - 14, firm], [0, 1, 1, 0])
  const ratifyFirm = useTransform(x, [firm - 14, firm], [0, 1])
  const strikeSoft = useTransform(x, [-firm, -firm + 14, -commit, -commit + 12], [0, 1, 1, 0])
  const strikeFirm = useTransform(x, [-firm, -firm + 14], [1, 0])

  return (
    <>
      <motion.div className="stamp-overlay strike" style={{ opacity: strikeOp }}>
        STRIKE DOWN
        <span className="stamp-sub">
          <motion.span className="soft" style={{ opacity: strikeSoft }}>reluctantly</motion.span>
          <motion.span className="firm" style={{ opacity: strikeFirm }}>WITH CONVICTION</motion.span>
        </span>
      </motion.div>
      <motion.div className="stamp-overlay ratify" style={{ opacity: ratifyOp }}>
        RATIFY
        <span className="stamp-sub">
          <motion.span className="soft" style={{ opacity: ratifySoft }}>reluctantly</motion.span>
          <motion.span className="firm" style={{ opacity: ratifyFirm }}>WITH CONVICTION</motion.span>
        </span>
      </motion.div>
      <motion.div className="stamp-overlay abstain" style={{ opacity: abstainOp }}>ABSTAINED</motion.div>
    </>
  )
}
