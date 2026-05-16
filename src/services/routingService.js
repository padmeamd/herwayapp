// Free, zero-key routing and geocoding — Oxford, UK edition
//   Geocoding: Nominatim (OpenStreetMap) — https://nominatim.org/
//   Routing:   OSRM public foot endpoint  — https://routing.openstreetmap.de/

import {
  computeSafetyWaypoints,
  computeFallbackDetourWaypoint,
  incidentRiskScore,
  routesAreSimilar,
} from './routeGeometry'

const OSRM_BASE     = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

// ── Oxford geographic constants ────────────────────────────────────────────

export const OXFORD_CENTER = { lat: 51.7520, lng: -1.2577 }

// Nominatim viewbox format: west,north,east,south (minLng,maxLat,maxLng,minLat)
const OXFORD_VIEWBOX = '-1.55,51.90,-1.05,51.60'

const MAX_KM_FROM_OXFORD = 25
const MAX_ROUTE_KM       = 15
const MAX_SAFE_DETOUR_RATIO = 1.32

const GEO_KEYWORDS = ['oxford', 'uk', 'england', 'united kingdom', 'britain', 'oxfordshire']

// ── Haversine distance (km) ───────────────────────────────────────────────

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R    = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lng2 - lng1) * (Math.PI / 180)
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function augmentQuery(query) {
  const lower = query.toLowerCase().trim()
  if (GEO_KEYWORDS.some(kw => lower.includes(kw))) return query.trim()
  return `${query.trim()}, Oxford, UK`
}

function normalizeRouteCoords(osrmRoute, origin, destination) {
  const raw = osrmRoute?.geometry?.coordinates ?? []
  if (raw.length < 2) {
    return [[origin.lng, origin.lat], [destination.lng, destination.lat]]
  }
  return [
    [origin.lng, origin.lat],
    ...raw.slice(1, -1),
    [destination.lng, destination.lat],
  ]
}

async function fetchFootRoutes(points, { alternatives = false } = {}) {
  const coordStr = points.map(p => `${p.lng},${p.lat}`).join(';')
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    steps: 'true',
  })
  if (alternatives && points.length === 2) params.set('alternatives', 'true')

  const url = `${OSRM_BASE}/${coordStr}?${params}`
  const res = await fetch(url)
  const data = await res.json()
  return data.routes ?? []
}

function rankRouteCandidate(route, coords, primaryDistance, incidents) {
  const risk = incidentRiskScore(coords, incidents)
  const ratio = primaryDistance > 0 ? route.distance / primaryDistance : 1
  const detourPenalty = ratio > 1 ? (ratio - 1) * 42 : 0
  const lengthPenalty = ratio > MAX_SAFE_DETOUR_RATIO ? 120 : 0
  return risk + detourPenalty + lengthPenalty
}

/**
 * Choose a safe path: prefer real OSRM alternatives, then a single via-waypoint
 * detour on actual streets — never artificial coordinate bending.
 */
async function resolveSafeRoute(primaryRoute, directCoords, origin, destination, incidents, safeSpaces, allAlternatives) {
  const primaryDist = primaryRoute.distance

  let best = null
  let bestRank = Infinity

  for (const route of allAlternatives) {
    const coords = normalizeRouteCoords(route, origin, destination)
    const rank = rankRouteCandidate(route, coords, primaryDist, incidents)
    if (rank < bestRank) {
      bestRank = rank
      best = { route, coords, rank }
    }
  }

  const waypoints = computeSafetyWaypoints(directCoords, incidents, safeSpaces)
  if (waypoints.length) {
    const viaPoints = [origin, ...waypoints, destination]
    const viaRoutes = await fetchFootRoutes(viaPoints, { alternatives: false })
    if (viaRoutes[0]) {
      const viaCoords = normalizeRouteCoords(viaRoutes[0], origin, destination)
      const rank = rankRouteCandidate(viaRoutes[0], viaCoords, primaryDist, incidents)
      if (rank < bestRank - 2 || !best || routesAreSimilar(best.coords, directCoords)) {
        best = { route: viaRoutes[0], coords: viaCoords, rank }
        bestRank = rank
      }
    }
  }

  if (!best || routesAreSimilar(best.coords, directCoords)) {
    for (const route of allAlternatives.slice(1)) {
      const coords = normalizeRouteCoords(route, origin, destination)
      if (!routesAreSimilar(coords, directCoords)) {
        const rank = rankRouteCandidate(route, coords, primaryDist, incidents)
        if (rank <= bestRank + 15) {
          best = { route, coords, rank }
          bestRank = rank
          break
        }
      }
    }
  }

  if (!best || routesAreSimilar(best.coords, directCoords)) {
    const fallback = computeFallbackDetourWaypoint(directCoords, incidents)
    if (fallback.length) {
      const viaRoutes = await fetchFootRoutes([origin, ...fallback, destination])
      if (viaRoutes[0]) {
        const coords = normalizeRouteCoords(viaRoutes[0], origin, destination)
        if (!routesAreSimilar(coords, directCoords)) {
          best = {
            route: viaRoutes[0],
            coords,
            rank: rankRouteCandidate(viaRoutes[0], coords, primaryDist, incidents),
          }
        }
      }
    }
  }

  if (!best) {
    return { route: primaryRoute, coords: directCoords }
  }

  return best
}

