import { useState, type ReactNode } from 'react'

/** The docket frame: a ≤36px strip over the chamber floor. Tap-only — the strip
 *  never drags (it would fight the swipe gutters). */
export function DocketFrame({
  actTitle,
  positionLabel,
  officeLabel,
  knifeEdge,
  onOpenLedger,
  onExit,
  onAbandon,
  children,
}: {
  actTitle: string
  positionLabel: string
  officeLabel: string
  knifeEdge: boolean
  onOpenLedger: () => void
  onExit: () => void
  onAbandon: () => void
  children: ReactNode
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="desk t-run">
      <div className="t-strip">
        <div className="t-strip-left">
          <span className="t-strip-act">{actTitle}</span>
          <span className="t-strip-div">{positionLabel}</span>
          <span className="t-strip-office">{officeLabel}</span>
        </div>
        <div className="t-strip-actions">
          <button className="t-strip-btn" onClick={onOpenLedger}>Ledger</button>
          <button className="t-strip-btn" onClick={onExit}>Desk</button>
          <button
            className={'t-strip-btn quiet' + (confirming ? ' arm' : '')}
            onClick={() => (confirming ? onAbandon() : setConfirming(true))}
            onBlur={() => setConfirming(false)}
          >
            {confirming ? 'Abandon career?' : 'Resign'}
          </button>
        </div>
      </div>
      {knifeEdge && (
        <div className="t-knife hand">The chamber is full. The chair will look to Halloway.</div>
      )}
      <div className="t-deckhost">{children}</div>
    </div>
  )
}
