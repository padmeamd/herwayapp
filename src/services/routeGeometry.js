import { haversineKm } from './routingService'

/** Minimum distance (km) from a point to sampled route coordinates. */
export function minDistToRouteKm(routeCoords, lat, lng, step = 4) {
  let min = Infinity
  for (let i = 0; i < routeCoords.length; i += step) {
    const [cLng, cLat] = routeCoords[i]
    const d = haversineKm(cLat, cLng, lat, lng)
    if (d < min) min = d
  }
  return min
}

/** Risk score for a path — lower is safer. */
export function incidentRiskScore(routeCoords, incidents = []) {
  if (!routeCoords?.length || !incidents?.length) return 0

  let score = 0
  const step = Math.max(1, Math.floor(routeCoords.length / 40))

  for (let i = 0; i < routeCoords.length; i += step) {
    const [lng, lat] = routeCoords[i]
    for (const inc of incidents) {
      const d = haversineKm(lat, lng, inc.lat, inc.lng)
      const w = inc.severity === 'high' ? 1 : inc.severity === 'medium' ? 0.65 : 0.35
      if (d < 0.07) score += 28 * w
      else if (d < 0.14) score += 14 * w
      else if (d < 0.22) score += 6 * w
      else if (d < 0.32) score += 2 * w
    }
  }

  return score
}

/** True when two paths follow the same corridor (not distinct alternatives). */
export function routesAreSimilar(coordsA, coordsB, thresholdKm = 0.055) {
  if (!coordsA?.length || !coordsB?.length) return true
  const step = Math.max(1, Math.floor(coordsA.length / 16))
  let close = 0
  let samples = 0
  for (let i = 0; i < coordsA.length; i += step) {
    samples++
    const [lng, lat] = coordsA[i]
    if (minDistToRouteKm(coordsB, lat, lng, 2) < thresholdKm) close++
  }
  return samples > 0 && close / samples >= 0.82
}

function segmentPerpendicular(lng0, lat0, lng1, lat1) {
  const dx = lng1 - lng0
  const dy = lat1 - lat0
  const len = Math.hypot(dx, dy) || 1e-9
  return { lng: -dy / len, lat: dx / len }
}

function bearingAtIndex(coords, idx) {
  const i0 = Math.max(0, idx - 2)
  const i1 = Math.min(coords.length - 1, idx + 2)
  const [lng0, lat0] = coords[i0]
  const [lng1, lat1] = coords[i1]
  return segmentPerpendicular(lng0, lat0, lng1, lat1)
}

/**
 * Pick 0–2 via-waypoints on real streets (for OSRM) to skirt incidents
 * without large artificial curves.
 */
export function computeSafetyWaypoints(directCoords, incidents = [], safeSpaces = []) {
  if (directCoords.length < 4 || !incidents.length) return []

  const n = directCoords.length
  const step = Math.max(1, Math.floor(n / 28))
  const hotspots = []

  for (let i = step; i < n - step; i += step) {
    const [lng, lat] = directCoords[i]
    let worst = null
    let worstD = Infinity

    for (const inc of incidents) {
      const d = haversineKm(lat, lng, inc.lat, inc.lng)
      const limit = inc.severity === 'high' ? 0.26 : inc.severity === 'medium' ? 0.22 : 0.18
      if (d < limit && d < worstD) {
        worstD = d
        worst = inc
      }
    }

    if (worst) {
      hotspots.push({ idx: i, lng, lat, worstD, incident: worst })
    }
  }

  if (!hotspots.length) return []

  const clusters = []
  let cluster = [hotspots[0]]

  for (let i = 1; i < hotspots.length; i++) {
    if (hotspots[i].idx - cluster[cluster.length - 1].idx <= step * 3) {
      cluster.push(hotspots[i])
    } else {
      clusters.push(cluster)
      cluster = [hotspots[i]]
    }
  }
  clusters.push(cluster)

  const hub = safeSpaces?.length
    ? [...safeSpaces].sort((a, b) => (b.lightingScore ?? 0) - (a.lightingScore ?? 0))[0]
    : null

  const waypoints = []

  for (const group of clusters.slice(0, 2)) {
    const mid = group[Math.floor(group.length / 2)]
    const perp = bearingAtIndex(directCoords, mid.idx)

    let sign = 1
    let bestMin = -1
    for (const s of [-1, 1]) {
      const testLng = mid.lng + perp.lng * 0.001 * s
      const testLat = mid.lat + perp.lat * 0.001 * s
      let minD = Infinity
      for (const inc of incidents) {
        minD = Math.min(minD, haversineKm(testLat, testLng, inc.lat, inc.lng))
      }
      if (minD > bestMin) {
        bestMin = minD
        sign = s
      }
    }

    const severity = group.some(h => h.incident.severity === 'high') ? 'high' : 'medium'
    const offsetDeg = severity === 'high' ? 0.00105 : 0.00088

    let wpLng = mid.lng + perp.lng * offsetDeg * sign
    let wpLat = mid.lat + perp.lat * offsetDeg * sign

    if (hub) {
      const hubD = haversineKm(wpLat, wpLng, hub.lat, hub.lng)
      if (hubD < 0.45) {
        wpLng += (hub.lng - wpLng) * 0.22
        wpLat += (hub.lat - wpLat) * 0.22
      }
    }

    waypoints.push({ lat: wpLat, lng: wpLng })
  }

  return waypoints
}

