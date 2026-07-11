import type { DivisionResult } from '../../types'
import '../../styles/terms.css'

/** One-line strip for lopsided divisions. Tap anywhere to file it. */
export function ResultRibbon({ result, onDismiss }: { result: DivisionResult; onDismiss: () => void }) {
  return (
    <div className="t-ribbon-wrap">
      <button className="t-ribbon" onClick={onDismiss}>
        <span className={'stamp' + (result.passed ? ' t-stamp-green' : '')}>
          {result.passed ? 'PASSED' : 'DEFEATED'}
        </span>
        <span className="t-ribbon-figs">AYES {result.ayes} · NOES {result.noes}</span>
        <span className="t-ribbon-title">{result.billTitle}</span>
        <span className="t-ribbon-hint">tap to file</span>
      </button>
    </div>
  )
}
