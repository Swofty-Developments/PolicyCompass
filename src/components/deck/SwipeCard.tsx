import { animate, motion, useMotionValue, useTransform, type MotionValue, type PanInfo } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { Bill } from '../../types'
import { BillCard } from '../bill/BillCard'
import { SwipeStamps } from './SwipeStamps'

/** One bill in the deck. Owns its OWN drag value, so a fresh card always starts at
 *  x=0 (no accumulating drift). On commit it flies off, then unmounts — there is no
 *  shared state to reset, so the old content never flashes back to centre. The next
 *  card promotes up from the docket and its writing inks into the blank sheet. */
export function SwipeCard({
  bill,
  billNumber,
  total,
  dragX,
  onCommit,
}: {
  bill: Bill
  billNumber: number
  total: number
  dragX: MotionValue<number>
  onCommit: (dir: 1 | -1) => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-320, 320], [-9, 9])
  const ratifyOp = useTransform(x, [30, 120], [0, 1])
  const strikeOp = useTransform(x, [-120, -30], [1, 0])
  const committing = useRef(false)

  useEffect(() => {
    dragX.set(0)
  }, [dragX])

  function decide(dir: 1 | -1) {
    if (committing.current) return
    committing.current = true
    animate(x, dir * 1500, { duration: 0.32, ease: 'easeIn', onComplete: () => onCommit(dir) })
  }
  function handleDrag() {
    dragX.set(x.get())
  }
  function handleDragEnd(_e: unknown, info: PanInfo) {
    const dx = info.offset.x
    const vx = info.velocity.x
    if (dx > 120 || vx > 700) decide(1)
    else if (dx < -120 || vx < -700) decide(-1)
    else {
      animate(x, 0, { type: 'spring', stiffness: 280, damping: 28 })
      animate(dragX, 0, { type: 'spring', stiffness: 280, damping: 28 })
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') decide(1)
      else if (e.key === 'ArrowLeft') decide(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="cardwrap"
      drag={committing.current ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
    >
      <div className="cardinner entering">
        <BillCard bill={bill} billNumber={billNumber} total={total} />
      </div>
      <SwipeStamps strikeOp={strikeOp} ratifyOp={ratifyOp} />
    </motion.div>
  )
}
