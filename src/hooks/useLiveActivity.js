import { useState, useEffect } from 'react'

const LIVE_EVENTS = [
  { icon: '✅', text: 'Route via High Street verified safe', color: '#34D399', category: 'safety' },
  { icon: '👭', text: '3 women walking nearby on your route', color: '#A78BFA', category: 'community' },
  { icon: '☕', text: 'Oxford Covered Market — safe space open', color: '#60A5FA', category: 'space' },
  { icon: '🔆', text: 'Street lighting active on Cornmarket St', color: '#FBBF24', category: 'lighting' },
  { icon: '🛡️', text: 'Safe walk completed near Bodleian Library', color: '#34D399', category: 'community' },
  { icon: '👮', text: 'Police patrol active in Oxford city centre', color: '#60A5FA', category: 'safety' },
  { icon: '💬', text: '5 users confirmed Broad St is safe now', color: '#34D399', category: 'community' },
  { icon: '🚶‍♀️', text: 'Walk buddy available near Radcliffe Camera', color: '#A78BFA', category: 'community' },
  { icon: '📍', text: 'Safety check-in: Westgate Centre entrance', color: '#60A5FA', category: 'space' },
  { icon: '⭐', text: 'New top-rated route along Parks Road', color: '#FBBF24', category: 'safety' },
  { icon: '🏠', text: 'Ashmolean Museum open late — safe space', color: '#34D399', category: 'space' },
  { icon: '🚨', text: 'Report resolved: Botley Road now clear', color: '#34D399', category: 'safety' },
]

export function useLiveActivity() {
  const [activity, setActivity] = useState(null)

  useEffect(() => {
    let timeoutId

    const fire = () => {
      const event = { ...LIVE_EVENTS[Math.floor(Math.random() * LIVE_EVENTS.length)], id: Date.now() }
      setActivity(event)
      // Auto-dismiss after 6 seconds, then wait 8-16 more before next
      setTimeout(() => setActivity(null), 6000)
      timeoutId = setTimeout(fire, 14000 + Math.random() * 10000)
    }

    timeoutId = setTimeout(fire, 7000)
    return () => clearTimeout(timeoutId)
  }, [])

  return { activity, dismiss: () => setActivity(null) }
}
