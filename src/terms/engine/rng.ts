// Stateless seeded rolls. Every draw site derives its own generator from
// (runSeed, tag), so replay/resume can never desync a PRNG cursor.

export function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One roll in [0,1) for a named draw site, e.g. "hesitant:12:bloc-labour:4". */
export function roll(seed: number, tag: string): number {
  return mulberry32(fnv1a(String(seed) + ':' + tag))()
}

/** Seeded pick from a non-empty list. */
export function pick<T>(seed: number, tag: string, items: T[]): T {
  return items[Math.min(items.length - 1, Math.floor(roll(seed, tag) * items.length))]
}
