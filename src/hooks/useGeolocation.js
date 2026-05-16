import { useState, useEffect } from 'react'
import { DEFAULT_CENTER } from '../data/mockData'

export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      return
    }

    const onSuccess = (pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      setLoading(false)
    }

    const onError = (err) => {
      console.warn('Geolocation error:', err.message)
      // Fall back to default center so the app still works
      setLocation(DEFAULT_CENTER)
      setError(err.message)
      setLoading(false)
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000,
    })

    // Watch for movement
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    })

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { location, error, loading }
}
