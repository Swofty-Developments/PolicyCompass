// Acceptance gate 1 (docs/TERMS.md): curated ids/titles valid against the live
// pool; per-path docket bands; mandatory treasury deltas; fill exclusion.
// Run: npx tsx scripts/terms-audit.mts

import { bills } from '../src/data/bills'
import { scenario } from '../src/terms/data/scenario'
import { projectSeats } from '../src/terms/engine/floor'
import { curatedBillIds } from '../src/terms/engine/session'
import type { Act } from '../src/terms/types'

// Runs under tsx; the project ships no @types/node.
declare const process: { exit(code?: number): never }

const failures: string[] = []
const fail = (msg: string): void => {
  failures.push(msg)
}

const byId = new Map(bills.map((b) => [b.id, b]))

// ---- 1. every curated slot resolves and matches its pinned title ----------------

for (const [actId, act] of Object.entries(scenario.acts)) {
  act.slots.forEach((slot, i) => {
    if (slot.kind === 'bill') {
      const bill = byId.get(slot.billId)
      if (!bill) fail(`${actId}[${i}]: bill id '${slot.billId}' not in the pool`)
      else if (bill.title !== slot.expectTitle) {
        fail(`${actId}[${i}]: '${slot.billId}' title drifted\n    pinned: ${slot.expectTitle}\n    pool:   ${bill.title}`)
      }
    }
    if (slot.kind === 'event' && !scenario.events.some((e) => e.id === slot.eventId)) {
      fail(`${actId}[${i}]: event id '${slot.eventId}' not authored`)
    }
  })
}

// ---- 2. per-path docket bands (neutral-centrist founding-bloc assumptions) ------

function walkPaths(): string[][] {
  const out = new Map<string, string[]>()
  const walk = (actId: string, trail: string[]): void => {
    const act = scenario.acts[actId]
    if (!act) {
      fail(`branch leads to missing act '${actId}' (after ${trail.join(' → ')})`)
      return
    }
    const path = [...trail, actId]
    // Distinct paths are distinct act sequences; same-destination options merge.
    const next = act.branch?.options ?? []
    if (next.length === 0) {
      out.set(path.join('→'), path)
      return
    }
    for (const o of next) if (!path.includes(o.nextActId)) walk(o.nextActId, path)
  }
  walk(scenario.firstActId, [])
  return [...out.values()]
}
const paths = walkPaths()

const founding = scenario.blocs
  .filter((b) => !b.emergent)
  .map((b) => ({ blocId: b.id, vector: b.vector, seats: b.seats }))

interface PathRow {
  path: string
  bills: number
  passRate: number
  contestedRate: number
  knifeEdges: number
  ok: boolean
}

const rows: PathRow[] = []
for (const path of paths) {
  let total = 0
  let passing = 0
  let contested = 0
  let knife = 0
  for (const actId of path) {
    const act: Act = scenario.acts[actId]
    for (const slot of act.slots) {
      if (slot.kind !== 'bill') continue
      const bill = byId.get(slot.billId)
      if (!bill) continue
      total++
      const p = projectSeats(founding, bill)
      let expAyes = 0
      for (const b of p.byBloc) expAyes += b.side === 'for' ? b.seats : b.side === 'hesitant' ? b.seats * b.stance : 0
      const seatSum = founding.reduce((s, f) => s + f.seats, 0)
      if (expAyes > seatSum - expAyes) passing++
      if (p.contested) contested++
      if (p.knifeEdge) knife++
    }
  }
  const passRate = total ? passing / total : 0
  const contestedRate = total ? contested / total : 0
  const ok = passRate >= 0.4 && passRate <= 0.6 && contestedRate >= 0.25 && knife >= 1 && knife <= 3
  rows.push({ path: path.join(' → '), bills: total, passRate, contestedRate, knifeEdges: knife, ok })
  if (!ok) {
    if (passRate < 0.4 || passRate > 0.6) {
      fail(`${path.join(' → ')}: projected passage ${(passRate * 100).toFixed(0)}% outside 40–60%`)
    }
    if (contestedRate < 0.25) {
      fail(`${path.join(' → ')}: contested ${(contestedRate * 100).toFixed(0)}% below 25%`)
    }
    if (knife < 1 || knife > 3) fail(`${path.join(' → ')}: ${knife} knife-edges outside 1–3`)
  }
}

// ---- 3. fiscal/economic curated bills must carry an authored treasury delta -----

for (const [actId, act] of Object.entries(scenario.acts)) {
  act.slots.forEach((slot, i) => {
    if (slot.kind !== 'bill') return
    const bill = byId.get(slot.billId)
    if (!bill) return
    const primary = bill.loadings[0]?.axis
    if ((primary === 'fiscal' || primary === 'economic') && slot.treasury === undefined) {
      fail(`${actId}[${i}]: '${slot.billId}' (${primary}) has no authored treasury delta`)
    }
  })
}

// ---- 4. fill exclusion covers every act, both branch variants -------------------

const excluded = curatedBillIds(scenario)
for (const [actId, act] of Object.entries(scenario.acts)) {
  for (const slot of act.slots) {
    if (slot.kind === 'bill' && !excluded.has(slot.billId)) {
      fail(`fill exclusion misses '${slot.billId}' from ${actId}`)
    }
  }
}
const reachable = new Set(paths.flat())
for (const actId of Object.keys(scenario.acts)) {
  if (!reachable.has(actId)) fail(`act '${actId}' is unreachable from ${scenario.firstActId}`)
}

// ---- report ---------------------------------------------------------------------

const pad = (s: string, n: number): string => (s.length >= n ? s : s + ' '.repeat(n - s.length))
console.log('\nTERMS DOCKET AUDIT — per-path bands (bands: pass 40–60%, contested ≥25%, knife 1–3)\n')
console.log(
  pad('path', 44) + pad('bills', 7) + pad('pass', 7) + pad('contest', 9) + pad('knife', 7) + 'band',
)
for (const r of rows) {
  console.log(
    pad(r.path, 44) +
      pad(String(r.bills), 7) +
      pad((r.passRate * 100).toFixed(0) + '%', 7) +
      pad((r.contestedRate * 100).toFixed(0) + '%', 9) +
      pad(String(r.knifeEdges), 7) +
      (r.ok ? 'OK' : 'FAIL'),
  )
}
console.log('')
if (failures.length) {
  console.error(`AUDIT FAILED — ${failures.length} problem(s):\n`)
  for (const f of failures) console.error('  ✗ ' + f)
  console.error('')
  process.exit(1)
}
console.log('AUDIT PASSED — every curated id resolves, titles match, bands hold.\n')
