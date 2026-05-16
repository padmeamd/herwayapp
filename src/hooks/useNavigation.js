import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

const STREET_NAMES = [
  'High Street', 'Cornmarket Street', 'Broad Street', 'Holywell Street',
  'Beaumont Street', 'Woodstock Road', 'Banbury Road', 'St Giles',
  'Queen Street', 'Magdalen Street', 'George Street', 'Pembroke Street',
]

export function bearingToDirection(bearing) {
  const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']
  return dirs[Math.round(bearing / 45) % 8]
}

export function computeBearing([lng1, lat1], [lng2, lat2]) {
  const dLon = (lng2 - lng1) * (Math.PI / 180)
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180)
  const x =
    Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export function buildNavigationSteps(route) {
  const coords = route?.geometry?.coordinates ?? []
  if (coords.length < 2) return []

  const chunkSize = Math.max(2, Math.floor(coords.length / 6))
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
    const prev = coords[Math.max(0, i - chunkSize)]
    const curr = coords[i]
    const bearing = computeBearing(prev, curr)
    const street = STREET_NAMES[streetIdx % STREET_NAMES.length]
    streetIdx++
    const turnRight = (bearing % 360) > 45 && (bearing % 360) < 180
    steps.push({
      type: turnRight ? 'turn-right' : 'turn-left',
      icon: turnRight ? '↱' : '↰',
      instruction: turnRight ? 'Turn right' : 'Continue straight',
      detail: `onto ${street}`,
      direction: bearingToDirection(bearing),
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

function sampleRoutePositions(coords, count = 120) {
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
 * Demo walking navigation along route geometry with turn-by-turn + live safety events.
 */
export function useNavigation({
  route,
  active,
  isUnsafeRoute = false,
  userLocation = null,
  incidents = [],
}) {
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [safetyUpdate, setSafetyUpdate] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | starting | active | arrived
  const tickRef = useRef(null)
  const rerouteShown = useRef(false)
  const incidentAlertShown = useRef(false)
  const recenterToken = useRef(0)
  const [recenterRequest, setRecenterRequest] = useState(0)

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

  const bearing = useMemo(() => {
    if (!positions.length) return 0
    const idx = Math.min(Math.floor(progress * (positions.length - 1)), positions.length - 2)
    const a = positions[idx]
    const b = positions[Math.min(idx + 1, positions.length - 1)]
    return computeBearing([a.lng, a.lat], [b.lng, b.lat])
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

  const isComplete = progress >= 0.995

  const reset = useCallback(() => {
    setProgress(0)
    setStepIndex(0)
    setSafetyUpdate(null)
    setPhase('idle')
    rerouteShown.current = false
    incidentAlertShown.current = false
  }, [])

  const requestRecenter = useCallback(() => {
    recenterToken.current += 1
    setRecenterRequest(recenterToken.current)
  }, [])

  const dismissSafetyUpdate = useCallback(() => setSafetyUpdate(null), [])

  useEffect(() => {
    if (!active || !route) {
      reset()
      return undefined
    }

    reset()
    setPhase('starting')
    const startTimer = setTimeout(() => setPhase('active'), 600)

    const intervalMs = 750
    const stepProgress = 0.014

    tickRef.current = setInterval(() => {
      setProgress(p => {
        const next = Math.min(1, p + stepProgress)
        const stepAt = Math.floor(next * Math.max(steps.length - 1, 1))
        setStepIndex(Math.min(stepAt, steps.length - 1))
        if (next >= 0.995) setPhase('arrived')
        return next
      })
    }, intervalMs)

    return () => {
      clearTimeout(startTimer)
      clearInterval(tickRef.current)
    }
  }, [active, route?.index, route?.role]) // eslint-disable-line

  // Unsafe route: danger ahead
  useEffect(() => {
    if (!active || !isUnsafeRoute || phase !== 'active' || rerouteShown.current) return undefined
    const t = setTimeout(() => {
      rerouteShown.current = true
      setSafetyUpdate({
        type: 'danger',
        message: 'New harassment report detected 150m ahead',
        action: 'Tap Reroute for the safe green path',
      })
    }, 7000)
    return () => clearTimeout(t)
  }, [active, isUnsafeRoute, phase])

  // Safe route: periodic clear updates
  useEffect(() => {
    if (!active || isUnsafeRoute || phase !== 'active') return undefined
    const t1 = setTimeout(() => {
      setSafetyUpdate({ type: 'safe', message: 'Route clear — no new alerts on your path' })
      const t2 = setTimeout(() => setSafetyUpdate(null), 3500)
      return () => clearTimeout(t2)
    }, 5000)
    return () => clearTimeout(t1)
  }, [active, isUnsafeRoute, phase])

  // Simulated mid-navigation incident (both routes)
  useEffect(() => {
    if (!active || phase !== 'active' || incidentAlertShown.current) return undefined
    const t = setTimeout(() => {
      incidentAlertShown.current = true
      if (!isUnsafeRoute) {
        setSafetyUpdate({
          type: 'danger',
          message: 'Suspicious activity reported nearby',
          action: 'HerWay is monitoring your route',
        })
        setTimeout(() => setSafetyUpdate(null), 5000)
      }
    }, 12000)
    return () => clearTimeout(t)
  }, [active, phase, isUnsafeRoute])

  return {
    progress,
    position,
    bearing,
    steps,
    stepIndex,
    currentStep,
    nextStep,
    distanceRemaining,
    etaSeconds,
    safetyUpdate,
    dismissSafetyUpdate,
    isComplete,
    phase,
    recenterRequest,
    requestRecenter,
  }
}
