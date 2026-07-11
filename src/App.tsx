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

type Phase = 'home' | 'play' | 'verdict'

export default function App() {
  const [phase, setPhase] = useState<Phase>('home')
  const [runs, setRuns] = useState<SavedRun[]>(() => listRuns())
  const [shared, setShared] = useState<SharedResult | null>(() => decodeShare(window.location.hash))
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
        }}
      />
    )
  }

  let content: ReactNode
  if (phase === 'home') {
    content = (
      <Home
        runs={runs}
        onNew={() => { setReveal(null); startNew(); setPhase('play') }}
        onResume={(r) => { setReveal(null); const next = resume(r); setPhase(next.finished ? 'verdict' : 'play') }}
        onDiscard={(id) => { if (id === runId) clear(); deleteRun(id); refreshRuns() }}
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
        key={phase}
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
