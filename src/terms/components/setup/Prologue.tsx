import { useMemo, useState } from 'react'
import type { Scenario, SeatType, TermsSetup } from '../../types'
import { listArchive } from '../../lib/storage'
import { prologueScene } from '../../data/scenes'
import { DialogueScene } from '../dialogue/DialogueScene'

/** The prologue as a scene: the officer receives you, the parties pitch,
 *  Margaret frames the ground. The scene's two choices become the setup. */
export function Prologue({
  scenario,
  onStart,
  onExit,
  onArchive,
}: {
  scenario: Scenario
  onStart: (setup: TermsSetup) => void
  onExit: () => void
  onArchive: () => void
}) {
  const [partyId, setPartyId] = useState<string | null>(null)
  const [seatType, setSeatType] = useState<SeatType | null>(null)
  const [archived] = useState(() => listArchive().length)

  const scene = useMemo(
    () => prologueScene(scenario.blocs.filter((b) => b.playable), scenario.seatBlurbs),
    [scenario],
  )

  return (
    <>
      <DialogueScene
        scene={scene}
        characters={scenario.characters}
        header={`${scenario.title} · The Writ Returned`}
        skipLabel="Proceed directly to the House"
        onChoice={(_choiceIndex, optionId) => {
          // Seat option ids are fixed; anything else is a bloc id.
          if (optionId === 'safe' || optionId === 'marginal') setSeatType(optionId)
          else setPartyId(optionId)
        }}
        onDone={() => {
          if (partyId && seatType) onStart({ partyId, seatType })
        }}
      />
      <div className="t-dlg-corner">
        <button className="t-dlg-cornerbtn" onClick={onExit}>← The desk</button>
        {archived > 0 && (
          <button className="t-dlg-cornerbtn" onClick={onArchive}>The Archive ({archived})</button>
        )}
      </div>
    </>
  )
}
