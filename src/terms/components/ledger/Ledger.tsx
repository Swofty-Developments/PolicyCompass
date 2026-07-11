import type { Office, Portfolio, Scenario, TermsState } from '../../types'
import { AXES, readPosition } from '../../../engine/axes'
import { signedFine } from '../artifacts/bits'
import { LedgerCorrespondence } from './LedgerCorrespondence'
import { LedgerBooks } from './LedgerBooks'
import '../../styles/terms.css'

const OFFICE_NAMES: Record<Office, string> = {
  backbencher: 'The Backbench',
  minister: 'Minister of the Crown',
  leader: 'Leader of the Party',
}
const PORTFOLIO_NAMES: Record<Portfolio, string> = {
  treasury: 'The Treasury',
  home: 'The Home Office',
  wilderness: 'The Wilderness',
}

function officeLine(state: TermsState): string {
  const office = OFFICE_NAMES[state.office] + (state.portfolio ? ` — ${PORTFOLIO_NAMES[state.portfolio]}` : '')
  return `${office} · ${state.seatType} seat · Term ${Math.min(state.termsServed + 1, 3)}`
}

function trustNote(trust: number, ultimatum: boolean): string {
  if (trust < 20) return 'below twenty — the whips are talking. Thirty restores confidence.'
  if (ultimatum) return 'the ultimatum stands — reach thirty before the term is out.'
  return 'the whips talk at twenty.'
}
function convictionNote(conviction: number): string {
  if (conviction < 40) return 'below forty — the odds worsen and the seat swings against you.'
  if (conviction > 75) return 'above seventy-five the party forgives a fourth defiance.'
  return 'below forty the sketch-writers circle.'
}
function treasuryNote(treasury: number): string {
  if (treasury < 15) return 'below fifteen — the markets are wiring the Chancellor.'
  return 'the markets wire the Chancellor at fifteen.'
}

function MemoRow({ k, n, note, alert }: { k: string; n: number; note: string; alert: boolean }) {
  return (
    <div className={'t-memo-row' + (alert ? ' alert' : '')}>
      <span className="t-memo-k">{k}</span>
      <span className="t-memo-n">{n}</span>
      <span className="t-memo-note">— {note}</span>
    </div>
  )
}

/** The Member's ledger: one scrollable paper of figures, letters and pinned cards. */
export function Ledger({ state, scenario, onClose }: { state: TermsState; scenario: Scenario; onClose: () => void }) {
  return (
    <div className="t-ledger-wrap">
      <div className="t-paper t-paper--ledger">
        <i className="t-grain" aria-hidden />
        <header className="t-ledger-head">
          <div>
            <div className="t-kick">Private · Compiled by the Pollster</div>
            <h2 className="t-ledger-title">The Member’s Ledger</h2>
            <div className="t-ledger-sub">{officeLine(state)} · figures as at division {state.position}</div>
          </div>
          <button className="t-btn" onClick={onClose}>✕ Return to the House</button>
        </header>

        <div className="t-ledger-scroll">
          <div className="t-ledger-sec">The Pollster’s Memo</div>
          <MemoRow k="Confidence" n={state.trust} note={trustNote(state.trust, Boolean(state.flags['ultimatum']))} alert={state.trust < 20} />
          <MemoRow k="Conviction" n={state.conviction} note={convictionNote(state.conviction)} alert={state.conviction < 40} />
          <MemoRow k="Exchequer" n={state.treasury} note={treasuryNote(state.treasury)} alert={state.treasury < 15} />
          {state.whipDefiances > 0 && (
            <MemoRow
              k="Defiances"
              n={state.whipDefiances}
              note="three strikes in a term convene an expulsion vote."
              alert={state.whipDefiances >= 2}
            />
          )}

          <div className="t-ledger-sec">The National Mood</div>
          {AXES.map((a) => {
            const v = state.zeitgeist[a.id]
            const fringe = (a.id === 'economic' || a.id === 'identity') && Math.abs(v) >= 0.25
            return (
              <div className={'t-mood-row' + (fringe ? ' alert' : '')} key={a.id}>
                <span className="t-mood-k">{a.name}</span>
                <span className="t-mood-n">{signedFine(v)}</span>
                <span className="t-mood-read">
                  {readPosition(v)}
                  {a.id === 'economic' || a.id === 'identity'
                    ? fringe
                      ? ' — past a quarter, the fringes organise.'
                      : ' — the fringes organise past ±0.25.'
                    : ''}
                </span>
              </div>
            )
          })}

          <LedgerCorrespondence state={state} scenario={scenario} />
          <LedgerBooks state={state} scenario={scenario} />
        </div>
      </div>
    </div>
  )
}
