import { AXIS_IDS, type AxisVector } from '../../types'
import type { EndingStamp, Obituary, TermsSetup } from '../types'

/** Decoded #t= payload — enough to render a read-only obituary card and to
 *  start a challenge run on the same seed/setup. */
export interface TermsShare {
  seed: number
  setup: TermsSetup
  branchPicks: string[]
  stamp: EndingStamp
  termsServed: number
  overall: number
  axisMeans: AxisVector
  brag: Obituary['brag']
}

const STAMPS: EndingStamp[] = [
  'DEFEATED',
  'NO CONFIDENCE',
  'EXPELLED',
  'REVOLUTION',
  'DISGRACED',
  'RETIRED WITH HONOURS',
]

const enc = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/=+$/, '')
const dec = (s: string) => decodeURIComponent(escape(atob(s)))
const round2 = (n: number) => Math.round(n * 100) / 100

export function buildTermsShareUrl(obit: Obituary): string {
  const payload = enc(
    JSON.stringify({
      d: obit.seed,
      p: obit.setup.partyId,
      s: obit.setup.seatType,
      b: obit.branchPicks,
      e: obit.ending.stamp,
      n: obit.termsServed,
      o: round2(obit.overall),
      v: AXIS_IDS.map((a) => round2(obit.axisMeans[a] ?? 0)),
      g: [
        obit.brag.termsServed,
        obit.brag.winningSide,
        obit.brag.promisesKept,
        obit.brag.promisesBroken,
        obit.brag.scandalsSurvived,
      ],
    }),
  )
  return `${location.origin}${location.pathname}#t=${payload}`
}

/** Decode a #t=… share hash (or null — never matches the compass #r= namespace). */
export function decodeTermsShare(hash: string): TermsShare | null {
  try {
    const m = hash.match(/[#&]t=([^&]+)/)
    if (!m) return null
    const obj = JSON.parse(dec(m[1])) as {
      d?: number
      p?: string
      s?: string
      b?: string[]
      e?: string
      n?: number
      o?: number
      v?: number[]
      g?: number[]
    }
    if (typeof obj.d !== 'number' || typeof obj.p !== 'string') return null
    const stamp = STAMPS.find((s) => s === obj.e)
    if (!stamp) return null
    const axisMeans = {} as AxisVector
    AXIS_IDS.forEach((a, i) => {
      axisMeans[a] = obj.v?.[i] ?? 0
    })
    const g = obj.g ?? []
    return {
      seed: obj.d,
      setup: { partyId: obj.p, seatType: obj.s === 'marginal' ? 'marginal' : 'safe' },
      branchPicks: Array.isArray(obj.b) ? obj.b.filter((x) => typeof x === 'string') : [],
      stamp,
      termsServed: obj.n ?? 0,
      overall: obj.o ?? 0,
      axisMeans,
      brag: {
        termsServed: g[0] ?? obj.n ?? 0,
        winningSide: g[1] ?? 0,
        promisesKept: g[2] ?? 0,
        promisesBroken: g[3] ?? 0,
        scandalsSurvived: g[4] ?? 0,
      },
    }
  } catch {
    return null
  }
}
