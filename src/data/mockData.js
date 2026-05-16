// Default map center: Oxford, United Kingdom
export const DEFAULT_CENTER = { lat: 51.7520, lng: -1.2577 }
export const DEFAULT_ZOOM = 15

// ── HerWay route colors (binary: safe green vs unsafe red only) ─────────────
export const ROUTE_SAFE_COLOR   = '#22C55E'
export const ROUTE_UNSAFE_COLOR = '#EF4444'

export const ROUTE_CONFIG = [
  { label: 'Safest Route',   icon: '✦', color: ROUTE_SAFE_COLOR,   lineColor: ROUTE_SAFE_COLOR   },
  { label: 'Alert Route',    icon: '⚠', color: ROUTE_UNSAFE_COLOR, lineColor: ROUTE_UNSAFE_COLOR },
  { label: 'Higher Risk',    icon: '⚠', color: ROUTE_UNSAFE_COLOR, lineColor: ROUTE_UNSAFE_COLOR },
]

// ── Safety scoring profiles per route ─────────────────────────────────────
export const SAFETY_PROFILES = [
  {
    score: 92,
    label: 'Very Safe',
    color: '#34D399',
    breakdown: { lighting: 95, footfall: 90, cctv: 88, incidents: 96 },
    features: ['Well-lit path', 'High footfall', 'CCTV covered', 'No recent incidents'],
    tip: 'Passes through well-lit, populated streets with CCTV coverage.',
  },
  {
    score: 74,
    label: 'Mostly Safe',
    color: '#FBBF24',
    breakdown: { lighting: 85, footfall: 68, cctv: 72, incidents: 78 },
    features: ['Good lighting', 'Moderate footfall', 'Partial CCTV'],
    tip: 'One short isolated stretch. Otherwise well-lit.',
  },
  {
    score: 41,
    label: 'Use Caution',
    color: '#F87171',
    breakdown: { lighting: 38, footfall: 50, cctv: 30, incidents: 52 },
    features: ['Poor lighting', 'Isolated sections', 'Limited CCTV'],
    tip: 'Faster but passes through isolated areas with poor lighting at night.',
  },
]

// ── Mock incidents around Oxford city centre ───────────────────────────────
export const MOCK_INCIDENTS = [
  {
    id: 'inc-1',
    type: 'Poor Lighting',
    description: 'Street lamps out along Botley Road underpass',
    lat: 51.7510,
    lng: -1.2830,
    severity: 'medium',
    time: '12 min ago',
    reportCount: 3,
  },
  {
    id: 'inc-2',
    type: 'Suspicious Activity',
    description: 'Group loitering near Magdalen Bridge car park',
    lat: 51.7512,
    lng: -1.2421,
    severity: 'high',
    time: '28 min ago',
    reportCount: 7,
  },
  {
    id: 'inc-3',
    type: 'Feeling Unsafe',
    description: 'Felt followed near Cowley Road at night',
    lat: 51.7491,
    lng: -1.2264,
    severity: 'high',
    time: '45 min ago',
    reportCount: 2,
  },
  {
    id: 'inc-4',
    type: 'Construction',
    description: 'Construction blocking pavement on Park End Street',
    lat: 51.7528,
    lng: -1.2715,
    severity: 'medium',
    time: '2 hrs ago',
    reportCount: 5,
  },
  {
    id: 'inc-6',
    type: 'Flooding',
    description: 'Flooded underpass near Oxford Rail Station — use alternate crossing',
    lat: 51.7530,
    lng: -1.2690,
    severity: 'medium',
    time: '18 min ago',
    reportCount: 6,
  },
  {
    id: 'inc-7',
    type: 'Isolated Area',
    description: 'Low foot traffic reported on canal path after dark',
    lat: 51.7485,
    lng: -1.2480,
    severity: 'high',
    time: '1 hr ago',
    reportCount: 3,
  },
  {
    id: 'inc-5',
    type: 'Harassment',
    description: 'Verbal harassment reported near Westgate car park entrance',
    lat: 51.7496,
    lng: -1.2651,
    severity: 'high',
    time: '3 hrs ago',
    reportCount: 4,
  },
]