// ── Geocoding ─────────────────────────────────────────────────────────────

export const geocodeSearch = async (query, proximity = null) => {
  if (!query || query.length < 2) return []
  try {
    const augmented = augmentQuery(query)

    const params = new URLSearchParams({
      q:            augmented,
      format:       'json',
      limit:        8,
      addressdetails: 1,
      countrycodes: 'gb',
      viewbox:      OXFORD_VIEWBOX,
      bounded:      1,
    })

    const res  = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'HerWayOxford/1.0' },
    })
    const data = await res.json()

    return data
      .map(f => ({
        id:       `${f.osm_type}${f.osm_id}`,
        name:     f.name || f.display_name.split(',')[0].trim(),
        fullName: f.display_name,
        lat:      parseFloat(f.lat),
        lng:      parseFloat(f.lon),
        type:     f.type ?? 'place',
      }))
      .filter(r => haversineKm(r.lat, r.lng, OXFORD_CENTER.lat, OXFORD_CENTER.lng) <= MAX_KM_FROM_OXFORD)
  } catch (e) {
    console.error('Geocoding error:', e)
    return []
  }
}

export function validateLocations(origin, destination) {
  const dOrigin = haversineKm(origin.lat, origin.lng, OXFORD_CENTER.lat, OXFORD_CENTER.lng)
  const dDest   = haversineKm(destination.lat, destination.lng, OXFORD_CENTER.lat, OXFORD_CENTER.lng)
  const dRoute  = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng)

  if (dOrigin > MAX_KM_FROM_OXFORD) {
    return {
      valid: false,
      error: `Starting point is ${Math.round(dOrigin)} km from Oxford — please search for a location in or around Oxford.`,
    }
  }
  if (dDest > MAX_KM_FROM_OXFORD) {
    return {
      valid: false,
      error: `Destination is ${Math.round(dDest)} km from Oxford — please search for a location in or around Oxford.`,
    }
  }
  if (dRoute < 0.02) {
    return {
      valid: false,
      error: 'Start and destination appear to be the same location. Please choose two different points.',
    }
  }
  if (dRoute > MAX_ROUTE_KM) {
    return {
      valid: false,
      error: `These locations are ${Math.round(dRoute)} km apart — too far for a walking route. Try locations closer together within Oxford.`,
    }
  }
  return { valid: true, error: null }
}

// ── Routing ───────────────────────────────────────────────────────────────

export const calculateRoutes = async (origin, destination, { incidents = [], safeSpaces = [] } = {}) => {
  try {
    const osrmRoutes = await fetchFootRoutes([origin, destination], { alternatives: true })
    if (!osrmRoutes.length) return []

    const primary = osrmRoutes[0]
    const directCoords = normalizeRouteCoords(primary, origin, destination)

    const safePick = await resolveSafeRoute(
      primary,
      directCoords,
      origin,
      destination,
      incidents,
      safeSpaces,
      osrmRoutes,
    )

    const safeCoords = safePick.coords ?? directCoords
    const safeOsrm = safePick.route ?? primary

    const safeRoute = {
      index:    0,
      role:     'safe',
      geometry: { type: 'LineString', coordinates: safeCoords },
      distance: Math.round(safeOsrm.distance ?? primary.distance),
      duration: Math.round(safeOsrm.duration ?? primary.duration),
      steps:    safeOsrm.legs?.flatMap(l => l.steps ?? []) ?? primary.legs?.[0]?.steps ?? [],
    }

    const unsafeRoute = {
      index:    1,
      role:     'unsafe',
      geometry: { type: 'LineString', coordinates: directCoords },
      distance: Math.round(primary.distance),
      duration: Math.round(primary.duration),
      steps:    primary.legs?.[0]?.steps ?? [],
    }

    return [safeRoute, unsafeRoute]
  } catch (e) {
    console.error('Routing error:', e)
    return []
  }
}

// ── Formatters ────────────────────────────────────────────────────────────

export const formatDuration = (seconds) => {
  if (!seconds) return '--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

export const formatDistance = (metres) => {
  if (!metres) return '--'
  return metres >= 1000
    ? `${(metres / 1000).toFixed(1)} km`
    : `${Math.round(metres)} m`
}

export const estimatedArrival = (durationSeconds) => {
  const arrival = new Date(Date.now() + durationSeconds * 1000)
  return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
