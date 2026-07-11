import { animate, motion, useMotionValue, useTransform, type MotionValue, type PanInfo } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { Bill, Conviction, VoteVerdict } from '../../types'
import { BillCard } from '../bill/BillCard'
import { SwipeStamps } from './SwipeStamps'

/** Commit / firm-conviction thresholds (raw pointer px offset, px/s velocity). */
export const COMMIT_DX = 120
const COMMIT_VX = 700
export const FIRM_DX = 250
const FIRM_VX = 1400
/** With all-zero constraints the element moves DRAG_ELASTIC × the pointer offset. */
export const DRAG_ELASTIC = 0.65

/** One bill in the deck. Owns its OWN drag values, so a fresh card always starts at
 *  x=y=0 (no accumulating drift). On commit it flies off, then unmounts — there is no
 *  shared state to reset, so the old content never flashes back to centre. The next
 *  card promotes up from the docket and its writing inks into the blank sheet.
 *  Right/left = ratify/strike (distance grades the conviction); down = abstain. */
export function SwipeCard({
  bill,
  billNumber,
  maxTarget,
  dragX,
  locked,
  onCommit,
}: {
  bill: Bill
  billNumber: number
  maxTarget: number
  dragX: MotionValue<number>
  /** True while the reveal slip is open above the card — drag & keys are inert. */
  locked: boolean
  onCommit: (input: { verdict: VoteVerdict; conviction?: Conviction }) => void
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-320, 320], [-9, 9])
  const committing = useRef(false)
  const lockedAxis = useRef<'x' | 'y' | null>(null)

  useEffect(() => {
    dragX.set(0)
  }, [dragX])

  function decide(verdict: 'ratify' | 'strike', conviction: Conviction) {
    if (committing.current) return
    committing.current = true
    const dir = verdict === 'ratify' ? 1 : -1
    animate(x, dir * 1500, { duration: 0.32, ease: 'easeIn', onComplete: () => onCommit({ verdict, conviction }) })
  }
  function abstain() {
    if (committing.current) return
    committing.current = true
    animate(y, 1200, { duration: 0.32, ease: 'easeIn', onComplete: () => onCommit({ verdict: 'abstain' }) })
  }
  function handleDrag() {
    dragX.set(x.get())
  }
  function settle() {
    animate(x, 0, { type: 'spring', stiffness: 280, damping: 28 })
    animate(y, 0, { type: 'spring', stiffness: 280, damping: 28 })
    animate(dragX, 0, { type: 'spring', stiffness: 280, damping: 28 })
  }
  function handleDragEnd(_e: unknown, info: PanInfo) {
    // Offsets are raw pointer deltas, unaffected by the direction lock — decide only
    // along the axis the card actually moved on, so an arcing thumb can't cast the
    // other axis's verdict behind the stamp being shown.
    const axis = lockedAxis.current
    lockedAxis.current = null
    if (axis === 'x') {
      const dx = info.offset.x
      const vx = info.velocity.x
      const conviction: Conviction = Math.abs(dx) >= FIRM_DX || Math.abs(vx) >= FIRM_VX ? 'firm' : 'reluctant'
      if (dx > COMMIT_DX || vx > COMMIT_VX) return decide('ratify', conviction)
      if (dx < -COMMIT_DX || vx < -COMMIT_VX) return decide('strike', conviction)
    } else if (axis === 'y') {
      if (info.offset.y > COMMIT_DX || info.velocity.y > COMMIT_VX) return abstain()
    }
    settle()
  }

  useEffect(() => {
    if (locked) return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === 'ArrowRight') decide('ratify', e.shiftKey ? 'reluctant' : 'firm')
      else if (e.key === 'ArrowLeft') decide('strike', e.shiftKey ? 'reluctant' : 'firm')
      else if (e.key === 'ArrowDown') abstain()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked])

  return (
    <motion.div
      className="cardwrap"
      drag={!locked && !committing.current}
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={DRAG_ELASTIC}
      onDirectionLock={(axis) => { lockedAxis.current = axis }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate }}
    >
      <div className="cardinner entering">
        <BillCard bill={bill} billNumber={billNumber} maxTarget={maxTarget} />
      </div>
      <SwipeStamps x={x} y={y} />
    </motion.div>
  )
}
