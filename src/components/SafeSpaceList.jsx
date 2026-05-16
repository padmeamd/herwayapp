import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Deterministic mock: derive women nearby from lightingScore
function womenNearby(space) {
  return Math.max(0, Math.floor((space.lightingScore - 60) / 8))
}

// Derive accessibility score from lightingScore + small fixed variation per id
function accessScore(space) {
  const seed = space.id.charCodeAt(space.id.length - 1)
  return Math.min(100, Math.round(space.lightingScore * 0.8 + seed % 15 + 5))
}

export default function SafeSpaceList({ safeSpaces, showSafeSpaces, onToggle }) {
  const [expandedId, setExpandedId] = useState(null)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">{safeSpaces.length} verified spaces nearby</p>
        <button
          onClick={onToggle}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
            showSafeSpaces
              ? 'border-safe/50 text-safe bg-safe/10'
              : 'border-white/10 text-gray-400 hover:border-safe/30 hover:text-safe'
          }`}
        >
          {showSafeSpaces ? '✓ Showing on map' : 'Show on map'}
        </button>
      </div>

      {safeSpaces.map((space) => {
        const isExpanded = expandedId === space.id
        const hasCCTV = space.features?.some(f => f.toLowerCase().includes('cctv'))
        const nearby = womenNearby(space)
        const access = accessScore(space)

        return (
          <div
            key={space.id}
            className="bg-card rounded-xl overflow-hidden cursor-pointer hover:bg-card-alt transition-colors"
            onClick={() => setExpandedId(isExpanded ? null : space.id)}
          >
            {/* Main row */}
            <div className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-safe/15 border border-safe/30 flex items-center justify-center text-lg flex-shrink-0">
                {space.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-white font-semibold text-sm truncate">{space.name}</span>
                  {space.womenVerified && (
                    <span className="text-safe text-[10px] font-bold bg-safe/10 border border-safe/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{space.type}</span>
                  <span>·</span>
                  <span>{space.distance}</span>
                  <span>·</span>
                  <span className={space.open ? 'text-safe' : 'text-danger'}>
                    {space.open ? `Open until ${space.openUntil}` : 'Closed'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-1 bg-bg rounded-lg px-2 py-1">
                  <span className="text-[10px]">💡</span>
                  <span className="text-safe text-[11px] font-bold">{space.lightingScore}</span>
                </div>
                <svg
                  className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Expanded detail */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 border-t border-white/5 pt-3 space-y-3">
                    {/* Badges row */}
                    <div className="flex gap-2 flex-wrap">
                      {hasCCTV && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue/15 text-blue border border-blue/20">
                          📹 CCTV
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-safe/10 text-safe border border-safe/20">
                        ♿ Accessibility {access}%
                      </span>
                      {nearby > 0 && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                          👭 {nearby} women nearby
                        </span>
                      )}
                      {space.open && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-safe/10 text-safe border border-safe/20">
                          🕐 Open now
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {space.description && (
                      <p className="text-gray-500 text-xs leading-relaxed">{space.description}</p>
                    )}

                    {/* Feature pills */}
                    {space.features?.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {space.features.map(f => (
                          <span key={f} className="text-gray-500 text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
