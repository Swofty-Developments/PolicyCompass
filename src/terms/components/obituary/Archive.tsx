import { useState } from 'react'
import { deleteCareer, listArchive } from '../../lib/storage'
import type { ArchivedCareer } from '../../types'
import { Obituary } from './Obituary'

function fmtDate(ms: number): string {
  const d = new Date(ms)
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  )
}

/** The filing cabinet of completed careers — each row reopens its obituary. */
export function Archive({ onBack }: { onBack: () => void }) {
  const [careers, setCareers] = useState<ArchivedCareer[]>(() => listArchive())
  const [open, setOpen] = useState<ArchivedCareer | null>(null)

  if (open) {
    return <Obituary obit={open.obituary} onClose={() => setOpen(null)} closeLabel="Back to the cabinet" />
  }

  return (
    <div className="desk t-cabinet-wrap">
      <div className="sheet t-cabinet">
        <div className="kicker t-cabinet-kick">The Archive · Careers Filed</div>
        <div className="t-cabinet-rule" />
        {careers.length === 0 ? (
          <div className="t-cabinet-empty">The cabinet is empty. The Republic awaits a career worth filing.</div>
        ) : (
          <div className="t-drawer">
            {careers.map((c) => {
              const o = c.obituary
              return (
                <div className={'t-drawer-row' + (o.ending.victory ? ' honours' : '')} key={c.id}>
                  <button className="t-dr-main" onClick={() => setOpen(c)}>
                    <span className="t-dr-stamp">{o.ending.stamp}</span>
                    <span className="t-dr-title">{o.archetypeTitle}</span>
                    <span className="t-dr-sub">
                      {['no terms', 'one term', 'two terms', 'three terms'][o.termsServed] ?? `${o.termsServed} terms`}
                      {' · '}{fmtDate(c.createdAt)}
                    </span>
                  </button>
                  <div className="t-dr-actions">
                    <button className="t-dr-btn" onClick={() => setOpen(c)}>Read</button>
                    <button
                      className="t-dr-btn burn"
                      title="Burn the file"
                      aria-label="Burn the file"
                      onClick={() => {
                        deleteCareer(c.id)
                        setCareers(listArchive())
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="t-pro-links">
          <button className="t-linkbtn" onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  )
}
