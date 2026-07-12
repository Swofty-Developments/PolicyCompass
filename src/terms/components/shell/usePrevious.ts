import { useEffect, useRef } from 'react'

/** The value as of the previous render — the rails compare against it to flash
 *  rows that moved on the last division. Display-only. */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}
