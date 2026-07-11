import { useState } from 'react'
import type { Scenario, SeatType, TermsSetup } from '../../types'
import { listArchive } from '../../lib/storage'

/** The returning officer's letter — one sheet, two faces: declare a party,
 *  then choose your ground. */
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
  const [archived] = useState(() => listArchive().length)

  const playable = scenario.blocs.filter((b) => b.playable)
  const party = partyId ? scenario.blocs.find((b) => b.id === partyId) : undefined
  const seats: { seat: SeatType; name: string }[] = [
    { seat: 'safe', name: 'The machine seat — safe' },
    { seat: 'marginal', name: 'Your own ground — marginal' },
  ]

  return (
    <div className="desk t-pro-wrap">
      <div className="sheet t-letter" key={party ? 'seat' : 'party'}>
        <div className="kicker t-letter-kicker">
          Office of the Returning Officer · {party ? 'The Seat' : 'Writ of Return'}
        </div>
        <h1 className="t-letter-title">{scenario.title}</h1>
        <div className="t-letter-rule" />

        {!party ? (
          <>
            {scenario.intro.split('\n\n').map((p, i) => (
              <p className="t-letter-body" key={i}>{p}</p>
            ))}
            <div className="hand t-letter-note">
              The party is the coat you wear; the seat is the ground you stand on. — R.O.
            </div>
            <div className="label t-letter-ask">Declare for a party</div>
            <div className="t-choices">
              {playable.map((b) => (
                <button className="t-choice" key={b.id} onClick={() => setPartyId(b.id)}>
                  <span className="t-choice-name">{b.name}</span>
                  <span className="t-choice-blurb">{b.blurb}</span>
                  <span className="t-choice-cites">After {b.composites.join(' · ')}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="t-letter-body">
              Declared: <strong>{party.name}</strong>. It remains to enter the seat you will
              contest — and hold, if the Republic is kind.
            </p>
            <div className="label t-letter-ask">Choose your ground</div>
            <div className="t-choices">
              {seats.map(({ seat, name }) => (
                <button
                  className="t-choice"
                  key={seat}
                  onClick={() => onStart({ partyId: party.id, seatType: seat })}
                >
                  <span className="t-choice-name">{name}</span>
                  <span className="t-choice-blurb">{scenario.seatBlurbs[seat]}</span>
                </button>
              ))}
            </div>
            <button className="t-linkbtn t-back" onClick={() => setPartyId(null)}>
              ← Reconsider the party
            </button>
          </>
        )}

        <div className="t-pro-links">
          <button className="t-linkbtn" onClick={onExit}>← Return to the desk</button>
          {archived > 0 && (
            <button className="t-linkbtn" onClick={onArchive}>The Archive ({archived})</button>
          )}
        </div>
      </div>
    </div>
  )
}
