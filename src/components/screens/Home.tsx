import type { SavedRun } from '../../lib/storage'
import { IntroCard } from './IntroCard'
import { CaseFiles } from './CaseFiles'

export function Home({
  runs,
  onNew,
  onResume,
  onDiscard,
}: {
  runs: SavedRun[]
  onNew: () => void
  onResume: (run: SavedRun) => void
  onDiscard: (id: string) => void
}) {
  return (
    <div className="desk">
      <IntroCard onBegin={onNew}>
        <CaseFiles runs={runs} onResume={onResume} onDiscard={onDiscard} />
      </IntroCard>
    </div>
  )
}
