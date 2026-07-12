import type { Bloc, DivisionResult, VoteChoice } from '../../types'
import { signed } from '../../../lib/format'
import { blocLabel, driftLine } from './bits'
import '../../styles/terms.css'

const VOTE_LINES: Record<VoteChoice, string> = {
  ratify: 'You voted AYE.',
  strike: 'You voted NO.',
  abstain: 'You were absent from the division.',
}

function relationsTone(short: string, delta: number): string {
  if (delta >= 8) return `the ${short} benches cheer the vote`
  if (delta > 0) return `${short} approves`
  if (delta <= -8) return `${short} takes it as a betrayal`
  return `${short} takes note, coldly`
}

/** The full division slip: The Record (your vote) beside The Republic (the House). */
export function ResultSlip({
  result,
  blocs,
  marginNote,
  onDismiss,
}: {
  result: DivisionResult
  blocs: Bloc[]
  marginNote?: string
  onDismiss: () => void
}) {
  const d = result.deltas
  const promiseBloc = result.promiseOutcome ? blocLabel(result.promiseOutcome.promise.blocId, blocs) : ''
  return (
    <div className="t-artifact-wrap">
      <div className="t-flip t-flip--slip">
        <div className="t-paper t-paper--slip">
          <i className="t-grain" aria-hidden />
          <span className={'stamp t-stamp' + (result.passed ? ' t-stamp-green' : '')}>
            {result.passed ? 'PASSED' : 'DEFEATED'}
          </span>
          <header className="t-slip-head">
            <div className="t-kick">Division Slip · To Be Filed</div>
            <h2 className="t-slip-title">{result.billTitle}</h2>
          </header>

          <div className="t-paper-scroll">
            <div className="t-slip-cols">
              <section className="t-slip-col">
                <div className="t-slip-sec">The Record</div>
                <div className="t-slip-vote">{VOTE_LINES[result.choice]}</div>
                {result.castingVote && <p className="t-slip-line">Yours was the casting vote. The sketch-writers saw it.</p>}
                {result.whipOutcome && (
                  <p className="t-slip-line">
                    {result.whipOutcome.obeyed
                      ? 'The whip was obeyed; the party notes it.'
                      : `You defied the whip — strike ${result.whipOutcome.strikes} of three.`}
                  </p>
                )}
                {result.promiseOutcome && (
                  <p className="t-slip-line">
                    {result.promiseOutcome.kept
                      ? `Undertaking to ${promiseBloc} discharged: “${result.promiseOutcome.promise.label}”.`
                      : `Undertaking to ${promiseBloc} broken. They will not forget.`}
                  </p>
                )}
                {d.relations.filter((r) => r.delta !== 0).map((r) => (
                  <p className="t-slip-line" key={r.blocId}>
                    <span className={'n ' + (r.delta > 0 ? 'up' : 'down')}>{signed(r.delta)}</span>{' '}
                    — {relationsTone(blocLabel(r.blocId, blocs), r.delta)}.
                  </p>
                ))}
                {d.trust !== 0 && (
                  <p className="t-slip-line">
                    <span className={'n ' + (d.trust > 0 ? 'up' : 'down')}>{signed(d.trust)}</span> — standing with the party.
                  </p>
                )}
                {d.conviction !== 0 && (
                  <p className="t-slip-line">
                    <span className={'n ' + (d.conviction > 0 ? 'up' : 'down')}>{signed(d.conviction)}</span>{' '}
                    — {d.conviction > 0 ? 'the record holds.' : 'the record bends.'}
                  </p>
                )}
                {d.lines.map((line, i) => (
                  <p className="t-sketch" key={i}>{line}</p>
                ))}
              </section>

              <section className="t-slip-col">
                <div className="t-slip-sec">The Republic</div>
                <div className="t-slip-figures">
                  <span><span className="fig ayes">{result.ayes}</span> <span className="cap">AYES</span></span>
                  <span><span className="fig noes">{result.noes}</span> <span className="cap">NOES</span></span>
                </div>
                <div className="t-slip-bloc-rows">
                  {result.byBloc.map((b) => (
                    <div className="t-slip-bloc-row" key={b.blocId}>
                      <span className="bn">{blocLabel(b.blocId, blocs)}</span>
                      <span>{b.ayes} — {b.noes}</span>
                    </div>
                  ))}
                </div>
                {result.passed ? (
                  <>
                    {d.zeitgeist.map((z) => (
                      <p className="t-slip-line" key={z.axis}>{driftLine(z.axis, z.delta)}</p>
                    ))}
                    {d.treasury !== 0 && (
                      <p className="t-slip-line">
                        The Exchequer takes it at{' '}
                        <span className={'n ' + (d.treasury > 0 ? 'up' : 'down')}>{signed(d.treasury)}</span>.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="t-slip-line">The bill falls. The Republic is unmoved; only the record changes.</p>
                )}
              </section>
            </div>
            {marginNote && <div className="t-margin-note">{marginNote}</div>}
          </div>

          <div className="t-slip-foot">
            <button className="t-btn" onClick={onDismiss}>File the slip</button>
          </div>
        </div>
      </div>
    </div>
  )
}
