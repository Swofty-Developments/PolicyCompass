/** Hover content for a spectrum zone: the ideology there + the parties that sit in it. */
export function ZoneTooltip({ ideology, parties }: { ideology: string; parties: string[] }) {
  return (
    <span className="ztip">
      <b>{ideology}</b>
      <span className="pz">{parties.length ? parties.join('; ') : 'no major party sits here'}</span>
    </span>
  )
}
