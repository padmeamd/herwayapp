import { useState, useEffect } from 'react'

function getMatch(query) {
  if (typeof window === 'undefined') return false
  return window.matchMedia(query).matches
}

/**
 * Reliable viewport breakpoints (resize + orientation).
 * - isMobile: phones and narrow viewports (< 768px)
 * - isTablet: tablet portrait / small landscape (768–1023px)
 * - isDesktop: sidebar layout (≥ 1024px)
 * - isCompact: mobile + tablet (uses bottom sheet / journey card)
 */
export function useBreakpoint() {
  const [isMobile, setIsMobile] = useState(() => getMatch('(max-width: 767px)'))
  const [isTablet, setIsTablet] = useState(() => getMatch('(min-width: 768px) and (max-width: 1023px)'))
  const [isDesktop, setIsDesktop] = useState(() => getMatch('(min-width: 1024px)'))

  useEffect(() => {
    const mobileMq = window.matchMedia('(max-width: 767px)')
    const tabletMq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const desktopMq = window.matchMedia('(min-width: 1024px)')

    const sync = () => {
      setIsMobile(mobileMq.matches)
      setIsTablet(tabletMq.matches)
      setIsDesktop(desktopMq.matches)
    }

    sync()
    mobileMq.addEventListener('change', sync)
    tabletMq.addEventListener('change', sync)
    desktopMq.addEventListener('change', sync)
    return () => {
      mobileMq.removeEventListener('change', sync)
      tabletMq.removeEventListener('change', sync)
      desktopMq.removeEventListener('change', sync)
    }
  }, [])

  const isCompact = isMobile || isTablet

  return { isMobile, isTablet, isDesktop, isCompact }
}
