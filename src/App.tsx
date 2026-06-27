import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { bills } from './data'
import { useRun } from './hooks/useRun'
import { deleteRun, listRuns, type SavedRun } from './lib/storage'
import { decodeShare, type SharedResult } from './lib/share'
import { Home } from './components/screens/Home'
import { SwipeDeck } from './components/deck/SwipeDeck'
import { Verdict } from './components/verdict/Verdict'
import { SharedStanding } from './components/screens/SharedStanding'

const TARGET = Math.min(25, bills.length)

type Phase = 'home' | 'play' | 'verdict'

export default function App() {
  const [phase, setPhase] = useState<Phase>('home')
  const [runs, setRuns] = useState<SavedRun[]>(() => listRuns())
  const [shared, setShared] = useState<SharedResult | null>(() => decodeShare(window.location.hash))
  const { runId, state, startNew, resume, vote, clear } = useRun(bills, TARGET)

  const refreshRuns = useCallback(() => setRuns(listRuns()), [])

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

  useEffect(() => {
    if (phase === 'play' && state.finished) {
      setPhase('verdict')
      refreshRuns()
    }
  }, [phase, state.finished, refreshRuns])

  let content: ReactNode
  if (phase === 'home') {
    content = (
      <Home
        runs={runs}
        onNew={() => { startNew(); setPhase('play') }}
        onResume={(r) => { const next = resume(r); setPhase(next.finished ? 'verdict' : 'play') }}
        onDiscard={(id) => { if (id === runId) clear(); deleteRun(id); refreshRuns() }}
      />
    )
  } else if (phase === 'play' && state.current) {
    content = (
      <div className="desk">
        <SwipeDeck bill={state.current} billNumber={state.history.length + 1} total={state.target} onVote={vote} />
      </div>
    )
  } else if (phase === 'verdict') {
    content = (
      <Verdict
        state={state}
        onHome={() => { clear(); refreshRuns(); setPhase('home') }}
        onNewRun={() => { startNew(); setPhase('play') }}
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
