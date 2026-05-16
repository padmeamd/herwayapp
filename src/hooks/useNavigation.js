import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

const STREET_NAMES = [
  'High Street', 'Cornmarket Street', 'Broad Street', 'Holywell Street',
  'Beaumont Street', 'Woodstock Road', 'Banbury Road', 'St Giles',
  'Queen Street', 'Magdalen Street', 'George Street', 'Pembroke Street',
]

function bearingToDirection(bearing) {
  const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']
  return dirs[Math.round(bearing / 45) % 8]
}

function computeBearing([lng1, lat1], [lng2, lat2]) {
  const dLon = (lng2 - lng1) * (Math.PI / 180)
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180)
  const x =
    Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Build turn-by-turn steps from route geometry (demo). */
export function buildNavigationSteps(route) {
  const coords = route?.geometry?.coordinates ?? []
  if (coords.length < 2) return []

  const chunkSize = Math.max(2, Math.floor(coords.length / 5))
  const steps = []
  let streetIdx = 0

  steps.push({
    type: 'depart',
    icon: '🚶',
    instruction: 'Start walking',
    detail: `Head toward ${STREET_NAMES[streetIdx % STREET_NAMES.length]}`,
    distanceM: 0,
  })

  for (let i = chunkSize; i < coords.length - 1; i += chunkSize) {
    const prev = coords[i - chunkSize]
    const curr = coords[i]
    const bearing = computeBearing(prev, curr)
    const dir = bearingToDirection(bearing)
    const street = STREET_NAMES[streetIdx % STREET_NAMES.length]
    streetIdx++

    const turnRight = (bearing % 360) > 45 && (bearing % 360) < 180
    steps.push({
      type: turnRight ? 'turn-right' : 'turn-left',
      icon: turnRight ? '↱' : '↰',
      instruction: turnRight ? 'Turn right' : 'Continue',
      detail: `onto ${street}`,
      direction: dir,
      distanceM: Math.round((i / coords.length) * (route.distance ?? 800)),
    })
  }

  steps.push({
    type: 'arrive',
    icon: '📍',
    instruction: 'You have arrived',
    detail: 'Destination is on your right',
    distanceM: route?.distance ?? 0,
  })

  return steps
}

/** Sample lat/lng points along the route for live position. */
function sampleRoutePositions(coords, count = 80) {
  if (coords.length < 2) return []
  const out = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const idx = t * (coords.length - 1)
    const i0 = Math.floor(idx)
    const i1 = Math.min(i0 + 1, coords.length - 1)
    const f = idx - i0
    const [lng0, lat0] = coords[i0]
    const [lng1, lat1] = coords[i1]
    out.push({ lat: lat0 + (lat1 - lat0) * f, lng: lng0 + (lng1 - lng0) * f, t })
  }
  return out
}

/**
 * Demo navigation: advances along route geometry with turn-by-turn state.
 */
export function useNavigation({ route, active, isUnsafeRoute = false }) {
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [safetyUpdate, setSafetyUpdate] = useState(null)
  const tickRef = useRef(null)
  const rerouteShown = useRef(false)

  const positions = useMemo(
    () => sampleRoutePositions(route?.geometry?.coordinates ?? []),
    [route],
  )

  const steps = useMemo(() => (route ? buildNavigationSteps(route) : []), [route])

  const position = useMemo(() => {
    if (!positions.length) return null
    const idx = Math.min(Math.floor(progress * (positions.length - 1)), positions.length - 1)
    return positions[idx]
  }, [positions, progress])

  const currentStep = steps[stepIndex] ?? steps[0]
  const nextStep = steps[stepIndex + 1]

  const distanceRemaining = useMemo(() => {
    if (!route?.distance) return 0
    return Math.round(route.distance * (1 - progress))
  }, [route, progress])

  const etaSeconds = useMemo(() => {
    if (!route?.duration) return 0
    return Math.round(route.duration * (1 - progress))
  }, [route, progress])

  const reset = useCallback(() => {
    setProgress(0)
    setStepIndex(0)
    setSafetyUpdate(null)
    rerouteShown.current = false
  }, [])

  useEffect(() => {
    if (!active || !route) {
      reset()
      return undefined
    }

    reset()
    const intervalMs = 1200

    tickRef.current = setInterval(() => {
      setProgress(p => {
        const next = Math.min(1, p + 0.018)
        const stepAt = Math.floor(next * Math.max(steps.length - 1, 1))
        setStepIndex(Math.min(stepAt, steps.length - 1))
        return next
      })
    }, intervalMs)

    return () => clearInterval(tickRef.current)
  }, [active, route?.index]) // eslint-disable-line

  // Dynamic safety update + reroute demo on unsafe routes
  useEffect(() => {
    if (!active || !isUnsafeRoute || rerouteShown.current) return undefined

    const t = setTimeout(() => {
      rerouteShown.current = true
      setSafetyUpdate({
        type: 'danger',
        message: 'New harassment report detected 150m ahead',
        action: 'Rerouting to safer path recommended',
      })
    }, 8000)

    return () => clearTimeout(t)
  }, [active, isUnsafeRoute])

  useEffect(() => {
    if (!active || isUnsafeRoute) return undefined
    const t = setTimeout(() => {
      setSafetyUpdate({
        type: 'safe',
        message: 'Route clear — no new alerts on your path',
      })
      setTimeout(() => setSafetyUpdate(null), 4000)
    }, 6000)
    return () => clearTimeout(t)
  }, [active, isUnsafeRoute])

  const dismissSafetyUpdate = useCallback(() => setSafetyUpdate(null), [])

  return {
    progress,
    position,
    steps,
    stepIndex,
    currentStep,
    nextStep,
    distanceRemaining,
    etaSeconds,
    safetyUpdate,
    dismissSafetyUpdate,
    isComplete: progress >= 0.99,
  }
}
