import { AXIS_IDS, type AxisId, type AxisVector } from '../types'

export interface SharedResult {
  vector: AxisVector
  stds: Record<AxisId, number>
  tally: [number, number]
}

const enc = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/=+$/, '')
const dec = (s: string) => decodeURIComponent(escape(atob(s)))

/** Encode the standing into a short, URL-safe share link. */
export function buildShareUrl(vector: AxisVector, stds: Record<AxisId, number>, tally: [number, number]): string {
  const v = AXIS_IDS.map((a) => Math.round((vector[a] ?? 0) * 100) / 100)
  const s = AXIS_IDS.map((a) => Math.round((stds[a] ?? 0.2) * 100) / 100)
  const payload = enc(JSON.stringify({ v, s, t: tally }))
  return `${location.origin}${location.pathname}#r=${payload}`
}

/** Decode a #r=… share hash back into a standing (or null). */
export function decodeShare(hash: string): SharedResult | null {
  try {
    const m = hash.match(/[#&]r=([^&]+)/)
    if (!m) return null
    const obj = JSON.parse(dec(m[1])) as { v: number[]; s?: number[]; t?: [number, number] }
    const vector = {} as AxisVector
    const stds = {} as Record<AxisId, number>
    AXIS_IDS.forEach((a, i) => {
      vector[a] = obj.v?.[i] ?? 0
      stds[a] = obj.s?.[i] ?? 0.2
    })
    return { vector, stds, tally: obj.t ?? [0, 0] }
  } catch {
    return null
  }
}
