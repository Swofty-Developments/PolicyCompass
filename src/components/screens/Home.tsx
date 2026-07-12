import type { SavedRun } from '../../lib/storage'
import { IntroCard } from './IntroCard'
import { CaseFiles } from './CaseFiles'
import '../../terms/styles/terms-screens.css'

export function Home({
  runs,
  onNew,
  onResume,
  onDiscard,
  onCareer,
}: {
  runs: SavedRun[]
  onNew: () => void
  onResume: (run: SavedRun) => void
  onDiscard: (id: string) => void
  onCareer: () => void
}) {
  return (
    <div className="desk">
      <IntroCard onBegin={onNew}>
        <button className="t-career-folder" onClick={onCareer}>
          <span className="stamp t-cf-stamp">CAREER</span>
          <span className="t-cf-body">
            <span className="t-cf-title">The Member for Halloway</span>
            <span className="t-cf-sub">A political life · up to three terms · filed to the Archive</span>
          </span>
          <span className="t-cf-open">Open ▸</span>
        </button>
        <CaseFiles runs={runs} onResume={onResume} onDiscard={onDiscard} />
      </IntroCard>
    </div>
  )
}
