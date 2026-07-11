import { useCallback, useEffect, useRef, useState } from 'react'
import type { Bill } from '../types'
import {
  applyVote,
  createSession,
  rebuildSession,
  DEFAULT_CONFIG,
  type SessionState,
  type VoteInput,
} from '../engine/session'
import { newRunId, saveRun, type SavedRun, type SavedVote } from '../lib/storage'

const votesOf = (state: SessionState): SavedVote[] =>
  state.history.map((h) => ({ billId: h.billId, verdict: h.verdict, conviction: h.conviction }))
const signature = (state: SessionState) => JSON.stringify({ v: votesOf(state), f: state.finished })

/** A session bound to a persisted run. Every real vote is written to localStorage. */
export function useRun(bills: Bill[], config = DEFAULT_CONFIG) {
  const [runId, setRunId] = useState<string | null>(null)
  const [state, setState] = useState<SessionState>(() => createSession(bills, config))
  // Signature last written, so loading a run never rewrites it (which would un-seal a
  // finished run replayed against a changed deck, or bump updatedAt with no change).
  const lastSaved = useRef<string>('')

  useEffect(() => {
    if (!runId) return
    if (state.history.length === 0) return // don't persist a brand-new zero-vote run
    const sig = signature(state)
    if (sig === lastSaved.current) return
    lastSaved.current = sig
    saveRun({ id: runId, target: state.config.max, votes: votesOf(state), finished: state.finished })
  }, [runId, state])

  const startNew = useCallback(() => {
    lastSaved.current = ''
    setRunId(newRunId())
    setState(createSession(bills, config))
  }, [bills, config])

  const resume = useCallback(
    (saved: SavedRun): SessionState => {
      const next = rebuildSession(bills, saved.votes, config)
      lastSaved.current = signature(next)
      setRunId(saved.id)
      setState(next)
      return next
    },
    [bills, config],
  )

  const clear = useCallback(() => setRunId(null), [])

  const vote = useCallback((input: VoteInput) => setState((s) => applyVote(s, bills, input)), [bills])

  return { runId, state, startNew, resume, vote, clear }
}
