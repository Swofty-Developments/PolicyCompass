import { useCallback, useEffect, useRef, useState } from 'react'
import { bills } from '../../data'
import { applyAction, newRun, replayRun } from '../engine/session'
import { scenario } from '../data/scenario'
import {
  TERMS_SCHEMA_VERSION,
  clearSavedRun,
  loadSavedRunResult,
  newTermsRunId,
  saveSavedRun,
  type DroppedReason,
} from '../lib/storage'
import { BILLS_VERSION } from '../../data/version'
import type { SavedTermsRun, TermsAction, TermsSetup, TermsState } from '../types'

interface Slot {
  state: TermsState | null
  saved: SavedTermsRun | null
  dropped: DroppedReason | null
}

/** Replays the persisted action log through the pure reducer; a run that no
 *  longer replays (data drift) is dropped and reported once. Pure — the stale
 *  blob is cleared by the mount effect below, not here (StrictMode-safe). */
function boot(): Slot {
  const { run, dropped } = loadSavedRunResult(scenario.id)
  if (!run) return { state: null, saved: null, dropped }
  try {
    return { state: replayRun(scenario, bills, run), saved: run, dropped: null }
  } catch {
    return { state: null, saved: null, dropped: 'corrupt' }
  }
}

/** The one live career, event-sourced against localStorage. */
export function useTermsRun(): {
  state: TermsState | null
  saved: SavedTermsRun | null
  /** Set when boot dropped an unreadable/mismatched save (reported once). */
  dropped: DroppedReason | null
  start(setup: TermsSetup, seed?: number): void
  act(action: TermsAction): void
  abandon(): void
} {
  const [slot, setSlot] = useState<Slot>(boot)
  // Live view of the slot for callbacks that outlive their render (a swipe
  // commit animation can land after abandon(); it must not resurrect the run).
  const slotRef = useRef(slot)
  slotRef.current = slot

  // Clear a dropped save's stale blob post-mount (boot is a pure read).
  useEffect(() => {
    if (slotRef.current.dropped) clearSavedRun()
  }, [])

  const start = useCallback((setup: TermsSetup, seed?: number) => {
    const s = seed ?? ((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0)
    const now = Date.now()
    const saved: SavedTermsRun = {
      id: newTermsRunId(),
      createdAt: now,
      updatedAt: now,
      schemaVersion: TERMS_SCHEMA_VERSION,
      billsVersion: BILLS_VERSION,
      scenarioId: scenario.id,
      seed: s,
      setup,
      actions: [],
      finished: false,
    }
    saveSavedRun(saved)
    setSlot({ state: newRun(scenario, bills, s, setup), saved, dropped: null })
  }, [])

  const act = useCallback((action: TermsAction) => {
    const { state, saved } = slotRef.current
    if (!state || !saved) return
    const next = applyAction(state, scenario, bills, action)
    const nextSaved: SavedTermsRun = {
      ...saved,
      actions: [...saved.actions, action],
      updatedAt: Date.now(),
      finished: next.ended !== null,
    }
    saveSavedRun(nextSaved)
    setSlot({ state: next, saved: nextSaved, dropped: null })
  }, [])

  const abandon = useCallback(() => {
    clearSavedRun()
    setSlot({ state: null, saved: null, dropped: null })
  }, [])

  return { state: slot.state, saved: slot.saved, dropped: slot.dropped, start, act, abandon }
}
