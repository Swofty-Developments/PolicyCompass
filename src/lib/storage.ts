import { BILLS_VERSION, RUN_SCHEMA_VERSION } from '../data/version'

export interface SavedVote {
  billId: string
  ratified: boolean
}

export interface SavedRun {
  id: string
  createdAt: number
  updatedAt: number
  schemaVersion: number
  billsVersion: string
  target: number
  votes: SavedVote[]
  finished: boolean
}

const KEY = 'policy-compass.runs'

function readAll(): Record<string, SavedRun> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, SavedRun>
    // Drop runs written under an incompatible run-schema (forward/backward safety).
    const out: Record<string, SavedRun> = {}
    for (const [id, run] of Object.entries(parsed)) {
      if (run && run.schemaVersion === RUN_SCHEMA_VERSION) out[id] = run
    }
    return out
  } catch {
    return {}
  }
}

function writeAll(runs: Record<string, SavedRun>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(runs))
  } catch {
    /* storage full / unavailable — fail silently */
  }
}

export function newRunId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* fall through */
  }
  return `run-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

/** All saved runs, newest first. */
export function listRuns(): SavedRun[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt)
}

export function saveRun(input: {
  id: string
  target: number
  votes: SavedVote[]
  finished: boolean
}): void {
  const all = readAll()
  const now = Date.now()
  const existing = all[input.id]
  all[input.id] = {
    id: input.id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    schemaVersion: RUN_SCHEMA_VERSION,
    billsVersion: BILLS_VERSION,
    target: input.target,
    votes: input.votes,
    finished: input.finished,
  }
  writeAll(all)
}

export function deleteRun(id: string): void {
  const all = readAll()
  delete all[id]
  writeAll(all)
}
