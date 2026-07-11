import { BILLS_VERSION } from '../../data/version'
import type { ArchivedCareer, Obituary, SavedTermsRun } from '../types'

// Bump only when SavedTermsRun / ArchivedCareer shapes change. Mismatched runs
// are dropped on load rather than mis-replayed.
export const TERMS_SCHEMA_VERSION = 1

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

/** The single in-progress career, or null. Schema/bills mismatches are dropped
 *  (the docket is pinned against the live pool; a stale run cannot replay). */
export function loadSavedRun(): SavedTermsRun | null {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (!raw) return null
    const run = JSON.parse(raw) as SavedTermsRun
    if (!run || run.schemaVersion !== TERMS_SCHEMA_VERSION) return null
    if (run.billsVersion !== BILLS_VERSION) return null
    if (!Array.isArray(run.actions)) return null
    return run
  } catch {
    return null
  }
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
    return parsed.filter((c) => c && c.schemaVersion === TERMS_SCHEMA_VERSION && c.obituary)
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
