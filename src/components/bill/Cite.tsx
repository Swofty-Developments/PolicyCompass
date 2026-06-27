/** Inline superscript citation marker, e.g. the ² after an analyst claim. */
export function Cite({ n, url }: { n: number; url: string }) {
  return (
    <a className="cite" href={url} target="_blank" rel="noopener noreferrer" aria-label={`source ${n}`}>
      {n}
    </a>
  )
}
