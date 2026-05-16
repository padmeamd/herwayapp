import { useEffect } from 'react'

/** Prevent background scroll when overlays are open (iOS-friendly). */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}
