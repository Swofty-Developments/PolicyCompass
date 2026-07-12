import { useEffect, useMemo, useRef, useState } from 'react'
import { bills } from '../../data'
import { scenario } from '../data/scenario'
import { renderEventBody } from '../engine/events'
import { EMERGENCY_WHIPS_PER_TERM } from '../engine/floor'
import { buildObituary } from '../engine/obituary'
import { useTermsRun } from '../hooks/useTermsRun'
import { clearSavedRun, fileCareer } from '../lib/storage'
import {
  EventArtifact,
  EventOutcome,
  Ledger,
  PaperArtifact,
  ResultRibbon,
  ResultSlip,
  TermsSheet,
  WhipNoteCard,
} from './artifacts'
import { BillStage } from './shell/BillStage'
import { DeskLayout, standingDisclosed } from './shell/DeskLayout'
import { marginaliaFor } from './shell/marginalia'
import { Prologue } from './setup/Prologue'
import { ElectionNight } from './election/ElectionNight'
import { Obituary } from './obituary/Obituary'
import { Archive } from './obituary/Archive'
import type { Portfolio, TermsSetup, TermsState } from '../types'
import '../styles/terms-screens.css'

const PORTFOLIO_NAMES: Record<Portfolio, string> = {
  treasury: 'Treasury',
  home: 'Home Office',
  wilderness: 'The Wilderness',
}

/** In-fiction notice when a saved career could not be resumed (spec: a
 *  mismatched resume is dropped with an in-fiction notice). */
const DROPPED_NOTICE: Record<string, string> = {
  bills: 'The clerks have re-bound the order paper. An unfinished career is filed as it stood.',
  schema: 'The House has adopted new standing orders. An unfinished career is filed as it stood.',
  scenario: 'The boundary commission has redrawn the map. An unfinished career is filed as it stood.',
  corrupt: 'Water damage in the records office. An unfinished career could not be recovered.',
}

function officeLabel(state: TermsState): string {
  if (state.office === 'leader') return 'Leader'
  if (state.office === 'minister')
    return state.portfolio ? `Minister · ${PORTFOLIO_NAMES[state.portfolio]}` : 'Minister'
  return state.portfolio === 'wilderness' ? 'Backbencher · The Wilderness' : 'Backbencher'
}

/** The mode's phase machine. Owns every terms hook; renders exactly one
 *  surface at a time (the deck unmounts whenever paper is on the desk). */
