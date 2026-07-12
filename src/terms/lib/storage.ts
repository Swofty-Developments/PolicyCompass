import { BILLS_VERSION } from '../../data/version'
import type { ArchivedCareer, Obituary, SavedTermsRun } from '../types'

// Bump when SavedTermsRun / ArchivedCareer shapes change OR reducer behavior
// changes replay semantics. Mismatched runs are dropped rather than mis-replayed.
// v2: term-scoped ultimatum + recess settlement + Emergency Whip.
export const TERMS_SCHEMA_VERSION = 2

/** Oldest ArchivedCareer schema still readable (the Obituary shape is unchanged
 *  since v1 — reducer-semantics bumps must not drop filed careers). */
const ARCHIVE_MIN_SCHEMA = 1

const RUN_KEY = 'policy-compass.terms.run'
const ARCHIVE_KEY = 'policy-compass.terms.archive'

export function newTermsRunId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* fall through */
  }
  return `term-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

export type DroppedReason = 'schema' | 'bills' | 'scenario' | 'corrupt'

/** The single in-progress career. Schema/bills/scenario mismatches are dropped
 *  (the docket is pinned against the live pool; a stale run cannot replay).
 *  Pure read — no side effects, safe in render/StrictMode; the caller clears
 *  the stale blob in an effect so the drop is reported exactly once. */
export function loadSavedRunResult(scenarioId?: string): {
  run: SavedTermsRun | null
  dropped: DroppedReason | null
} {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (!raw) return { run: null, dropped: null }
    const run = JSON.parse(raw) as SavedTermsRun
    if (!run || !Array.isArray(run.actions)) return { run: null, dropped: 'corrupt' }
    if (run.schemaVersion !== TERMS_SCHEMA_VERSION) return { run: null, dropped: 'schema' }
    if (run.billsVersion !== BILLS_VERSION) return { run: null, dropped: 'bills' }
    if (scenarioId && run.scenarioId !== scenarioId) return { run: null, dropped: 'scenario' }
    return { run, dropped: null }
  } catch {
    return { run: null, dropped: 'corrupt' }
  }
}

export function loadSavedRun(): SavedTermsRun | null {
  return loadSavedRunResult().run
}

export function saveSavedRun(run: SavedTermsRun): void {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(run))
  } catch {
    /* storage full / unavailable — fail silently */
  }
}

export function clearSavedRun(): void {
  try {
    localStorage.removeItem(RUN_KEY)
  } catch {
    /* ignore */
  }
}

function readArchive(): ArchivedCareer[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ArchivedCareer[]
    if (!Array.isArray(parsed)) return []
    // Obituaries are self-contained snapshots: keep across bills versions,
    // drop only on a schema (shape) mismatch.
    return parsed.filter(
      (c) => c && c.schemaVersion >= ARCHIVE_MIN_SCHEMA && c.schemaVersion <= TERMS_SCHEMA_VERSION && c.obituary,
    )
  } catch {
    return []
  }
}

function writeArchive(careers: ArchivedCareer[]): void {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(careers))
  } catch {
    /* fail silently */
  }
}

/** All filed careers, newest first. */
export function listArchive(): ArchivedCareer[] {
  return readArchive().sort((a, b) => b.createdAt - a.createdAt)
}

export function fileCareer(obit: Obituary): ArchivedCareer {
  const entry: ArchivedCareer = {
    id: newTermsRunId(),
    createdAt: Date.now(),
    schemaVersion: TERMS_SCHEMA_VERSION,
    billsVersion: obit.billsVersion,
    obituary: obit,
  }
  writeArchive([entry, ...readArchive()])
  return entry
}

export function deleteCareer(id: string): void {
  writeArchive(readArchive().filter((c) => c.id !== id))
}
