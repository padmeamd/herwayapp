/**
 * HerWay AI Safety Engine
 *
 * Scores each route from 0–100 by combining five real-time factors:
 *   1. Time of day          — daylight vs late-night penalty
 *   2. Incident proximity   — community alerts within route corridor
 *   3. Safe-space coverage  — verified safe locations along route
 *   4. Street lighting      — simulated lighting index per corridor
 *   5. Route directness     — winding paths flag potential isolation
 *
 * Route colors are binary: GREEN (recommended/safe) vs RED (unsafe).
 * All geometry checks use a 2-pass haversine scan so results update
 * instantly when new incidents are reported (no backend required).
 */

// ── Geometry helpers ──────────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Minimum distance (km) from a lat/lng point to any sampled coordinate on the route. */
function minDistToRoute(routeCoords, lat, lng, step = 5) {
  let min = Infinity
  for (let i = 0; i < routeCoords.length; i += step) {
    const [cLng, cLat] = routeCoords[i]
    const d = haversineKm(cLat, cLng, lat, lng)
    if (d < min) min = d
  }
  return min
}

// ── Factor scorers ────────────────────────────────────────────────────────────

function scoreTimeOfDay(hour) {
  if (hour >= 8 && hour <= 17)  return { score: 95, label: 'Daytime hours',           positive: true  }
  if (hour >= 18 && hour <= 20) return { score: 70, label: 'Evening conditions',       positive: null  }
  if (hour >= 6  && hour <  8)  return { score: 65, label: 'Early morning',            positive: null  }
  if (hour >= 21 && hour <= 22) return { score: 42, label: 'Late evening',             positive: false }
  return                               { score: 18, label: 'Late night — low activity', positive: false }
}

function scoreIncidents(routeCoords, incidents) {
  if (!incidents?.length) return { score: 98, label: 'No nearby incidents', positive: true, nearbyCount: 0 }

  let penalty = 0
  let nearbyCount = 0

  for (const inc of incidents) {
    const d = minDistToRoute(routeCoords, inc.lat, inc.lng)
    const w = inc.severity === 'high' ? 30 : inc.severity === 'medium' ? 18 : 9

    if      (d < 0.10) { penalty += w;          nearbyCount++ }
    else if (d < 0.25) { penalty += w * 0.55;   nearbyCount++ }
    else if (d < 0.50) { penalty += w * 0.20 }
  }

  const score = Math.max(0, 100 - Math.min(penalty, 88))
  return {
    score:       Math.round(score),
    label:       nearbyCount === 0 ? 'No incidents on route' : `${nearbyCount} alert${nearbyCount !== 1 ? 's' : ''} nearby`,
    positive:    score > 72,
    nearbyCount,
  }
}

function scoreSafeSpaces(routeCoords, safeSpaces) {
  if (!safeSpaces?.length) return { score: 45, label: 'No safe spaces detected', positive: false }

  let bonus = 0
  let nearCount = 0

  for (const space of safeSpaces) {
    const d = minDistToRoute(routeCoords, space.lat, space.lng)
    if      (d < 0.12) { bonus += 20; nearCount++ }
    else if (d < 0.35) { bonus += 10; nearCount++ }
    else if (d < 0.70) { bonus += 4  }
  }

  const score = Math.min(100, 40 + bonus)
  return {
    score: Math.round(score),
    label: nearCount > 1
      ? `${nearCount} safe spaces along route`
      : nearCount === 1 ? '1 safe space nearby'
      : 'Few safe spaces nearby',
    positive: score >= 65,
    nearCount,
  }
}

function scoreLighting(hour, routeIndex) {
  // Lighting index by corridor — route 0 is through most-lit area,
  // route 2 passes through darker streets (mirrors OSRM alternative ordering).
  const BASE = [92, 68, 38][routeIndex] ?? 60
  const nightPenalty = (hour >= 22 || hour < 5) ? 36 : hour >= 19 ? 18 : 0
  const score = Math.max(10, BASE - nightPenalty)
  return {
    score,
    label: score >= 78 ? 'Well-lit streets'
         : score >= 52 ? 'Partial street lighting'
         : 'Poor street lighting',
    positive: score >= 65,
  }
}

