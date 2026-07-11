import { useCallback, useState } from 'react'
import { bills } from '../../data'
import { applyAction, newRun, replayRun } from '../engine/session'
import { scenario } from '../data/scenario'
import {
  TERMS_SCHEMA_VERSION,
  clearSavedRun,
  loadSavedRun,
  newTermsRunId,
  saveSavedRun,
} from '../lib/storage'
import { BILLS_VERSION } from '../../data/version'
import type { SavedTermsRun, TermsAction, TermsSetup, TermsState } from '../types'

interface Slot {
  state: TermsState | null
  saved: SavedTermsRun | null
}

/** Replays the persisted action log through the pure reducer; a run that no
 *  longer replays (data drift) is treated as absent. */
function boot(): Slot {
  const saved = loadSavedRun()
  if (!saved) return { state: null, saved: null }
  try {
    return { state: replayRun(scenario, bills, saved), saved }
  } catch {
    return { state: null, saved: null }
  }
}

/** The one live career, event-sourced against localStorage. */
export function useTermsRun(): {
  state: TermsState | null
  saved: SavedTermsRun | null
  start(setup: TermsSetup, seed?: number): void
  act(action: TermsAction): void
  abandon(): void
} {
  const [slot, setSlot] = useState<Slot>(boot)

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
    setSlot({ state: newRun(scenario, bills, s, setup), saved })
  }, [])

  const act = useCallback(
    (action: TermsAction) => {
      const { state, saved } = slot
      if (!state || !saved) return
      const next = applyAction(state, scenario, bills, action)
      const nextSaved: SavedTermsRun = {
        ...saved,
        actions: [...saved.actions, action],
        updatedAt: Date.now(),
        finished: next.ended !== null,
      }
      saveSavedRun(nextSaved)
      setSlot({ state: next, saved: nextSaved })
    },
    [slot],
  )

  const abandon = useCallback(() => {
    clearSavedRun()
    setSlot({ state: null, saved: null })
  }, [])

  return { state: slot.state, saved: slot.saved, start, act, abandon }
}
