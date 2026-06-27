import { motion, type MotionValue } from 'framer-motion'

export function SwipeGutter({
  side,
  label,
  glow,
  tone = 'vote',
}: {
  side: 'l' | 'r'
  label: string
  glow: MotionValue<number>
  tone?: 'vote' | 'neutral'
}) {
  return (
    <div className={`gutter ${side}${tone === 'neutral' ? ' neutral' : ''}`}>
      <motion.div className="glow" style={{ opacity: glow }} />
      <span className="gtext">{label}</span>
    </div>
  )
}