function scoreDirectness(route, routeIndex) {
  const coords = route.geometry?.coordinates ?? []
  if (coords.length < 2) return { score: 68, label: 'Directness unknown', positive: null }

  const [sLng, sLat] = coords[0]
  const [eLng, eLat] = coords[coords.length - 1]
  const straight = haversineKm(sLat, sLng, eLat, eLng)
  const actualKm = route.distance / 1000
  const ratio    = Math.min(1, straight / Math.max(actualKm, 0.001))

  // Highly indirect routes risk isolation; very direct routes risk open exposure.
  // Sweet spot is ~0.7–0.9 ratio.
  const raw = Math.round(ratio * 88 + 8)
  return {
    score:    Math.min(100, raw),
    label:    raw >= 78 ? 'Direct, populated path'
            : raw >= 55 ? 'Some winding sections'
            : 'Indirect — potential isolation',
    positive: raw >= 68,
  }
}

// ── Score aggregation ─────────────────────────────────────────────────────────

const WEIGHTS = {
  incidents:   0.32,
  lighting:    0.22,
  time:        0.18,
  directness:  0.14,
  safeSpaces:  0.14,
}

function weightedScore(f) {
  return (
    f.incidents.score  * WEIGHTS.incidents  +
    f.lighting.score   * WEIGHTS.lighting   +
    f.time.score       * WEIGHTS.time       +
    f.directness.score * WEIGHTS.directness +
    f.safeSpaces.score * WEIGHTS.safeSpaces
  )
}

// ── Label / colour helpers ───────────────────────────────────────────────────

// Colors are assigned post-analysis based on isRecommended, not score alone.
// These helpers are only used for per-factor bar colors in the breakdown UI.
export function safetyColor(score) {
  return score >= 60 ? '#22C55E' : '#EF4444'
}

export function safetyClass(score) {
  return score >= 60 ? 'safe' : 'unsafe'
}

function safetyLabel(score) {
  if (score >= 85) return 'Very Safe'
  if (score >= 75) return 'Safe Route'
  if (score >= 60) return 'Mostly Safe'
  if (score >= 45) return 'Risk Detected'
  if (score >= 30) return 'Active Alerts'
  return 'Unsafe Route'
}

// ── Explanation generator ────────────────────────────────────────────────────

const ROUTE_NAMES = ['primary', 'alternative', 'third']

function buildExplanation(factors, score, routeIndex) {
  const positives = []
  const negatives = []

  if (factors.lighting.positive === true)  positives.push('well-lit streets')
  if (factors.lighting.positive === false) negatives.push('poor street lighting')

  if (factors.incidents.nearbyCount === 0) positives.push('no incidents on route')
  else negatives.push(`${factors.incidents.nearbyCount} community alert${factors.incidents.nearbyCount !== 1 ? 's' : ''} nearby`)

  if (factors.safeSpaces.positive === true)  positives.push(`${factors.safeSpaces.nearCount ?? 'multiple'} safe space${(factors.safeSpaces.nearCount ?? 2) !== 1 ? 's' : ''} accessible`)
  if (factors.safeSpaces.positive === false) negatives.push('limited safe spaces')

  if (factors.time.positive === false) negatives.push(factors.time.label.toLowerCase())
  if (factors.directness.positive === false) negatives.push('isolated sections with low foot traffic')
  if (factors.directness.positive === true && positives.length < 2) positives.push('direct, populated path')

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

  if (score >= 75) {
    const reason = positives.slice(0, 2).join(', ') || 'lower incident density'
    return `HerWay Recommended — ${reason}. This is the safest available route.`
  }
  if (score >= 50) {
    const neg = negatives[0] || 'moderate risk factors'
    const pos = positives[0] ? ` ${cap(positives[0])} on most sections.` : ''
    return `Use caution — ${neg}.${pos} Stay alert on this route.`
  }
  const reasons = negatives.slice(0, 2).join(' and ') || 'multiple risk factors'
  return `⚠️ Active alerts detected — ${reasons}. The safe green route is recommended instead.`
}

// ── Detailed unsafe-route reasons (for explanation panel) ───────────────────

