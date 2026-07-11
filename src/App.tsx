import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Bill, VoteVerdict } from './types'
import { bills } from './data'
import { useRun } from './hooks/useRun'
import { deleteRun, listRuns, type SavedRun } from './lib/storage'
import { decodeShare, type SharedResult } from './lib/share'
import { Home } from './components/screens/Home'
import { SwipeDeck } from './components/deck/SwipeDeck'
import { RevealSlip } from './components/deck/RevealSlip'
import { Verdict } from './components/verdict/Verdict'
import { SharedStanding } from './components/screens/SharedStanding'
import { TermsApp } from './terms/components/TermsApp'
import { SharedObituary } from './terms/components/obituary/SharedObituary'
import { decodeTermsShare, type TermsShare } from './terms/lib/share'
import type { TermsSetup } from './terms/types'

type Phase = 'home' | 'play' | 'verdict'

export default function App() {
  const [phase, setPhase] = useState<Phase>('home')
  const [mode, setMode] = useState<'compass' | 'terms'>('compass')
  const [runs, setRuns] = useState<SavedRun[]>(() => listRuns())
  const [shared, setShared] = useState<SharedResult | null>(() => decodeShare(window.location.hash))
  const [sharedTerms, setSharedTerms] = useState<TermsShare | null>(() => decodeTermsShare(window.location.hash))
  const [termsChallenge, setTermsChallenge] = useState<{ seed: number; setup: TermsSetup } | null>(null)
  // The unsealed record for the bill just voted on; the deck is locked beneath it.
  const [reveal, setReveal] = useState<{ bill: Bill; verdict: VoteVerdict } | null>(null)
  const { runId, state, startNew, resume, vote, clear } = useRun(bills)

  const refreshRuns = useCallback(() => setRuns(listRuns()), [])

  // The verdict waits for the last record slip to be dismissed.
  useEffect(() => {
    if (phase === 'play' && state.finished && !reveal) {
      setPhase('verdict')
      refreshRuns()
    }
  }, [phase, state.finished, reveal, refreshRuns])

  if (shared) {
    return (
      <SharedStanding
        result={shared}
        onExit={() => {
          window.history.replaceState(null, '', window.location.pathname)
          setShared(null)
          // The whole hash is gone; drop a #t= payload decoded from the same URL.
          setSharedTerms(null)
        }}
      />
    )
  }

  // Terms share links use their own #t= namespace; checked after all hooks.
  if (sharedTerms) {
    const clearHash = () => {
      window.history.replaceState(null, '', window.location.pathname)
      setSharedTerms(null)
    }
    return (
      <SharedObituary
        share={sharedTerms}
        onChallenge={(seed, setup) => { clearHash(); setTermsChallenge({ seed, setup }); setMode('terms') }}
        onExit={clearHash}
      />
    )
  }

  let content: ReactNode
  if (mode === 'terms') {
    content = (
      <TermsApp
        challenge={termsChallenge}
        onChallengeDone={() => setTermsChallenge(null)}
        onExit={() => { setTermsChallenge(null); setMode('compass') }}
      />
    )
  } else if (phase === 'home') {
    content = (
      <Home
        runs={runs}
        onNew={() => { setReveal(null); startNew(); setPhase('play') }}
        onResume={(r) => { setReveal(null); const next = resume(r); setPhase(next.finished ? 'verdict' : 'play') }}
        onDiscard={(id) => { if (id === runId) clear(); deleteRun(id); refreshRuns() }}
        onCareer={() => setMode('terms')}
      />
    )
  } else if (phase === 'play' && (state.current || reveal)) {
    content = (
      <div className="desk">
        {state.current && (
          <SwipeDeck
            bill={state.current}
            billNumber={state.history.length + 1}
            maxTarget={state.config.max}
            locked={!!reveal}
            onVote={(input) => {
              const b = state.current
              if (b) setReveal({ bill: b, verdict: input.verdict })
              vote(input)
            }}
          />
        )}
        {reveal && <RevealSlip bill={reveal.bill} verdict={reveal.verdict} last={state.finished} onNext={() => setReveal(null)} />}
      </div>
    )
  } else if (phase === 'verdict') {
    content = (
      <Verdict
        state={state}
        onHome={() => { clear(); refreshRuns(); setPhase('home') }}
        onNewRun={() => { setReveal(null); startNew(); setPhase('play') }}
      />
    )
  } else {
    content = <div className="desk" />
  }

  return (
    <AnimatePresence>
      <motion.div
        key={`${mode}:${phase}`}
        style={{ position: 'fixed', inset: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  )
}
