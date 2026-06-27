function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Render `text`, wrapping any of `phrases` it contains in a <mark>. */
export function Highlighted({ text, phrases }: { text: string; phrases?: string[] }) {
  const list = (phrases ?? []).filter(Boolean)
  if (!list.length) return <>{text}</>
  const re = new RegExp(`(${list.map(escapeRe).join('|')})`, 'g')
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) => (list.includes(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}
    </>
  )
}
