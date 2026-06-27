import { animate, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { useCallback, useEffect, useRef } from 'react'

export interface SwipeOptions {
  distance?: number
  velocity?: number
  /** Attach Left/Right arrow-key commits. Off by default (the home must not commit on arrows). */
  keyboard?: boolean
}

/**
 * Swipe-to-decide for a draggable card. Owns the motion values (so gutters and
 * stamps can react to drag), commit animation, and optional keyboard arrows.
 * Spread `dragProps` onto a motion.div.
 */
export function useSwipe(resetKey: string, onCommit: (dir: 1 | -1) => void, opts: SwipeOptions = {}) {
  const distance = opts.distance ?? 120
  const velocity = opts.velocity ?? 700

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-320, 320], [-9, 9])
  const leftGlow = useTransform(x, [-200, -20], [0.85, 0])
  const rightGlow = useTransform(x, [20, 200], [0, 0.85])
  // Stamps reach full opacity right at the commit threshold so feedback matches the action.
  const ratifyOp = useTransform(x, [30, distance], [0, 1])
  const strikeOp = useTransform(x, [-distance, -30], [1, 0])
  const committing = useRef(false)

  useEffect(() => {
    committing.current = false
    x.set(0)
  }, [resetKey, x])

  const decide = useCallback(
    (dir: 1 | -1) => {
      if (committing.current) return
      committing.current = true
      animate(x, dir * 1500, {
        type: 'tween',
        duration: 0.34,
        ease: 'easeIn',
        onComplete: () => {
          onCommit(dir)
          x.set(0)
        },
      })
    },
    [onCommit, x],
  )

  const onDragEnd = useCallback(
    (_e: unknown, info: PanInfo) => {
      const dx = info.offset.x
      const vx = info.velocity.x
      if (dx > distance || vx > velocity) decide(1)
      else if (dx < -distance || vx < -velocity) decide(-1)
      else animate(x, 0, { type: 'spring', stiffness: 280, damping: 28 })
    },
    [decide, distance, velocity, x],
  )

  useEffect(() => {
    if (!opts.keyboard) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') decide(1)
      else if (e.key === 'ArrowLeft') decide(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [decide, opts.keyboard])

  return {
    x,
    rotate,
    leftGlow,
    rightGlow,
    ratifyOp,
    strikeOp,
    decide,
    dragProps: {
      drag: 'x' as const,
      dragConstraints: { left: 0, right: 0 },
      dragElastic: 0.65,
      onDragEnd,
      style: { x, rotate },
    },
  }
}
