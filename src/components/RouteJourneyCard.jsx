import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration, formatDistance } from '../services/routingService'

function MiniScoreRing({ score, color }) {
  const r = 18
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="flex-shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#1C2436" strokeWidth="3.5" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
      <text x="22" y="24" textAnchor="middle" fill={color} fontSize="11" fontWeight="800">
        {score}
      </text>
    </svg>
  )
}

/**
 * Maps-style sticky route card: safety summary, alerts, expandable details, Start Journey CTA.
 */
export default function RouteJourneyCard({
  routes,
  safetyScores,
  selectedRouteIndex,
  route,
  safety,
  destination,
  isMobile,
  onRouteSelect,
  onStartJourney,
  onViewUnsafeDetail,
  onExpandDetails,
}) {
  const [expanded, setExpanded] = useState(false)

  if (!route || !routes?.length) return null

  const isSafe = safety?.isRecommended
  const isUnsafe = safety?.safetyClass === 'unsafe' && !safety?.isRecommended
  const color = isSafe ? '#22C55E' : '#EF4444'
  const alertCount = safety?.factorDetails?.incidents?.nearbyCount ?? 0

  return (
    <motion.div
      className="absolute left-0 right-0 z-[32] pointer-events-none route-journey-card"
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
    >
      <motion.div
        className="pointer-events-auto mx-3 rounded-t-3xl shadow-2xl border overflow-hidden route-journey-card-inner"
        style={{
          borderColor: color + '55',
          background: 'linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(8,12,20,0.99) 100%)',
          backdropFilter: 'blur(24px)',
          paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom), 10px)' : '12px',
        }}
        drag={isMobile ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.y < -36) setExpanded(true)
          if (info.offset.y > 48) setExpanded(false)
        }}
      >
        <motion.div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        <div
          className="flex justify-center py-2 cursor-grab active:cursor-grabbing lg:hidden"
          onClick={() => setExpanded(v => !v)}
        >
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Route switcher */}
        <div className="px-3 pb-2 flex gap-2 flex-shrink-0">
          {routes.map((_, i) => {
            const s = safetyScores[i]
            const safe = s?.isRecommended
            const c = safe ? '#22C55E' : '#EF4444'
            const selected = i === selectedRouteIndex
            return (
              <button
                key={i}
                type="button"
                onClick={() => onRouteSelect(i)}
                className={`flex-1 min-h-[44px] rounded-xl border px-2 py-2 text-left touch-manipulation transition-all ${
                  selected ? 'ring-2 ring-offset-1 ring-offset-[#0a1628]' : 'opacity-80'
                }`}
                style={{
                  borderColor: c + (selected ? 'cc' : '35'),
                  background: c + (selected ? '22' : '0a'),
                  ringColor: c,
                }}
              >
                <p className="text-[10px] font-black uppercase" style={{ color: c }}>
                  {safe ? '✦ Safe' : '⚠ Unsafe'}
                </p>
                <p className="text-white text-xs font-bold truncate">{s?.routeLabel}</p>
              </button>
            )
          })}
          {isMobile && (
            <button
              type="button"
              onClick={onExpandDetails}
              className="w-11 min-h-[44px] rounded-xl glass border border-white/10 text-gray-400 text-xs font-bold touch-manipulation flex-shrink-0"
              aria-label="Full route details"
            >
              ···
            </button>
          )}
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-start gap-3">
            <MiniScoreRing score={safety?.score ?? 0} color={color} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{ color, borderColor: color + '55', background: color + '15' }}
                >
                  {safety?.statusLabel ?? safety?.label}
                </span>
                {isSafe && (
                  <span className="text-[9px] font-black text-white bg-safe/80 px-1.5 py-0.5 rounded-full">
                    ✦ Recommended
                  </span>
                )}
                {alertCount > 0 && (
                  <span className="text-[9px] font-bold text-danger warning-blink px-1.5 py-0.5 rounded-full border border-danger/40 bg-danger/10">
                    {alertCount} alert{alertCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-white font-bold text-sm truncate">
                → {destination?.name ?? 'Destination'}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                {formatDuration(route.duration)} walk · {formatDistance(route.distance)}
              </p>
            </div>
          </div>

          {safety?.explanation && (
            <p className="text-gray-400 text-xs leading-relaxed mt-2 line-clamp-2">
              {safety.explanation}
            </p>
          )}

          {isUnsafe && (
            <button
              type="button"
              onClick={onViewUnsafeDetail}
              className="w-full mt-2 min-h-[40px] py-2 rounded-xl border border-danger/40 text-danger text-xs font-bold warning-blink touch-manipulation"
              style={{ background: 'rgba(239,68,68,0.08)' }}
            >
              Why is this route unsafe? ›
            </button>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <motion.div className="mt-3 space-y-2 pt-2 border-t border-white/5">
                  {safety?.features?.map((f, i) => (
                    <span
                      key={i}
                      className="inline-block mr-1.5 mb-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{ borderColor: color + '44', color, background: color + '0c' }}
                    >
                      {f}
                    </span>
                  ))}
                  {isSafe && (
                    <p className="text-gray-500 text-[11px] leading-relaxed">
                      This path bends around danger zones, uses busier lit streets, and passes near verified safe spaces.
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-4 pb-1">
          <button
            type="button"
            onClick={onStartJourney}
            className="w-full min-h-[54px] rounded-2xl font-black text-lg text-white touch-manipulation active:scale-[0.98] transition-transform"
            style={{
              background: isSafe
                ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              boxShadow: isSafe
                ? '0 8px 32px rgba(34,197,94,0.45), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 8px 32px rgba(239,68,68,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            Start Journey
          </button>
          <p className="text-center text-gray-600 text-[10px] mt-2 font-medium">
            {isSafe ? 'Live turn-by-turn · safety monitoring on' : 'Confirm to proceed on alert path'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
