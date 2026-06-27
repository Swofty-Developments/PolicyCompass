import { useCallback, useEffect, useRef, useState } from 'react'
import type { Bill } from '../types'
import { applyVote, createSession, rebuildSession, type SessionState } from '../engine/session'
import { newRunId, saveRun, type SavedRun } from '../lib/storage'

const votesOf = (state: SessionState) => state.history.map((h) => ({ billId: h.billId, ratified: h.ratified }))
const signature = (state: SessionState) => JSON.stringify({ v: votesOf(state), f: state.finished })

/** A session bound to a persisted run. Every real vote is written to localStorage. */
export function useRun(bills: Bill[], target: number) {
  const [runId, setRunId] = useState<string | null>(null)
  const [state, setState] = useState<SessionState>(() => createSession(bills, target))
  // Signature last written, so loading a run never rewrites it (which would un-seal a
  // finished run replayed against a changed deck, or bump updatedAt with no change).
  const lastSaved = useRef<string>('')

  useEffect(() => {
    if (!runId) return
    if (state.history.length === 0) return // don't persist a brand-new zero-vote run
    const sig = signature(state)
    if (sig === lastSaved.current) return
    lastSaved.current = sig
    saveRun({ id: runId, target: state.target, votes: votesOf(state), finished: state.finished })
  }, [runId, state])

  const startNew = useCallback(() => {
    lastSaved.current = ''
    setRunId(newRunId())
    setState(createSession(bills, target))
  }, [bills, target])

  const resume = useCallback(
    (saved: SavedRun): SessionState => {
      const next = rebuildSession(bills, saved.target ?? target, saved.votes)
      lastSaved.current = signature(next)
      setRunId(saved.id)
      setState(next)
      return next
    },
    [bills, target],
  )

  const clear = useCallback(() => setRunId(null), [])

  const vote = useCallback((ratified: boolean) => setState((s) => applyVote(s, bills, ratified)), [bills])

  return { runId, state, startNew, resume, vote, clear }
}
