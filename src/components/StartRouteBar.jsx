import { motion } from 'framer-motion'
import { formatDuration, formatDistance } from '../services/routingService'

/**
 * Google Maps–style sticky CTA shown when routes are ready and navigation has not started.
 */
export default function StartRouteBar({
  route,
  safety,
  destination,
  isMobile,
  onStartRoute,
}) {
  if (!route) return null

  const isSafe = safety?.isRecommended
  const color = isSafe ? '#22C55E' : '#EF4444'

  return (
    <motion.div
      className={`absolute left-0 right-0 z-[28] pointer-events-none ${
        isMobile ? 'bottom-0' : 'bottom-6'
      }`}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
      style={{ paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom), 8px)' : 0 }}
    >
      <motion.div
        className={`pointer-events-auto mx-auto shadow-2xl border overflow-hidden ${
          isMobile ? 'mx-3 rounded-2xl' : 'max-w-lg rounded-2xl'
        }`}
        style={{
          borderColor: color + '44',
          background: 'linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(8,12,20,0.99) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />

        <div className="px-4 pt-3 pb-3 flex items-center gap-3">
          <motion.div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 border"
            style={{
              backgroundColor: color + '18',
              borderColor: color + '55',
              color,
              boxShadow: `0 0 16px ${color}44`,
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isSafe ? '✦' : '⚠'}
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
              {safety?.routeLabel ?? (isSafe ? 'Safest route' : 'Unsafe route')}
            </p>
            <p className="text-white font-semibold text-sm truncate">
              → {destination?.name ?? 'Destination'}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {formatDuration(route.duration)} · {formatDistance(route.distance)}
            </p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onStartRoute}
            className="w-full min-h-[52px] rounded-2xl font-black text-lg text-white touch-manipulation active:scale-[0.98] transition-transform"
            style={{
              background: isSafe
                ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              boxShadow: isSafe
                ? '0 8px 32px rgba(34,197,94,0.45), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 8px 32px rgba(239,68,68,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            Start Route
          </button>
          {!isSafe && (
            <p className="text-center text-danger/80 text-[10px] mt-2 font-medium">
              Active safety alerts on this path
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
