import type { SavedRun } from '../../lib/storage'

function fmtDate(ms: number): string {
  const d = new Date(ms)
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  )
}

export function CaseFiles({
  runs,
  onResume,
  onDiscard,
}: {
  runs: SavedRun[]
  onResume: (run: SavedRun) => void
  onDiscard: (id: string) => void
}) {
  if (!runs.length) return null
  return (
    <div className="casefiles">
      <div className="casefiles-title">Case Files · resume or discard a prior session</div>
      <div className="casefiles-row">
        {runs.map((r) => {
          const done = r.votes.length
          return (
            <div className={'casefile' + (r.finished ? ' sealed' : '')} key={r.id}>
              <button className="cf-main" onClick={() => onResume(r)}>
                <div className="cf-status">{r.finished ? 'Verdict sealed' : 'In session'}</div>
                <div className="cf-prog">{r.finished ? `${done} bills judged` : `${done} / ${r.target} bills`}</div>
                <div className="cf-date">{fmtDate(r.updatedAt)}</div>
              </button>
              <div className="cf-actions">
                <button className="cf-btn" onClick={() => onResume(r)}>{r.finished ? 'View' : 'Continue'}</button>
                <button className="cf-btn discard" onClick={() => onDiscard(r.id)} title="Discard run" aria-label="Discard run">✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
