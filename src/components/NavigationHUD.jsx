import { motion } from 'framer-motion'
import { formatDuration, formatDistance } from '../services/routingService'

/** Floating navigation controls — recenter, overview, end — mobile-first. */
export default function NavigationHUD({
  isUnsafeRoute,
  progress,
  etaSeconds,
  distanceRemaining,
  destination,
  showOverview,
  onToggleOverview,
  onRecenter,
  onEnd,
}) {
  const routeColor = isUnsafeRoute ? '#EF4444' : '#22C55E'
  const progressPct = Math.round(progress * 100)

  return (
    <>
      {/* Top status pill */}
      <motion.div
        className="nav-hud-status absolute left-0 right-0 z-[35] flex justify-center pointer-events-none px-4"
        style={{ top: 'max(env(safe-area-inset-top), 56px)' }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg glass max-w-full"
          style={{ borderColor: routeColor + '44' }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
            style={{ background: routeColor, boxShadow: `0 0 8px ${routeColor}` }}
          />
          <span className="text-white text-xs font-bold truncate">
            {isUnsafeRoute ? 'Navigating · stay alert' : 'HerWay navigation'}
          </span>
          <span className="text-gray-500 text-[10px] flex-shrink-0">·</span>
          <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{ color: routeColor }}>
            {formatDuration(etaSeconds)}
          </span>
        </div>
      </motion.div>

      {/* Right floating controls */}
      <motion.div
        className="nav-hud-controls absolute right-3 z-[35] flex flex-col gap-2"
        style={{ bottom: 'calc(220px + env(safe-area-inset-bottom))' }}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <button
          type="button"
          onClick={onRecenter}
          title="Recenter on route"
          className="w-12 h-12 rounded-2xl glass border border-white/15 flex items-center justify-center text-lg shadow-lg touch-manipulation active:scale-95"
        >
          ⊕
        </button>
        <button
          type="button"
          onClick={onToggleOverview}
          title="Route overview"
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-sm font-bold shadow-lg touch-manipulation active:scale-95 ${
            showOverview ? 'border-safe/50 bg-safe/20 text-safe' : 'glass border-white/15 text-white'
          }`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={onEnd}
          title="End navigation"
          className="w-12 h-12 rounded-2xl bg-danger/90 border border-danger flex items-center justify-center text-white font-bold text-xs shadow-lg touch-manipulation active:scale-95"
        >
          End
        </button>
      </motion.div>

      {/* Compact progress chip (visible when panel collapsed on mobile) */}
      <motion.div
        className="nav-hud-progress absolute left-3 z-[35] pointer-events-none lg:hidden"
        style={{ bottom: 'calc(200px + env(safe-area-inset-bottom))' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="px-3 py-2 rounded-xl glass border border-white/10 text-center"
          style={{ borderColor: routeColor + '33' }}
        >
          <p className="text-[10px] text-gray-500">Remaining</p>
          <p className="text-sm font-bold text-white tabular-nums">{formatDistance(distanceRemaining)}</p>
          <div className="w-20 h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: routeColor }}
            />
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
