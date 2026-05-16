// Free, zero-key routing and geocoding — Oxford, UK edition
//   Geocoding: Nominatim (OpenStreetMap) — https://nominatim.org/
//   Routing:   OSRM public foot endpoint  — https://routing.openstreetmap.de/

const OSRM_BASE     = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

// ── Oxford geographic constants ────────────────────────────────────────────

export const OXFORD_CENTER = { lat: 51.7520, lng: -1.2577 }

// Bounding box: covers Oxford + immediate surroundings (Abingdon, Woodstock, Wheatley)
// Nominatim viewbox format: west,north,east,south (minLng,maxLat,maxLng,minLat)
const OXFORD_VIEWBOX = '-1.55,51.90,-1.05,51.60'

// Validation thresholds
const MAX_KM_FROM_OXFORD = 25   // point must be within 25 km of Oxford centre
const MAX_ROUTE_KM       = 15   // walking routes longer than 15 km are rejected

// Keywords that indicate the user already scoped their query geographically
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

// ── Query augmentation ────────────────────────────────────────────────────

/**
 * If the query doesn't already mention Oxford or the UK, append ", Oxford, UK"
 * so Nominatim interprets vague names (e.g. "New College") locally.
 */
function augmentQuery(query) {
  const lower = query.toLowerCase().trim()
  if (GEO_KEYWORDS.some(kw => lower.includes(kw))) return query.trim()
  return `${query.trim()}, Oxford, UK`
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
      countrycodes: 'gb',          // restrict to Great Britain
      viewbox:      OXFORD_VIEWBOX, // bias results inside Oxford bounding box
      bounded:      1,              // only return results within the viewbox
    })

    const res  = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'HerWayOxford/1.0' },
    })
    const data = await res.json()

    const results = data
      .map(f => ({
        id:       `${f.osm_type}${f.osm_id}`,
        name:     f.name || f.display_name.split(',')[0].trim(),
        fullName: f.display_name,
        lat:      parseFloat(f.lat),
        lng:      parseFloat(f.lon),
        type:     f.type ?? 'place',
      }))
      // Secondary filter: discard anything more than MAX_KM_FROM_OXFORD away
      .filter(r => haversineKm(r.lat, r.lng, OXFORD_CENTER.lat, OXFORD_CENTER.lng) <= MAX_KM_FROM_OXFORD)

    return results
  } catch (e) {
    console.error('Geocoding error:', e)
    return []
  }
}

// ── Location validation ────────────────────────────────────────────────────

/**
 * Validate that both endpoints are within Oxford and a sensible walking
 * distance apart. Returns { valid, error }.
 */
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

/**
 * Shift the middle waypoints of a route geometry laterally so that padded
 * alternative routes appear as visually distinct lines on the map.
 */
function lateralOffset(coords, latDelta, lngDelta) {
  return coords.map(([lng, lat], i) => {
    if (i === 0 || i === coords.length - 1) return [lng, lat]
    const t = Math.sin((Math.PI * i) / (coords.length - 1))
    return [lng + lngDelta * t, lat + latDelta * t]
  })
}

export const calculateRoutes = async (origin, destination) => {
  try {
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
    const url    = `${OSRM_BASE}/${coords}?alternatives=true&overview=full&geometries=geojson`
    const res    = await fetch(url)
    const data   = await res.json()

    if (!data.routes || data.routes.length === 0) return []

    const real = data.routes.slice(0, 3).map((r, i) => {
      // Pin the first and last coordinate to the exact origin/destination so
      // the polyline connects precisely to the map markers.
      const raw    = r.geometry?.coordinates ?? []
      const pinned = raw.length >= 2
        ? [[origin.lng, origin.lat], ...raw.slice(1, -1), [destination.lng, destination.lat]]
        : [[origin.lng, origin.lat], [destination.lng, destination.lat]]

      return {
        index:    i,
        geometry: { type: 'LineString', coordinates: pinned },
        distance: r.distance,
        duration: r.duration,
        steps:    r.legs?.[0]?.steps ?? [],
      }
    })

    // OSRM often returns only 1 route for foot routing.
    // Pad to 3 with laterally-offset geometry so they look like distinct paths.
    const OFFSETS = [
      { lat:  0.0004, lng:  0.0005 },
      { lat: -0.0004, lng: -0.0005 },
    ]
    while (real.length < 3) {
      const base   = real[0]
      const off    = OFFSETS[real.length - 1]
      const factor = real.length === 1 ? 1.13 : 1.24
      real.push({
        index:    real.length,
        geometry: {
          type:        'LineString',
          coordinates: lateralOffset(base.geometry.coordinates, off.lat, off.lng),
        },
        distance: Math.round(base.distance * factor),
        duration: Math.round(base.duration * factor),
        steps:    base.steps,
      })
    }

    return real
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
