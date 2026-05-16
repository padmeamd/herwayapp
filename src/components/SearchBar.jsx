import { useState, useEffect, useRef } from 'react'
import { geocodeSearch } from '../services/routingService'

export default function SearchBar({
  userLocation,
  destination,
  onDestinationSelect,
  onClear,
  isLoadingRoutes,
  placeholder = 'Where are you going?',
  showCurrentLocation = false,
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const debounceTimer = useRef(null)

  // Sync display value with external destination
  useEffect(() => {
    if (!focused) setQuery(destination?.name ?? '')
  }, [destination, focused])

  // Geocode as user types
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true)
      const r = await geocodeSearch(query, userLocation)
      setResults(r)
      setIsSearching(false)
    }, 380)
    return () => clearTimeout(debounceTimer.current)
  }, [query])

  const handleSelect = (place) => {
    setQuery(place.fullName ?? place.name)
    setResults([])
    setFocused(false)
    inputRef.current?.blur()
    onDestinationSelect(place)
  }

  const handleSelectCurrentLocation = () => {
    if (!userLocation) return
    handleSelect({
      id: 'current',
      name: 'My Location',
      fullName: 'My Current Location',
      lat: userLocation.lat,
      lng: userLocation.lng,
    })
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    onClear()
    inputRef.current?.focus()
  }

  const hasCurrentLocation = showCurrentLocation && userLocation
  const showDropdown = focused && (
    results.length > 0 ||
    isSearching ||
    (hasCurrentLocation && query.length === 0)
  )

  return (
    <div className="relative">
      {/* Input row */}
      <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
        focused
          ? 'border-primary/50 bg-card shadow-lg shadow-primary/10'
          : 'border-card bg-card hover:border-white/10'
      }`}>
        {isLoadingRoutes ? (
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
        ) : (
          <svg className={`w-4 h-4 flex-shrink-0 transition-colors ${focused ? 'text-primary' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); setQuery('') }}
          onBlur={() => setTimeout(() => { setFocused(false) }, 200)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm font-medium outline-none min-w-0"
          autoComplete="off"
        />
        {(query || destination) && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); handleClear() }}
            className="text-gray-500 hover:text-white transition-colors flex-shrink-0 touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/8 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-[200] animate-fade-in">

          {/* Current location — pinned at top when query is empty */}
          {hasCurrentLocation && query.length === 0 && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); handleSelectCurrentLocation() }}
              onTouchEnd={e => { e.preventDefault(); handleSelectCurrentLocation() }}
              className="w-full flex items-center gap-3 px-4 py-4 transition-colors text-left active:bg-primary/10 touch-manipulation"
              style={{ background: 'rgba(99,102,241,0.08)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.2)', border: '1.5px solid rgba(99,102,241,0.4)' }}>
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-primary text-sm font-bold">Use my current location</div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </div>
              </div>
              <svg className="w-4 h-4 text-primary/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Searching spinner */}
          {isSearching && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">Searching…</span>
            </div>
          )}

          {/* Results */}
          {results.map((r, i) => (
            <button
              type="button"
              key={r.id ?? i}
              onMouseDown={e => { e.preventDefault(); handleSelect(r) }}
              onTouchEnd={e => { e.preventDefault(); handleSelect(r) }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors text-left border-t border-white/5 touch-manipulation"
            >
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0 text-sm">
                {r.type === 'poi' ? '🏢' : '📍'}
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">{r.name}</div>
                <div className="text-gray-500 text-xs truncate">{r.fullName}</div>
              </div>
            </button>
          ))}

          {!isSearching && results.length === 0 && query.length >= 2 && (
            <div className="px-4 py-4 text-gray-500 text-sm text-center">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
