import type { Archetype } from '../../types'

export function VerdictIdentity({ archetype }: { archetype: Archetype }) {
  return (
    <div className="v-verdict">
      <div className="youare">The floor finds you</div>
      <div className="vtitle">{archetype.title}</div>
      <div className="vblurb">{archetype.blurb}</div>
    </div>
  )
}