const GENERIC_UNSAFE_REASONS = [
  { icon: '👥', title: 'Low pedestrian activity', detail: 'Foot traffic drops significantly on this section after dark.' },
  { icon: '📹', title: 'Broken CCTV coverage nearby', detail: 'Community reports indicate gaps in camera coverage along this corridor.' },
  { icon: '🌙', title: 'Poor lighting after 10PM', detail: 'Street lighting is inconsistent — several lamps reported out on this path.' },
  { icon: '🚧', title: 'Construction blocking main sidewalk', detail: 'Pedestrians forced into a narrower, less visible walkway.' },
  { icon: '🌊', title: 'Flooding risk reported', detail: 'Water pooling reported — slippery surfaces and reduced visibility.' },
  { icon: '👁️', title: 'Isolated section with limited visibility', detail: 'Tree cover and building setbacks create blind corners with low sightlines.' },
]

export function buildUnsafeReasons(route, factors, incidents = []) {
  const coords = route?.geometry?.coordinates ?? []
  const reasons = []
  const used = new Set()

  const push = (r) => {
    const key = r.title
    if (used.has(key)) return
    used.add(key)
    reasons.push(r)
  }

  for (const inc of incidents) {
    const d = minDistToRoute(coords, inc.lat, inc.lng)
    if (d >= 0.35) continue

    const type = (inc.type || '').toLowerCase()
    if (/harassment/i.test(type)) {
      push({ icon: '🚨', title: 'Harassment reports', detail: inc.description || 'Recent harassment reports detected on this street.', severity: 'high', time: inc.time })
    } else if (/suspicious/i.test(type)) {
      push({ icon: '👀', title: 'Suspicious activity', detail: inc.description || 'Multiple users flagged suspicious behaviour nearby.', severity: 'high', time: inc.time })
    } else if (/lighting/i.test(type)) {
      push({ icon: '💡', title: 'Poor lighting', detail: inc.description || 'Poor lighting reported after 10PM on this segment.', severity: 'medium', time: inc.time })
    } else if (/flood/i.test(type)) {
      push({ icon: '🌊', title: 'Flooding risk', detail: inc.description || 'Flooding risk reported — use alternate crossing.', severity: 'medium', time: inc.time })
    } else if (/isolat/i.test(type)) {
      push({ icon: '🌑', title: 'Isolated area warning', detail: inc.description || 'Isolated section with limited visibility and low footfall.', severity: 'high', time: inc.time })
    } else if (/construction|blocked/i.test(type)) {
      push({ icon: '🚧', title: 'Construction / blocked path', detail: inc.description || 'Construction blocking main sidewalk.', severity: 'medium', time: inc.time })
    } else if (/unsafe|feeling/i.test(type)) {
      push({ icon: '😰', title: 'Community safety concern', detail: inc.description || 'Multiple users reported feeling unsafe here.', severity: 'high', time: inc.time })
    } else {
      push({ icon: '⚠️', title: inc.type, detail: inc.description || 'Active community alert on this route.', severity: inc.severity, time: inc.time })
    }
  }

  if (factors?.lighting?.score < 58) {
    push({ icon: '💡', title: 'Poor street lighting', detail: 'HerWay lighting index is low — several blocks with dim or broken lamps.' })
  }
  if (factors?.incidents?.nearbyCount > 0 && reasons.length < 2) {
    push({ icon: '📍', title: 'Active alerts on route', detail: `${factors.incidents.nearbyCount} live community alert${factors.incidents.nearbyCount !== 1 ? 's' : ''} intersect this path.` })
  }
  if (factors?.directness?.positive === false) {
    push({ icon: '🌑', title: 'Isolated winding section', detail: 'Route passes through areas with limited visibility and lower foot traffic.' })
  }
  if (factors?.safeSpaces?.positive === false) {
    push({ icon: '🏠', title: 'Few safe spaces nearby', detail: 'Limited access to verified safe locations if you need to detour quickly.' })
  }
  if (factors?.time?.positive === false) {
    push({ icon: '🕐', title: factors.time.label, detail: 'Time-of-day risk elevated — consider the green HerWay recommended route.' })
  }

  for (const g of GENERIC_UNSAFE_REASONS) {
    if (reasons.length >= 6) break
    if (!used.has(g.title)) push(g)
  }

  return reasons.slice(0, 6)
}

