import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { Bill, VoteVerdict } from '../../types'

const STAMPS: Record<VoteVerdict, { label: string; tone: string }> = {
  ratify: { label: 'Ratified', tone: 'ratified' },
  strike: { label: 'Struck Down', tone: 'struck' },
  abstain: { label: 'Abstained', tone: 'abstained' },
}

/** Post-vote interstitial: the record unseals and the bill's true provenance —
 *  hidden before the vote so the policy is judged on its merits — is revealed. */
export function RevealSlip({
  bill,
  verdict,
  last,
  onNext,
}: {
  bill: Bill
  verdict: VoteVerdict
  /** True when this vote closed the docket — dismissal opens the standing, not another bill. */
  last: boolean
  onNext: () => void
}) {
  const done = useRef(false)
  const advance = () => {
    if (done.current) return
    done.current = true
    onNext()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stamp = STAMPS[verdict]
  const { sponsor, country, year, note } = bill.provenance

  return (
    <div className="reveal-scrim" onClick={advance}>
      <motion.div
        className="sheet reveal-slip"
        initial={{ y: -90, opacity: 0, rotate: -5 }}
        animate={{ y: 0, opacity: 1, rotate: -1.2 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      >
        <div className={`reveal-stamp ${stamp.tone}`}>{stamp.label}</div>
        <div className="kicker">The Record · Unsealed</div>
        <div className="r-title">Bill Nº {bill.number} — {bill.title}</div>
        <h2 className="r-sponsor">{sponsor}</h2>
        <div className="r-origin">{country} · {year}</div>
        {note && <p className="r-note">{note}</p>}
        <div className="r-next">
          {last ? 'the docket is closed — tap anywhere, or press ⏎, for your standing' : 'tap anywhere — or press ⏎ — for the next bill'}
        </div>
      </motion.div>
    </div>
  )
}
