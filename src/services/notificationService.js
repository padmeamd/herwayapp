// ntfy.sh — zero-registration, zero-token push notifications
// Docs: https://ntfy.sh/docs/
//
// How it works:
//   Sender:   POST https://ntfy.sh/{topic}  (this app)
//   Receiver: GET  https://ntfy.sh/{topic}  (trusted contact opens in browser/app)
//
// No account. No API key. Just an HTTP POST.

const NTFY_BASE = 'https://ntfy.sh'
const STORAGE_TOPIC = 'saferoute:ntfy_topic'
const STORAGE_CONTACT = 'saferoute:contact_name'

// ── Topic management ───────────────────────────────────────────────────────

export function generateTopic() {
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `saferoute-${hex}`
}

export function loadTopic() {
  return localStorage.getItem(STORAGE_TOPIC) ?? null
}

export function saveTopic(topic) {
  localStorage.setItem(STORAGE_TOPIC, topic)
}

export function getOrCreateTopic() {
  const existing = loadTopic()
  if (existing) return existing
  const topic = generateTopic()
  saveTopic(topic)
  return topic
}

export function loadContactName() {
  return localStorage.getItem(STORAGE_CONTACT) ?? 'Trusted Contact'
}

export function saveContactName(name) {
  localStorage.setItem(STORAGE_CONTACT, name.trim() || 'Trusted Contact')
}

// ── URL helpers ────────────────────────────────────────────────────────────

export function getSubscribeUrl(topic) {
  return `${NTFY_BASE}/${topic}`
}

// ── Core send ──────────────────────────────────────────────────────────────

/**
 * Send a notification to the given ntfy topic.
 * Returns { ok: boolean, error?: string }
 */
export async function sendNotification({ topic, title, body, priority = 'default', tags = [] }) {
  if (!topic) return { ok: false, error: 'No topic configured' }
  try {
    const headers = {
      'Title': title,
      'Priority': priority,
    }
    if (tags.length > 0) headers['Tags'] = tags.join(',')

    const res = await fetch(`${NTFY_BASE}/${topic}`, {
      method: 'POST',
      headers,
      body,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `ntfy responded ${res.status}: ${text}` }
    }
    return { ok: true }
  } catch (err) {
    // Likely a network/CORS issue — ntfy.sh allows cross-origin POSTs so this
    // usually means the user is offline.
    return { ok: false, error: err.message ?? 'Network error' }
  }
}

// ── Canned alerts ──────────────────────────────────────────────────────────

export async function sendEmergencyAlert({ topic, location, contactName }) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const mapsUrl = location
    ? `https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
    : null

  const lines = [
    '🚨 HerWay Emergency Mode activated.',
    contactName ? `${contactName} may need help.` : 'Your contact may need help.',
    location
      ? `📍 Location: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
      : '📍 Location not available.',
    mapsUrl ? `🗺️ Maps: ${mapsUrl}` : '',
    `🕐 Time: ${time}`,
  ].filter(Boolean).join('\n')

  return sendNotification({
    topic,
    title: '✦ HerWay Emergency Alert',
    body: lines,
    priority: 'urgent',
    tags: ['rotating_light', 'sos'],
  })
}

export async function sendTestAlert(topic) {
  return sendNotification({
    topic,
    title: '✦ HerWay — Connection Test',
    body: 'Your trusted contact setup is working. You will receive real alerts here when emergency mode is activated.',
    priority: 'default',
    tags: ['white_check_mark'],
  })
}

export async function sendLocationUpdate({ topic, location }) {
  if (!location) return { ok: false, error: 'No location' }
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const mapsUrl = `https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
  return sendNotification({
    topic,
    title: '📍 HerWay Location Update',
    body: `Updated location at ${time}\n🗺️ ${mapsUrl}`,
    priority: 'high',
    tags: ['round_pushpin'],
  })
}
