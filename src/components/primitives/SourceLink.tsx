import type { AnalystSource } from '../../types'

export function SourceLink({ name, url }: AnalystSource) {
  return (
    <a className="src" href={url} target="_blank" rel="noopener noreferrer">
      {name}
    </a>
  )
}