/** Single via-point when alternatives still overlap the direct path. */
export function computeFallbackDetourWaypoint(directCoords, incidents = []) {
  if (directCoords.length < 3) return []

  const idx = Math.floor(directCoords.length * 0.42)
  const [lng, lat] = directCoords[idx]
  const perp = bearingAtIndex(directCoords, idx)

  let sign = 1
  if (incidents.length) {
    let bestMin = -1
    for (const s of [-1, 1]) {
      const tLng = lng + perp.lng * 0.001 * s
      const tLat = lat + perp.lat * 0.001 * s
      let minD = Infinity
      for (const inc of incidents) {
        minD = Math.min(minD, haversineKm(tLat, tLng, inc.lat, inc.lng))
      }
      if (minD > bestMin) {
        bestMin = minD
        sign = s
      }
    }
  }

  return [{
    lat: lat + perp.lat * 0.00095 * sign,
    lng: lng + perp.lng * 0.00095 * sign,
  }]
}

/** Closest point on route to an incident (for on-route hazard markers). */
export function closestPointOnRoute(routeCoords, lat, lng) {
  let best = null
  let bestD = Infinity
  for (let i = 0; i < routeCoords.length - 1; i += 2) {
    const [lng, cLat] = routeCoords[i]
    const d = haversineKm(cLat, lng, lat, lng)
    if (d < bestD) {
      bestD = d
      best = { lat: cLat, lng, distanceKm: d }
    }
  }
  return best
}

/** Sample warning pin positions along an unsafe route (for map markers). */
export function sampleUnsafeRouteWarnings(routeCoords, incidents = [], maxPins = 8) {
  if (!routeCoords?.length) return []

  const pins = []
  const used = new Set()

  for (const inc of incidents) {
    if (pins.length >= maxPins) break
    const d = minDistToRouteKm(routeCoords, inc.lat, inc.lng)
    if (d >= 0.32) continue
    const pt = closestPointOnRoute(routeCoords, inc.lat, inc.lng)
    if (!pt) continue
    const key = `${pt.lat.toFixed(4)}-${pt.lng.toFixed(4)}`
    if (used.has(key)) continue
    used.add(key)
    pins.push({
      lat: pt.lat,
      lng: pt.lng,
      icon: inc.severity === 'high' ? '🚨' : '⚠️',
      title: inc.type,
      detail: inc.description,
    })
  }

  const segStep = Math.max(3, Math.floor(routeCoords.length / 5))
  for (let i = segStep; i < routeCoords.length - segStep && pins.length < maxPins; i += segStep) {
    const [lng, lat] = routeCoords[i]
    const key = `${lat.toFixed(4)}-${lng.toFixed(4)}`
    if (used.has(key)) continue
    used.add(key)
    pins.push({
      lat,
      lng,
      icon: '⚠️',
      title: 'High-risk segment',
      detail: 'Poor lighting and low foot traffic reported here',
    })
  }

  return pins.slice(0, maxPins)
}
