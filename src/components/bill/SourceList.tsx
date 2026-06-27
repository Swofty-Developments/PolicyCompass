import type { AnalystSource } from '../../types'
import { SourceLink } from '../primitives'

/** Numbered, clickable sources at the foot of the card — matches the inline ¹²³. */
export function SourceList({ sources }: { sources: AnalystSource[] }) {
  if (!sources.length) return null
  return (
    <div className="b-sources">
      <span className="b-sources-label">Sources</span>
      {sources.map((s, i) => (
        <span className="srcitem" key={s.url + i}>
          <span className="srcnum">{i + 1}</span>
          <SourceLink name={s.name} url={s.url} />
        </span>
      ))}
    </div>
  )
}
