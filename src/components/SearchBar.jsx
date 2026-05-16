import { useState, useEffect, useRef } from 'react'
import { geocodeSearch } from '../services/routingService'

export default function SearchBar({ userLocation, destination, onDestinationSelect, onClear, isLoadingRoutes, placeholder = 'Where are you going?' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const debounceTimer = useRef(null)

  // Sync query display with destination
  useEffect(() => {
    if (!focused) setQuery(destination?.name ?? '')
  }, [destination, focused])

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

  const handleClear = () => {
    setQuery('')
    setResults([])
    onClear()
    inputRef.current?.focus()
  }

  const showDropdown = focused && (results.length > 0 || isSearching)

  return (
    <div className="relative">
      {/* Input */}
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
          onBlur={() => setTimeout(() => { setFocused(false) }, 180)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm font-medium outline-none min-w-0"
        />
        {(query || destination) && (
          <button onClick={handleClear} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 z-50 animate-fade-in">
          {isSearching && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">Searching...</span>
            </div>
          )}

          {/* Current location option */}
          {userLocation && query.length === 0 && (
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
              onMouseDown={() => handleSelect({ id: 'current', name: 'My Location', fullName: 'My Current Location', lat: userLocation.lat, lng: userLocation.lng })}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="text-primary text-sm font-semibold">Use my current location</div>
                <div className="text-gray-500 text-xs">{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</div>
              </div>
            </button>
          )}

          {results.map((r, i) => (
            <button
              key={r.id ?? i}
              onMouseDown={() => handleSelect(r)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left border-t border-white/5 first:border-t-0"
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
              No results for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