export function TermsApp({
  challenge,
  onChallengeDone,
  onExit,
}: {
  challenge?: { seed: number; setup: TermsSetup } | null
  onChallengeDone?: () => void
  onExit: () => void
}) {
  const { state, saved, dropped, start, act, abandon } = useTermsRun()
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const [view, setView] = useState<'run' | 'archive'>('run')
  const [filedSeed, setFiledSeed] = useState<number | null>(null)
  const startedChallenge = useRef(false)
  const pendingChallenge = challenge && !startedChallenge.current ? challenge : null

  // A shared-link challenge starts on the shared seed/setup — but never over a
  // live career (a run in progress, or finished but unfiled, blocks it below).
  useEffect(() => {
    if (pendingChallenge && !saved) {
      startedChallenge.current = true
      start(pendingChallenge.setup, pendingChallenge.seed)
      onChallengeDone?.()
    }
  }, [pendingChallenge, saved, start, onChallengeDone])

  const obit = useMemo(
    () => (state && state.stage.kind === 'obituary' ? buildObituary(state, scenario, bills) : null),
    [state],
  )

  if (view === 'archive') return <Archive onBack={() => setView('run')} />

  // A live career blocks the challenge until the player rules on it.
  if (pendingChallenge && saved) {
    const takeOffice = () => {
      startedChallenge.current = true
      start(pendingChallenge.setup, pendingChallenge.seed)
      onChallengeDone?.()
    }
    const decline = () => {
      startedChallenge.current = true
      onChallengeDone?.()
    }
    return (
      <div className="desk t-stagewrap">
        <div className="sheet t-missing">
          <div className="kicker">A Seat Is Offered</div>
          <p>
            A career already lies open on this desk. Taking office on the shared seed
            strikes the unfinished record from the book — nothing is filed.
          </p>
          <div className="t-obit-actions">
            <button className="t-btn" onClick={decline}>Return to the desk</button>
            <button className="t-btn solid" onClick={takeOffice}>Take office — strike the record</button>
          </div>
        </div>
      </div>
    )
  }

  // The challenge effect is about to start the run; don't flash the old stage.
  if (pendingChallenge) return <div className="desk" />

  if (!state || state.stage.kind === 'prologue') {
    return (
      <Prologue
        scenario={scenario}
        notice={dropped ? DROPPED_NOTICE[dropped] : undefined}
        onStart={(setup) => start(setup)}
        onExit={onExit}
        onArchive={() => setView('archive')}
      />
    )
  }

  if (ledgerOpen) {
    return (
      <div className="desk">
        <Ledger state={state} scenario={scenario} onClose={() => setLedgerOpen(false)} />
      </div>
    )
  }

  const stage = state.stage
  const actDef = scenario.acts[state.actId]
  const billTitle = (id: string) => bills.find((b) => b.id === id)?.title ?? 'the bill before the House'
  const partyShort = scenario.blocs.find((b) => b.id === state.partyId)?.short ?? 'the party'
  const advance = () => act({ type: 'advance' })

  // Full-bleed moments render without rails.
  switch (stage.kind) {
    case 'election':
      return (
        <ElectionNight
          night={stage.night}
          recess={stage.recess}
          blocs={scenario.blocs}
          partyId={state.partyId}
          onContinue={advance}
        />
      )

    case 'branch':
      return (
        <div className="desk t-stagewrap">
          <PaperArtifact
            kind="letter"
            title={stage.branch.title}
            body={stage.branch.letter}
            byline={stage.branch.byline}
            header="The morning after the count"
            options={stage.branch.options.map((o) => ({ id: o.id, label: o.label, detail: o.detail }))}
            onChoose={(optionId) => act({ type: 'branch', optionId })}
          />
        </div>
      )

    case 'obituary':
      if (!obit) return <div className="desk" />
      return (
        <Obituary
          obit={obit}
          filed={filedSeed === state.seed}
          onFile={() => {
            fileCareer(obit)
            clearSavedRun()
            setFiledSeed(state.seed)
          }}
          onArchive={() => setView('archive')}
          onClose={abandon}
        />
      )
  }

  // Run stages share one desk: the rails flank the centre surface (≥1200px),
  // mounted once around the switch so they persist across stage changes.
  const surface = (() => {
    switch (stage.kind) {
      case 'whipnote':
        return (
          <div className="t-stage t-stagewrap">
            <WhipNoteCard
              whip={stage.whip}
              billTitle={billTitle(stage.billId)}
              partyShort={partyShort}
              marginNote={marginaliaFor(state, 'whipnote')}
              onDismiss={advance}
            />
          </div>
        )

      case 'negotiation': {
        const bloc = scenario.blocs.find((b) => b.id === stage.offer.blocId) ?? scenario.blocs[0]
        return (
          <div className="t-stage t-stagewrap">
            <TermsSheet
              offer={stage.offer}
              bloc={bloc}
              billTitle={billTitle(stage.billId)}
              onDecide={(accept) => act({ type: 'negotiate', accept })}
            />
          </div>
        )
      }

      case 'bill': {
        const bill = bills.find((b) => b.id === stage.billId)
        const divisionSlots = actDef ? actDef.slots.filter((s) => s.kind !== 'event') : []
        const divisionNo = actDef
          ? actDef.slots.slice(0, state.slotIndex + 1).filter((s) => s.kind !== 'event').length
          : 1
        if (!bill) {
          // Docket drift guard: the division must still be decidable.
          return (
            <div className="t-stage t-stagewrap">
              <div className="sheet t-missing">
                <div className="kicker">Order Paper · Clerk's Correction</div>
                <p>The clerk cannot produce the text of this bill. The chair calls the division regardless.</p>
                <div className="t-obit-actions">
                  <button className="t-btn" onClick={() => act({ type: 'vote', choice: 'strike' })}>Strike down</button>
                  <button className="t-btn solid" onClick={() => act({ type: 'vote', choice: 'ratify' })}>Ratify</button>
                </div>
              </div>
            </div>
          )
        }
        return (
          <BillStage
            bill={bill}
            divisionNo={divisionNo}
            divisionsTotal={divisionSlots.length}
            actTitle={actDef?.title ?? state.actId}
            officeLabel={officeLabel(state)}
            knifeEdge={stage.projection.knifeEdge}
            ledgerUnlocked={standingDisclosed(state)}
            emergencyWhip={
              state.office === 'leader'
                ? { spent: state.emergencyWhipsThisTerm >= EMERGENCY_WHIPS_PER_TERM }
                : null
            }
            onOpenLedger={() => setLedgerOpen(true)}
            onExit={onExit}
            onAbandon={abandon}
            onVote={(choice, emergencyWhip) =>
              act({ type: 'vote', choice, emergencyWhip: emergencyWhip || undefined })
            }
          />
        )
      }

      case 'result':
        if (stage.result.tier === 'ribbon') {
          return (
            <div className="t-stage t-stagewrap">
              <ResultRibbon result={stage.result} onDismiss={advance} />
            </div>
          )
        }
        return (
          <div className="t-stage t-stagewrap">
            <ResultSlip
              result={stage.result}
              blocs={scenario.blocs}
              marginNote={marginaliaFor(state, 'slip')}
              onDismiss={advance}
            />
          </div>
        )

      case 'event': {
        const event = scenario.events.find((e) => e.id === stage.eventId)
        if (!event) {
          return (
            <div className="t-stage t-stagewrap">
              <div className="sheet t-missing">
                <div className="kicker">Dead Letter Office</div>
                <p>A dispatch went astray in the night. The House moves on.</p>
                <div className="t-obit-actions">
                  <button className="t-btn solid" onClick={advance}>Continue</button>
                </div>
              </div>
            </div>
          )
        }
        return (
          <div className="t-stage t-stagewrap">
            <EventArtifact
              event={{ ...event, body: renderEventBody(state, event) }}
              onChoose={(optionId) => act({ type: 'event_option', optionId })}
            />
          </div>
        )
      }

      case 'event_outcome': {
        const event = scenario.events.find((e) => e.id === stage.eventId)
        return (
          <div className="t-stage t-stagewrap">
            <EventOutcome
              title={event?.title ?? 'The Outcome'}
              text={stage.text}
              deltas={stage.deltas}
              succeeded={stage.succeeded}
              onDismiss={advance}
            />
          </div>
        )
      }

      default:
        return null
    }
  })()

  return (
    <DeskLayout state={state} scenario={scenario} onOpenLedger={() => setLedgerOpen(true)}>
      {surface}
    </DeskLayout>
  )
}
