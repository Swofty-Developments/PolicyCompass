import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useSwipe } from '../../hooks/useSwipe'
import { Stamp } from '../primitives'
import { SwipeGutter } from '../deck/SwipeGutter'
import '../../styles/deck.css'
import '../../styles/intro.css'

/** The home explainer — a dossier card you swipe either way to begin a new run.
 *  Uses the very same edge gutters as the deck (both labelled "Continue"). */
export function IntroCard({ onBegin, children }: { onBegin: () => void; children?: ReactNode }) {
  const swipe = useSwipe('intro', () => onBegin())

  return (
    <div className="deck-row">
      <SwipeGutter side="l" label="Continue" glow={swipe.leftGlow} tone="neutral" />

      <div className="stage home-stage">
        <motion.div className="introcard-wrap" {...swipe.dragProps}>
          <div className="sheet introcard">
            <Stamp className="introcard-stamp">BRIEFING</Stamp>
            <div className="kicker introcard-eyebrow">Confidential Dossier · How It Works</div>
            <h1 className="introcard-title">Policy Compass</h1>
            <div className="introcard-rule" />

            <p className="introcard-lead">
              You are the deciding vote on a docket of <strong>real bills</strong> — drawn from parliaments and
              regimes across the world and across history, each stripped of its sponsor. No party, no name. Only the policy.
            </p>

            <div className="introcard-how">
              <div className="how no"><span className="arrow">◀</span><div><div className="hl">Strike Down</div><div className="hs">swipe left to vote no</div></div></div>
              <div className="how yes"><div className="ht"><div className="hl">Ratify</div><div className="hs">swipe right to vote yes</div></div><span className="arrow">▶</span></div>
            </div>
            <div className="introcard-how abstain">
              <div className="how neutral"><span className="arrow">▼</span><div><div className="hl">Abstain</div><div className="hs">swipe down to abstain — no reading of you taken</div></div></div>
            </div>
            <div className="introcard-conv">A firm, decisive swipe counts for more than a hesitant nudge.</div>

            <p className="introcard-lead">
              After every vote the record unseals who really sponsored the bill. The docket closes once the
              floor has read you — usually 10–18 bills — placing you on the spectrum from
              <span className="pl"> Communist</span> to <span className="pr">Fascist</span> across five domains,
              and naming the leaders and parties you echo.
            </p>

            <div className="introcard-prompt">Swipe left or right to continue</div>
          </div>

          <motion.div className="begin-stamp l" style={{ opacity: swipe.strikeOp }}>BEGIN</motion.div>
          <motion.div className="begin-stamp r" style={{ opacity: swipe.ratifyOp }}>BEGIN</motion.div>
        </motion.div>

        {children}
      </div>

      <SwipeGutter side="r" label="Continue" glow={swipe.rightGlow} tone="neutral" />
    </div>
  )
}