// ── Mock safe spaces around Oxford city centre ─────────────────────────────
export const MOCK_SAFE_SPACES = [
  {
    id: 'ss-1',
    name: 'Bodleian Library',
    type: 'Library',
    icon: '📚',
    lat: 51.7540,
    lng: -1.2544,
    open: true,
    openUntil: '22:00',
    lightingScore: 97,
    verified: true,
    womenVerified: true,
    distance: '220 m',
    features: ['24/7 Security', 'CCTV', 'Busy at all hours'],
    description: 'World-famous library with security staff and excellent CCTV coverage.',
  },
  {
    id: 'ss-2',
    name: 'Oxford Covered Market',
    type: 'Café',
    icon: '☕',
    lat: 51.7524,
    lng: -1.2593,
    open: true,
    openUntil: '17:30',
    lightingScore: 90,
    verified: true,
    womenVerified: true,
    distance: '180 m',
    features: ['Staffed stalls', 'CCTV', 'Central location'],
    description: 'Historic indoor market. Busy, well-lit, and centrally located.',
  },
  {
    id: 'ss-3',
    name: 'Westgate Shopping Centre',
    type: 'University',
    icon: '🏛️',
    lat: 51.7500,
    lng: -1.2636,
    open: true,
    openUntil: '21:00',
    lightingScore: 96,
    verified: true,
    womenVerified: true,
    distance: '380 m',
    features: ['Security guards', 'CCTV', 'Late opening'],
    description: 'Modern shopping centre with 24-hour security patrols and comprehensive CCTV.',
  },
  {
    id: 'ss-4',
    name: 'Ashmolean Museum',
    type: 'Safe Lodge',
    icon: '🏛️',
    lat: 51.7547,
    lng: -1.2602,
    open: true,
    openUntil: '20:00',
    lightingScore: 95,
    verified: true,
    womenVerified: true,
    distance: '310 m',
    features: ['Security staff', 'Well-lit entrance', 'Staffed reception'],
    description: "University museum with security staff and a well-lit, public-facing entrance.",
  },
  {
    id: 'ss-5',
    name: 'Oxford Rail Station',
    type: 'Transit',
    icon: '🚉',
    lat: 51.7534,
    lng: -1.2706,
    open: true,
    openUntil: '23:30',
    lightingScore: 93,
    verified: true,
    womenVerified: false,
    distance: '750 m',
    features: ['Staff on duty', 'CCTV', 'Bright platform'],
    description: 'Staffed station with British Transport Police presence and full CCTV.',
  },
  {
    id: 'ss-6',
    name: 'John Radcliffe Hospital',
    type: 'Hospital',
    icon: '🏥',
    lat: 51.7641,
    lng: -1.2228,
    open: true,
    openUntil: '24:00',
    lightingScore: 99,
    verified: true,
    womenVerified: false,
    distance: '1.4 km',
    features: ['24/7 A&E', 'Security', 'CCTV'],
    description: '24-hour A&E with hospital security at all entrances.',
  },
]

// ── Incident report types ─────────────────────────────────────────────────
export const INCIDENT_TYPES = [
  { id: 'unsafe',        label: 'Feeling Unsafe',      icon: '😰', severity: 'medium' },
  { id: 'harassment',    label: 'Harassment',           icon: '😠', severity: 'high'   },
  { id: 'suspicious',    label: 'Suspicious Activity',  icon: '👀', severity: 'high'   },
  { id: 'lighting',      label: 'Poor Lighting',        icon: '💡', severity: 'medium' },
  { id: 'blocked',       label: 'Blocked Path',         icon: '🚧', severity: 'low'    },
  { id: 'flooding',      label: 'Flooding',             icon: '🌊', severity: 'medium' },
  { id: 'accessibility', label: 'Accessibility Issue',  icon: '♿', severity: 'low'    },
  { id: 'other',         label: 'Other',                icon: '📝', severity: 'low'    },
]

// ── Trusted contact (mock) ─────────────────────────────────────────────────
export const TRUSTED_CONTACT = {
  name: 'Emma Thompson',
  relation: 'Trusted Contact',
  avatar: '👤',
}
