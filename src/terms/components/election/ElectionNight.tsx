import { useMemo, useState } from 'react'
import { signed } from '../../../lib/format'
import type { Bloc, ElectionNight as ElectionNightData, RecessSettlement } from '../../types'
import { characters } from '../../data/characters'
import { electionExchange } from '../../data/scenes'
import { DialogueScene } from '../dialogue/DialogueScene'

/** Election night: the count comes in slip by slip, then the returning
 *  officer's note itemises the personal seat — the boss fight ends legibly. */
export function ElectionNight({
  night,
  recess,
  blocs,
  partyId,
  onContinue,
}: {
  night: ElectionNightData
  /** Promises that expired unkept at the recess, settled before this count */
  recess?: RecessSettlement
  blocs: Bloc[]
  partyId: string
  onContinue: () => void
}) {
  // 0..swings.length reveals slips; the step after reveals the officer's note.
  const [revealed, setRevealed] = useState(0)
  // A short exchange with the officer plays before the count is read.
  const [exchangeDone, setExchangeDone] = useState(false)
  const exchange = useMemo(() => electionExchange(night.seat.held), [night.seat.held])
  const total = night.swings.length + 1
  const done = revealed >= total

  const blocName = (id: string) => blocs.find((b) => b.id === id)?.name ?? id
  const advance = () => setRevealed((r) => Math.min(r + 1, total))

  if (!exchangeDone) {
    return (
      <DialogueScene
        scene={{ beats: exchange }}
        characters={characters}
        header="Election Night · Halloway"
        onChoice={() => {}}
        onDone={() => setExchangeDone(true)}
      />
    )
  }

  return (
    <div className="desk t-night" onClick={advance}>
      <div className="t-night-scroll">
        <div className="kicker t-night-head">Election Night · The Count</div>

        {recess && (
          <div className="sheet t-officer" onClick={(e) => e.stopPropagation()}>
            <div className="kicker">Before the Count · The Recess Settlement</div>
            {recess.broken.map((b, i) => (
              <p className="t-slip-line" key={i}>
                Undertaking to {blocName(b.blocId)} expired with the term, unkept: “{b.label}”.
              </p>
            ))}
            <div className="t-count-rows">
              {recess.deltas.trust !== 0 && (
                <div className="t-count-row">
                  <span className="t-count-label">Confidence — promises broken</span>
                  <span className={'t-count-pts' + (recess.deltas.trust < 0 ? ' down' : ' up')}>
                    {signed(recess.deltas.trust)}
                  </span>
                </div>
              )}
              {recess.deltas.relations.filter((r) => r.delta !== 0).map((r) => (
                <div className="t-count-row" key={r.blocId}>
                  <span className="t-count-label">{blocName(r.blocId)} — their word was given</span>
                  <span className={'t-count-pts' + (r.delta < 0 ? ' down' : ' up')}>{signed(r.delta)}</span>
                </div>
              ))}
            </div>
            {recess.deltas.lines.map((line, i) => (
              <div className="hand t-night-trust" key={i}>{line}</div>
            ))}
          </div>
        )}

        {night.swings.slice(0, revealed).map((s) => {
          const delta = s.after - s.before
          return (
            <div className={'sheet t-swing' + (s.blocId === partyId ? ' mine' : '')} key={s.blocId}>
              <span className="t-swing-name">
                {blocName(s.blocId)}
                {s.blocId === partyId && <em className="t-swing-tag"> · your party</em>}
              </span>
              <span className="t-swing-count">
                {s.before} → {s.after}
              </span>
              <span className={'t-swing-delta' + (delta < 0 ? ' down' : delta > 0 ? ' up' : '')}>
                {signed(delta)}
              </span>
            </div>
          )
        })}

        {done && (
          <div className="sheet t-officer" onClick={(e) => e.stopPropagation()}>
            <div className="kicker">The Returning Officer's Note · Halloway</div>
            <div className="t-count-rows">
              {night.seat.breakdown.map((row, i) => (
                <div className="t-count-row" key={i}>
                  <span className="t-count-label">{row.label}</span>
                  <span className={'t-count-pts' + (row.points < 0 ? ' down' : row.points > 0 ? ' up' : '')}>
                    {signed(row.points)}
                  </span>
                </div>
              ))}
              <div className="t-count-row total">
                <span className="t-count-label">The count, against a margin of {night.seat.margin}</span>
                <span className="t-count-pts">{signed(night.seat.total)}</span>
              </div>
            </div>
            <div className={'stamp t-held-stamp' + (night.seat.held ? '' : ' lost')}>
              {night.seat.held ? 'RETURNED' : 'UNSEATED'}
            </div>
            {night.trustDelta !== 0 && (
              <div className="hand t-night-trust">
                {night.seat.held ? 'The shine wears off all the same.' : 'The Republic has spoken.'}{' '}
                Confidence {signed(night.trustDelta)}.
              </div>
            )}
            <button className="t-btn solid t-night-continue" onClick={onContinue}>
              {night.seat.held ? 'Continue →' : 'Read the morning papers →'}
            </button>
          </div>
        )}

        {!done && <div className="t-tap-hint">tap to continue the count</div>}
      </div>
    </div>
  )
}
