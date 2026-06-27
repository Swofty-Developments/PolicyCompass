import { motion, type MotionValue } from 'framer-motion'

export function SwipeStamps({ strikeOp, ratifyOp }: { strikeOp: MotionValue<number>; ratifyOp: MotionValue<number> }) {
  return (
    <>
      <motion.div className="stamp-overlay strike" style={{ opacity: strikeOp }}>STRIKE DOWN</motion.div>
      <motion.div className="stamp-overlay ratify" style={{ opacity: ratifyOp }}>RATIFY</motion.div>
    </>
  )
}