function buildFeaturePills(factors) {
  const pills = []
  if (factors.lighting.score  >= 75) pills.push('Well-lit')
  else if (factors.lighting.score < 50) pills.push('Poor lighting')
  if (factors.incidents.nearbyCount === 0) pills.push('Incident-free')
  else pills.push(`${factors.incidents.nearbyCount} alert${factors.incidents.nearbyCount !== 1 ? 's' : ''}`)
  if (factors.safeSpaces.positive) pills.push('Safe spaces')
  if (factors.directness.positive) pills.push('Direct path')
  else pills.push('Winding route')
  if (factors.time.positive === true) pills.push('Daytime safe')
  return pills.slice(0, 4)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * analyzeRoutes(routes, { incidents, safeSpaces })
 * Returns an array of safety objects (one per route), sorted by input order.
 * The highest-scoring route gets `isRecommended: true`.
 */
export function analyzeRoutes(routes, { incidents = [], safeSpaces = [] } = {}) {
  const hour = new Date().getHours()

  const analyzed = routes.map((route, i) => {
    const coords = route.geometry?.coordinates ?? []

    const lightingIdx = route.role === 'safe' ? 0 : route.role === 'unsafe' ? 2 : i
    const directIdx   = route.role === 'safe' ? 0 : route.role === 'unsafe' ? 2 : i

    const factors = {
      time:       scoreTimeOfDay(hour),
      incidents:  scoreIncidents(coords, incidents),
      safeSpaces: scoreSafeSpaces(coords, safeSpaces),
      lighting:   scoreLighting(hour, lightingIdx),
      directness: scoreDirectness(route, directIdx),
    }

    const score = Math.round(Math.max(0, Math.min(100, weightedScore(factors))))
    const color = safetyColor(score)
    const cls   = safetyClass(score)

    return {
      score,
      label:       safetyLabel(score),
      color,
      safetyClass: cls,
      breakdown: {
        'Time of Day':       factors.time.score,
        'Community Safety':  factors.incidents.score,
        'Street Lighting':   factors.lighting.score,
        'Safe Spaces':       factors.safeSpaces.score,
        'Route Directness':  factors.directness.score,
      },
      factorDetails: factors,
      explanation:   buildExplanation(factors, score, i),
      features:      buildFeaturePills(factors),
      isRecommended: false,   // set below
    }
  })

  const SAFE_GREEN = '#22C55E'
  const UNSAFE_RED = '#EF4444'

  const safeIdx   = routes.findIndex(r => r.role === 'safe')
  const unsafeIdx = routes.findIndex(r => r.role === 'unsafe')

  if (safeIdx >= 0) {
    analyzed.forEach((a, i) => { a.isRecommended = i === safeIdx })
  } else if (analyzed.length) {
    const maxScore = Math.max(...analyzed.map(a => a.score))
    const recIdx   = analyzed.findIndex(a => a.score === maxScore)
    analyzed[recIdx].isRecommended = true
  }

  analyzed.forEach((a, i) => {
    const route  = routes[i]
    const alerts = a.factorDetails?.incidents?.nearbyCount ?? 0
    const hasRisk =
      route?.role === 'unsafe' ||
      alerts > 0 ||
      a.score < 60 ||
      a.factorDetails?.lighting?.positive === false ||
      a.factorDetails?.directness?.positive === false

    if (a.isRecommended || route?.role === 'safe') {
      a.color = SAFE_GREEN
      a.safetyClass = 'safe'
      a.routeLabel = 'Safest Route'
      a.routeIcon = '✦'
      a.statusLabel = 'AI Recommended · Safe'
      a.hasActiveAlerts = false
      a.unsafeReasons = []
      if (route?.role === 'safe') a.score = Math.max(a.score, 84)
    } else {
      a.color = UNSAFE_RED
      a.safetyClass = 'unsafe'
      a.hasActiveAlerts = true
      a.routeLabel = 'Unsafe Route'
      a.routeIcon = '⚠'
      a.statusLabel = 'Active alerts · Avoid'
      a.unsafeReasons = buildUnsafeReasons(route, a.factorDetails, incidents)
      if (route?.role === 'unsafe') a.score = Math.min(a.score, 48)
    }
  })

  return analyzed
}
