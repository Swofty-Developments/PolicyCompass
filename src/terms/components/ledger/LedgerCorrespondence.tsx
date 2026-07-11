import type { BlocState, Scenario, TermsState } from '../../types'
import { signed } from '../../../lib/format'

const FERVOUR_WORDS = ['CALM', 'RESTLESS', 'FEVERISH', 'INSURRECTIONARY'] as const

function relationsTone(short: string, r: number): string {
  if (r >= 60) return `${short} regards you as one of their own; their lobby is open to you.`
  if (r >= 30) return `Warm letters. ${short} expects to find you in their lobby more often than not.`
  if (r >= 10) return 'Cordial terms — favours are possible, at a price.'
  if (r > -10) return 'Strictly business. They watch how you vote and write accordingly.'
  if (r > -40) return `The letters have grown short. ${short} counts your votes against them.`
  if (r > -60) return 'The letterhead has chilled; what arrives comes unsigned.'
  return 'Nothing arrives. What passes between you now goes through the newspapers.'
}

function fervourPhrase(level: number): string {
  if (level >= 3) return 'their marshals talk openly of the day after the Republic.'
  if (level === 2) return 'marches in the streets — expect telegrams.'
  if (level === 1) return 'letters to the editor, and sharper ones to you.'
  return 'the rank and file are quiet.'
}

function CorrespondenceCard({ bs, state, scenario }: { bs: BlocState; state: TermsState; scenario: Scenario }) {
  const bloc = scenario.blocs.find((b) => b.id === bs.id)
  if (!bloc) return null
  const level = Math.min(3, Math.max(0, Math.floor(bs.fervour)))
  const isParty = bs.id === state.partyId
  const chill = bs.relations <= -60 ? ' t-corr--severed' : bs.relations <= -40 ? ' t-corr--chill' : ''
  return (
    <article className={'t-corr' + chill}>
      <header>
        {isParty && <span className="t-corr-party">Your Party</span>}
        <span className="t-corr-name">{bloc.name}</span>
      </header>
      <div className="t-corr-figs">
        Seats {bs.seats} · Relations {signed(bs.relations)} ·{' '}
        <span className={level >= 2 ? 'hot' : ''}>{FERVOUR_WORDS[level]}</span>
      </div>
      <p className="t-corr-tone">
        {relationsTone(bloc.short, bs.relations)} {fervourPhrase(level)}
      </p>
      {isParty && <div className="t-corr-warn">The party moves against its Member at −60.</div>}
      {bs.grudge && <div className="t-corr-grudge">They keep the broken promise in the minute-book.</div>}
    </article>
  )
}

export function LedgerCorrespondence({ state, scenario }: { state: TermsState; scenario: Scenario }) {
  const active = state.blocs.filter((b) => b.active)
  return (
    <>
      <div className="t-ledger-sec">
        Bloc Correspondence
        <span className="note">as the blocs judge your record</span>
      </div>
      <div className="t-corr-grid">
        {active.map((bs) => (
          <CorrespondenceCard bs={bs} state={state} scenario={scenario} key={bs.id} />
        ))}
      </div>
    </>
  )
}
